#!/usr/bin/env python3
"""Exercise independent Checkout and the native PayPal payment owner with synthetic provider responses."""
import base64
import json
import os
from pathlib import Path
import sys
from urllib.parse import urlsplit
from uuid import uuid4

from testing.app_approval import consent
from testing.checkout_paypal_fixture import PRIVATE_TOKEN, paypal_fixture
from testing.runtime import ROOT, artifact_path, run, serve, stop

env = dict(os.environ)
origin = env["BASE_URL"]
database = urlsplit(env["DATABASE_URL"])
assert urlsplit(origin).hostname in ("127.0.0.1", "localhost"), "Use an isolated local Core"
assert database.hostname in ("127.0.0.1", "localhost"), "Use a disposable local database"
component = Path(env["CHECKOUT_REPOSITORY"]).resolve()
workspace = "quote-" + uuid4().hex[:10]
manifest = json.loads((ROOT / "extensions/apps/shopware-payments/manifest.json").read_text())
with paypal_fixture(workspace) as provider, artifact_path("checkout-sandbox-composition.log").open("w") as log:
    fixture_env = {
        **env,
        "DEMO_CATALOG": "legacy-furniture",
        "SHOP_DOMAIN_SUFFIX": "veyndo.ai",
        "HOSTED_FRONTEND_ORIGIN": "http://127.0.0.1:1",
        "PAYPAL_ENVIRONMENT": "sandbox",
        "PAYPAL_SANDBOX_BASE_URL": provider,
        "PAYPAL_SANDBOX_ACCOUNTS": json.dumps({workspace: {
            "clientId": "synthetic-checkout", "clientSecret": "synthetic-fixture-only",
            "bnCode": "Checkout_Test_Only",
        }}),
        "CHECKOUT_ENABLE_PAYPAL_SANDBOX_PURCHASE": "true",
        "CHECKOUT_IDENTITY_SHOPS": workspace,
        "CHECKOUT_IDENTITY_KEY": base64.urlsafe_b64encode(os.urandom(32)).decode().rstrip("="),
        "CHECKOUT_INTROSPECTION_TOKEN": os.urandom(32).hex(),
        "PAYMENT_SERVICES": json.dumps({"shopware_payments": {manifest["version"]: {
            "contract-fixture": {"url": provider, "token": PRIVATE_TOKEN,
                                 "environment": "contract-fixture",
                                 "approvalOrigins": ["https://www.sandbox.paypal.com"]},
            "live": {"url": "https://127.0.0.1:1", "token": PRIVATE_TOKEN, "environment": "live"},
        }}}),
    }
    core = serve(fixture_env, origin, log)
    try:
        run([sys.executable, str(component / "service/tests/acceptance.py")], {
            **env,
            "CHECKOUT_TEST_ADMIN_URL": database._replace(path="/postgres").geturl(),
            "CHECKOUT_TEST_COMMERCE_ORIGIN": origin,
            "CHECKOUT_TEST_BINARY": env.get(
                "CHECKOUT_TEST_BINARY", str(component / "service/target/debug/veyndo-checkout-service")
            ),
            "CHECKOUT_TEST_WORKSPACE": workspace,
            "CHECKOUT_TEST_PAYPAL_FIXTURE": provider,
            "CHECKOUT_TEST_PAYPAL_APPROVAL": json.dumps(consent({"builtIn": "paypal"})),
            "CHECKOUT_TEST_SHOPWARE_PAYPAL_APPROVAL": json.dumps(consent({"builtIn": "shopware_payments"})),
        })
    finally:
        stop(core)
