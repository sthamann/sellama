"""Start independent Checkout on its own database and prepare a real Core purchase."""
import base64
import json
import os
import secrets
import socket
import subprocess
import time
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

from testing.database import psql
from testing.runtime import stop


PAYPAL_METHOD = "shopware-payments-paypal"


def provision(case, container, suffix, binary, core_origin, core_url, paypal=False):
    database = "mail_checkout_" + suffix
    role = "mail_checkout_login_" + suffix
    password = secrets.token_hex(24)
    broker = secrets.token_hex(32)
    with socket.socket() as listener:
        listener.bind(("127.0.0.1", 0))
        port = listener.getsockname()[1]
    address = f"127.0.0.1:{port}"
    origin = "http://" + address

    def sql(statement, db="postgres", *options):
        return subprocess.check_output(
            psql(container, "commerce", db, "-XqAt", "-v", "ON_ERROR_STOP=1", *options),
            input=statement, text=True,
        ).strip()

    sql(f"CREATE DATABASE {database};")
    case.addCleanup(sql, f"DROP DATABASE {database} WITH (FORCE); DROP ROLE IF EXISTS {role};")
    sql(f"CREATE ROLE {role} LOGIN NOINHERIT NOSUPERUSER NOBYPASSRLS PASSWORD '{password}';")
    schema = subprocess.check_output([binary, "--print-schema"], text=True)
    sql(schema, database, "-v", "session_role=" + role)
    key_id, key = sql("SELECT id||'|'||secret FROM public.veyndo_scope_key();", database).split("|")
    url = urlsplit(core_url)
    endpoint = url._replace(
        netloc=f"{role}:{password}@{url.hostname}:{url.port or 5432}", path="/" + database,
    ).geturl()
    checkout_env = {
        **os.environ,
        "CHECKOUT_BIND": address,
        "CHECKOUT_DATABASE_URL": endpoint,
        "CHECKOUT_DATABASE_ROLE": role,
        "CHECKOUT_SCOPE_KEY_ID": key_id,
        "CHECKOUT_SCOPE_KEY": key,
        "CHECKOUT_AUDIENCE": "veyndo-checkout",
        "CHECKOUT_INTROSPECTION_URL": core_origin + "/api/identity/checkout/introspect",
        "CHECKOUT_INTROSPECTION_TOKEN": broker,
        "CHECKOUT_COMMERCE_ORIGIN": core_origin,
        "CHECKOUT_ENABLE_SIMULATED_PURCHASE": "true",
        "CHECKOUT_ENABLE_PAYPAL_SANDBOX_PURCHASE": "true" if paypal else "false",
    }
    log = open(case.temp.name + "/checkout.log", "w")
    case.addCleanup(log.close)

    def start():
        process = subprocess.Popen([binary], env=checkout_env, stdout=log, stderr=log)
        case.addCleanup(stop, process)
        for _ in range(100):
            if process.poll() is not None:
                break
            try:
                with urlopen(origin + "/ready", timeout=1) as response:
                    if response.status == 204:
                        return process
            except OSError:
                time.sleep(.1)
        raise AssertionError("Independent Checkout did not become ready")

    return {
        "CHECKOUT_PRIVATE_ORIGIN": origin,
        "CHECKOUT_IDENTITY_SHOPS": "mail-" + suffix,
        "CHECKOUT_IDENTITY_KEY": base64.urlsafe_b64encode(secrets.token_bytes(32)).decode().rstrip("="),
        "CHECKOUT_INTROSPECTION_TOKEN": broker,
    }, start


