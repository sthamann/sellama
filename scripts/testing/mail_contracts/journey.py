"""Native Rust checkout/outbox/Flow/MCP to Rust mail worker and loopback SMTP acceptance."""
import json
import os
import signal
import socket
import subprocess
import time
import urllib.parse
import uuid
from email import policy
from email.parser import BytesParser
from testing.mail_contracts.connector_database import independent_database
from testing.runtime import ROOT, serve, stop
from testing.reference_connector import email_config
from testing.mail_contracts.wire import http


class NativeMailJourney:
    def test_rust_api_mcp_permissions_checkout_and_real_order_flow(self):
        self.mail_journey()

    def test_independent_connector_and_worker_complete_native_checkout(self):
        if not os.getenv("CONNECTORS_BINARY"):
            self.skipTest("Set CONNECTORS_BINARY to the separately built Connector")
        self.mail_journey(standalone=True)

    def test_independent_checkout_and_connector_recover_order(self):
        checkout = os.getenv("CHECKOUT_TEST_BINARY")
        if not checkout or not os.getenv("CONNECTORS_BINARY"):
            self.skipTest("Set CHECKOUT_TEST_BINARY and CONNECTORS_BINARY to the separately built services")
        self.mail_journey(standalone=True, checkout=checkout)

    def test_independent_checkout_capture_drives_invoice_mail_and_refund(self):
        checkout = os.getenv("CHECKOUT_TEST_BINARY")
        if not checkout or not os.getenv("CONNECTORS_BINARY"):
            self.skipTest("Set CHECKOUT_TEST_BINARY and CONNECTORS_BINARY to the separately built services")
        self.mail_journey(standalone=True, checkout=checkout, paypal=True)

    def mail_journey(self, standalone=False, checkout=None, paypal=False):
        if not os.getenv("DATABASE_URL"):
            self.skipTest("DATABASE_URL required for real Rust/PostgreSQL path")
        from types import SimpleNamespace
        with socket.socket() as probe:
            probe.bind(("127.0.0.1", 0))
            service = SimpleNamespace(server_port=probe.getsockname()[1])
        with socket.socket() as sock:
            sock.bind(("127.0.0.1", 0))
            port = sock.getsockname()[1]
        base = "http://127.0.0.1:" + str(port)
        binary = os.getenv("CONNECTORS_BINARY", str(ROOT / "target/debug/connectors"))
        # Other running workers must never consume this fixture's flow jobs.
        database = "commerce_mail_" + uuid.uuid4().hex[:12]
        container = os.getenv("DB_CONTAINER", "veyndo-postgres-1")
        from testing.database import psql
        sql = lambda command: subprocess.run(
            psql(container, "commerce", "postgres", "-v", "ON_ERROR_STOP=1", "-c", command),
            check=True,
            capture_output=True,
        )
        sql("CREATE DATABASE " + database)
        self.addCleanup(lambda: sql("DROP DATABASE " + database + " WITH (FORCE)"))
        db_url = (
            urllib.parse.urlsplit(os.environ["DATABASE_URL"])
            ._replace(path="/" + database)
            .geturl()
        )
        env = {
            **os.environ,
            "DATABASE_URL": db_url,
            "BIND_ADDR": "127.0.0.1:" + str(port),
            "APP_SERVICES": json.dumps(
                {
                    "email": {
                        "url": "http://127.0.0.1:"
                        + str(service.server_port)
                        + "/email",
                        "token": self.connector.token,
                    }
                }
            ),
            "PROCESS_ROLE": "all",
        }
        if standalone:
            env["APP_WORKER_ENABLED"] = "false"
        suffix = uuid.uuid4().hex[:12]
        if checkout:
            from testing.mail_contracts import checkout as checkout_fixture
            connection, start_checkout = checkout_fixture.provision(
                self, container, suffix, checkout, base, db_url, paypal=paypal,
            )
            env.update(connection, COMMERCE_PUBLIC_ORIGIN=base)
            if paypal:
                provider, payment_env = checkout_fixture.payment_fixture(self, "mail-" + suffix)
                env.update(payment_env)
        mixed = standalone and not paypal and os.getenv("VEYNDO_MIXED_LOAD") == "1"
        if mixed:
            from testing.mail_contracts import mixed as workload
            env.update(OLLAMA_URL=workload.model(self), TENANT_CONCURRENCY="32",
                       INFERENCE_ALLOW_LOOPBACK="true", INFERENCE_MODEL="fixture")
            env.pop("OPENAI_API_KEY", None)
            env.pop("ANTHROPIC_API_KEY", None)
        log = open(self.temp.name + "/core.log", "w")
        self.addCleanup(log.close)
        backend = serve(env, base, log)
        self.addCleanup(stop, backend)

        def api(path, body=None, headers=None, method=None, expected=200):
            return http(base + path, body, headers, method, expected)

        # The actual standard service is Rust/PostgreSQL, not the archived Python oracle.
        service_env = {**env, **dict(self.env.in_dict), "CONNECTOR_DATABASE_URL": db_url,
                       "CONNECTOR_PORT": str(service.server_port)}
        service_env.pop("CONNECTOR_DATABASE", None)
        if standalone:
            connection, register_namespace = independent_database(
                self, container, uuid.uuid4().hex[:12], self.connector.token, binary, db_url,
            )
            service_env.update(connection)
        mail_log = open(self.temp.name + "/rust-mail.log", "w")
        self.addCleanup(mail_log.close)
        mail_service = subprocess.Popen([binary], cwd=ROOT,
                                       env=service_env, stdout=mail_log, stderr=mail_log)
        self.addCleanup(lambda: (mail_service.send_signal(signal.SIGINT), mail_service.wait(timeout=70)))
        for _ in range(100):
            try:
                http("http://127.0.0.1:" + str(service.server_port) + "/health")
                break
            except OSError:
                time.sleep(0.1)
        else:
            raise AssertionError("Rust connector did not start")
        user = api(
            "/api/auth/register",
            {
                "email": suffix + "@example.test",
                "password": "Synthetic-email-account-2026!",
                "name": "Email Owner",
                "workspaceId": "mail-" + suffix,
                "workspaceName": "Email test shop",
            },
        )
        tenant = user["workspace"]
        if standalone:
            self.assertEqual(tenant, "mail-" + suffix)
            register_namespace(tenant)
        h = {"Authorization": "Bearer " + user["token"], "x-tenant": tenant}
        if paypal:
            checkout_fixture.enable_payment(api, h, "payment-" + suffix)
        api("/api/apps", {"builtIn": "email"}, h)
        api("/api/apps/email/actions/status", {}, {"x-tenant": tenant}, expected=401)
        api(
            "/api/apps/email/actions/status",
            {},
            {**h, "x-tenant": "other-" + suffix},
            expected=403,
        )
        s = {**self.settings, "dryRun": False, "enabled": True}
        api("/api/apps/email/actions/configure", {"revision": 0, "settings": s}, h)
        tools = api("/mcp", {"jsonrpc": "2.0", "id": 1, "method": "tools/list"}, h)[
            "result"
        ]["tools"]
        self.assertIn("app.email.send_order", [t["name"] for t in tools])
        mcp = api(
            "/mcp",
            {
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {
                    "name": "app.email.send",
                    "arguments": {
                        "requestKey": "mcp-test",
                        "dryRun": True,
                        "message": {
                            "to": "buyer@example.test",
                            "subject": "MCP test",
                            "text": "No external delivery",
                        },
                    },
                },
            },
            h,
        )["result"]
        self.assertFalse(mcp.get("isError", False), mcp)
        self.assertEqual(mcp["structuredContent"]["state"], "accepted")
        flow = {
            "name": {l: "Email order" for l in email_config.LOCALES},
            "active": True,
            "event": "payment.captured" if paypal else "order.placed",
            "condition": {"type": "alwaysValid"},
            "action": "app_action",
            "instruction": {l: "Order email" for l in email_config.LOCALES},
            "locale": "en-GB",
            "appAction": {
                "app": "email",
                "action": "send_order",
                "arguments": {"locale": "de"},
            },
        }
        api("/api/automation/flows/mail_order", {"revision": 0, "data": flow}, h, "PUT")
        if standalone:
            api("/api/merchant/receipts/settings", {"revision": 0, "data": {
                "name": "Synthetic Flow Seller", "address": "Test 1, Berlin", "taxId": "TEST-ONLY",
            }}, h, "PUT")
            invoice = {k: v for k, v in flow.items() if k != "appAction"}
            invoice.update(action="pipeline", pipeline={"entry": "invoice", "nodes": [{
                "kind": "action", "id": "invoice", "action": "action.generate.document",
                "config": {"kind": "invoice"}, "next": None,
            }]})
            api("/api/automation/flows/mail_invoice", {"revision": 0, "data": invoice}, h, "PUT")

        def checkout_headers(product, key):
            ch = {"x-tenant": tenant}
            cart = api("/store-api/checkout/cart", {"session": key}, ch)
            ch["sw-context-token"] = cart["token"]
            cart = api("/store-api/checkout/cart/line-item",
                       {"items": [{"referencedId": product, "quantity": 1}]}, ch)
            api("/store-api/checkout/context", {"revision": cart["revision"],
                "checkout": {**cart["checkout"], "customerEmail": "buyer@example.test"},
            }, ch, "PUT")
            return {**ch, "Idempotency-Key": key}

        if checkout:
            checkout_process = start_checkout()
            method = checkout_fixture.PAYPAL_METHOD if paypal else None
            ch, confirmation = checkout_fixture.prepare(api, tenant, "mug", suffix, method)
            confirm_path = "/store-api/checkout/independent/confirm"
            stock = api("/store-api/product/mug", headers=h)["product"]["stock"]
            # The original client does not use the successful confirmation body.
            checkout_fixture.discard_confirmation(base + confirm_path, ch, confirmation)
            self.assertEqual(api("/store-api/product/mug", headers=h)["product"]["stock"], stock - 1)
            stop(checkout_process)
            start_checkout()
            recovered = api(confirm_path, confirmation, ch)
            if not paypal:
                self.assertEqual(recovered["paymentState"], "authorized")
            orders = api("/api/search/order", {}, h)["data"]
            self.assertEqual(len(orders), 1)
            order = orders[0]
            self.assertEqual(recovered["orderId"], order["id"])
            self.assertEqual(api("/store-api/product/mug", headers=h)["product"]["stock"], stock - 1)
        else:
            order_headers = checkout_headers("mug", "order-" + suffix)
            ch = order_headers
            order = api("/store-api/checkout/order", {}, order_headers)
        if standalone:
            self.assertFalse(self.smtp.messages)
            worker_env = {**env, "PROCESS_ROLE": "app-worker", "BOOTSTRAP_MODE": "serve"}
            del worker_env["APP_WORKER_ENABLED"]
            worker_log = open(self.temp.name + "/app-worker.log", "w")
            self.addCleanup(worker_log.close)
            def start_worker():
                process = subprocess.Popen([str(ROOT / "target/debug/veyndo")], cwd=ROOT,
                                           env=worker_env, stdout=worker_log, stderr=worker_log)
                self.addCleanup(stop, process)
                return process

            worker = start_worker()
            if not checkout:
                self.assertEqual(api("/store-api/checkout/order", {}, order_headers)["id"], order["id"])
        if paypal:
            attempt = recovered["paymentAttemptId"]
            self.assertEqual(order["payment"]["attemptId"], attempt)
            checkout_fixture.wait_payment(api, ch, attempt, "ready")
            api(f"/store-api/payments/{attempt}/reconcile", {"requestKey": attempt + ":unverified"}, ch)
            checkout_fixture.wait_payment(api, ch, attempt, "ready")
            receipt_path = f"/api/merchant/orders/{order['id']}/receipts"
            self.assertEqual(api(receipt_path, headers=h)["elements"], [])
            self.assertFalse(self.smtp.messages)
            captured = checkout_fixture.capture(api, ch, provider, attempt)
        for _ in range(150):
            if self.smtp.messages:
                break
            time.sleep(0.1)
        self.assertEqual(
            len(self.smtp.messages),
            1,
            {
                "flows": api("/api/automation", headers=h),
                "mail": api("/api/apps/email/actions/status", {}, h),
            },
        )
        self.assertIn(order["orderNumber"].encode(), self.smtp.messages[0][1])
        if standalone:
            for _ in range(100):
                runs = [job for job in api("/api/automation/executions", headers=h)["jobs"]
                        if job["flow"] == "mail_order"]
                if len(runs) == 1 and runs[0]["state"] == "completed":
                    break
                time.sleep(0.1)
            self.assertEqual([job["state"] for job in runs], ["completed"])
            receipt_path = f"/api/merchant/orders/{order['id']}/receipts"
            for _ in range(100):
                receipts = api(receipt_path, headers=h)["elements"]
                if receipts:
                    break
                time.sleep(.1)
            self.assertEqual(len(receipts), 1)
        message_id = BytesParser(policy=policy.default).parsebytes(self.smtp.messages[0][1])["Message-ID"]
        for _ in range(100):
            jobs = api("/api/apps/email/actions/status", {}, h)["jobs"]
            delivered = [job["result"] for job in jobs
                         if job["result"] and job["result"].get("messageId") == message_id]
            if delivered:
                break
            time.sleep(0.1)
        self.assertTrue(message_id)
        self.assertEqual([(result["provider"], result["outcome"]) for result in delivered],
                         [("smtp", "accepted")])
        if paypal:
            self.assertEqual(receipts[0]["kind"], "invoice")
            refund_path = f"/api/payments/{attempt}/refund"
            refund_headers = {**h, "Idempotency-Key": attempt + ":refund"}
            refund = {"approve": True, "amountMinor": captured["amountMinor"]}
            api(refund_path, refund, refund_headers)
            refunded = checkout_fixture.wait_payment(api, ch, attempt, "refunded")
            self.assertEqual(refunded["refundedMinor"], captured["amountMinor"])
            api(refund_path, refund, refund_headers)
            final = api(confirm_path, confirmation, ch)
            self.assertEqual((final["orderId"], final["paymentAttemptId"], final["paymentState"]),
                             (order["id"], attempt, "refunded"))
            self.assertEqual(len(api("/api/search/order", {}, h)["data"]), 1)
            self.assertEqual(api("/store-api/product/mug", headers=h)["product"]["stock"], stock - 1)
            self.assertEqual(api(receipt_path, headers=h)["elements"], receipts)
            self.assertEqual(len(self.smtp.messages), 1)
            return
        # Public legal declaration takes the actual outbox → email app → SMTP path.
        request = api("/store-api/legal/requests", {
            "kind": "withdrawal", "name": "Fixture Buyer", "email": "buyer@example.test",
            "reference": order["orderNumber"], "message": "I withdraw this contract.", "requestKey": "legal-" + suffix,
        }, ch)
        for _ in range(150):
            if len(self.smtp.messages) >= 2:
                break
            time.sleep(0.1)
        self.assertEqual(len(self.smtp.messages), 2)
        receipt_body = BytesParser(policy=policy.default).parsebytes(self.smtp.messages[1][1]).get_content()
        self.assertIn(request["id"], receipt_body)
        self.assertIn(b"receivedAt", self.smtp.messages[1][1])
        # Published read-only actions cannot be turned into a sending flow.
        flow["appAction"]["action"] = "status"
        api(
            "/api/automation/flows/rejected",
            {"revision": 0, "data": flow},
            h,
            "PUT",
            expected=400,
        )
        stage = api("/api/environments", {"name": "Mail staging"}, h)
        api("/api/apps", {"builtIn": "email"}, {**h, "x-tenant": stage["id"]})
        # No live external service writes in a staging shop.
        api(
            "/api/apps/email/actions/send",
            {
                "requestKey": "stage-send",
                "message": {
                    "to": "buyer@example.test",
                    "subject": "Blocked",
                    "text": "x",
                },
            },
            {**h, "x-tenant": stage["id"]},
            expected=400,
        )
        if mixed:
            if checkout:
                buyer = checkout_fixture.register_buyer(api, tenant, "mixed-" + suffix)

                def prepare_purchase(product, key):
                    headers, confirmation = checkout_fixture.prepare(api, tenant, product, key, buyer=buyer)

                    def purchase():
                        receipt, retries = checkout_fixture.confirm_with_backpressure(
                            base + confirm_path, headers, confirmation,
                        )
                        self.assertEqual(receipt["paymentState"], "authorized")
                        return {"id": receipt["orderId"], "orderNumber": receipt["orderNumber"]}, retries

                    return purchase
            else:
                def prepare_purchase(product, key):
                    headers = checkout_headers(product, "mixed-" + key)

                    def purchase():
                        result = api("/store-api/checkout/order", {}, headers)
                        self.assertFalse(result["payment"]["realMoneyCharged"])
                        return {"id": result["id"], "orderNumber": result["orderNumber"]}, 0

                    return purchase
            workload.measure(api, h, prepare_purchase, lambda: stop(worker), start_worker,
                             container, database, self.smtp.messages,
                             checkout_route="independent" if checkout else "native")