def prepare(api, tenant, product, suffix, method=None):
    headers = {"x-tenant": tenant}
    address = {
        "name": "Fixture Buyer", "firstName": "Fixture", "lastName": "Buyer",
        "street": "Fixture 3", "city": "Berlin", "postalCode": "10115", "country": "DE",
    }
    account = api("/store-api/account/register", {
        "email": f"buyer-{suffix}@example.test", "name": "Fixture Buyer",
        "password": "Synthetic-Checkout-mail-fixture!", "billingAddress": address,
        "shippingAddress": address,
    }, headers)
    headers["x-customer-token"] = account["customerToken"]
    cart = api("/store-api/checkout/cart", {}, headers)
    headers["sw-context-token"] = cart["token"]
    cart = api("/store-api/checkout/cart/line-item", {
        "items": [{"referencedId": product, "quantity": 1}],
    }, headers)
    if method:
        cart = api("/store-api/checkout/context", {
            "revision": cart["revision"],
            "checkout": {**cart["checkout"], "paymentMethodId": method},
        }, headers, "PUT")
    assert cart["checkoutService"]["transport"] == "same-origin"
    checkout = cart["checkout"]
    session = api("/store-api/checkout/independent/create", {
        "requestKey": "mail-checkout-" + suffix,
        "expiresIn": 3600,
        "context": {
            "cart": {"backend": "native", "id": cart["id"], "revision": cart["revision"]},
            "salesChannel": "default", "environment": "live", "locale": cart["locale"],
            "currency": cart["price"]["currency"], "country": checkout["country"],
        },
    }, headers)
    confirmation = {
        "id": session["id"], "revision": session["revision"], "confirmed": True,
        "totalMinor": cart["price"]["totalMinor"], "country": checkout["country"],
        "paymentMethod": checkout["paymentMethodId"],
        "legalPolicyVersion": cart["checkoutService"]["legalPolicyVersion"],
    }
    if method:
        confirmation["paypalSandbox"] = True
    return headers, confirmation


def discard_confirmation(url, headers, body):
    request = Request(url, json.dumps(body).encode(),
                      {"Content-Type": "application/json", **headers})
    with urlopen(request, timeout=15) as response:
        assert response.status == 200


def payment_fixture(case, tenant):
    from testing.checkout_paypal_fixture import PRIVATE_TOKEN, paypal_fixture
    from testing.runtime import ROOT

    provider = case.enterContext(paypal_fixture(tenant))
    manifest = json.loads((ROOT / "extensions/apps/shopware-payments/manifest.json").read_text())
    config = {"shopware_payments": {manifest["version"]: {"contract-fixture": {
        "url": provider, "token": PRIVATE_TOKEN, "environment": "contract-fixture",
        "approvalOrigins": ["https://www.sandbox.paypal.com"],
    }}}}
    return provider, {"PAYMENT_SERVICES": json.dumps(config), "CHECKOUT_ENABLE_PAYPAL_SANDBOX_PURCHASE": "true"}


def enable_payment(api, merchant, key):
    api("/api/apps", {"builtIn": "shopware_payments"}, merchant)
    account = api("/api/payment-providers/shopware_payments/onboarding", {
        "operation": "start", "environment": "contract-fixture", "channel": "default",
        "country": "DE", "requestKey": key, "approve": True,
    }, merchant)
    assert account["ready"] and account["methods"] == ["paypal"]
    commerce = api("/api/merchant/commerce", headers=merchant)
    next(p for p in commerce["data"]["payments"] if p["id"] == PAYPAL_METHOD)["active"] = True
    api("/api/merchant/commerce", commerce, merchant, "PUT")


def wait_payment(api, headers, attempt, state):
    path = "/store-api/payments/" + attempt
    for _ in range(120):
        payment = api(path, headers=headers)
        if payment["state"] == state:
            return payment
        time.sleep(.1)
    raise AssertionError(f"Expected payment state {state}, got {payment['state']}")


def capture(api, headers, provider, attempt):
    approval = provider + "/fixture/approve/REMOTE-" + attempt
    with urlopen(Request(approval, b"{}", method="PUT"), timeout=5) as response:
        assert json.load(response)["approved"]
    path = "/store-api/payments/" + attempt + "/reconcile"
    body = {"requestKey": attempt + ":return"}
    api(path, body, headers)
    captured = wait_payment(api, headers, attempt, "captured")
    assert captured["environment"] == "contract-fixture" and not captured["realMoneyCharged"]
    api(path, body, headers)
    return captured
