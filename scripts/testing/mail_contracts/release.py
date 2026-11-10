"""Exercise purchase continuity while independent confirmation and the app worker are paused."""
import time
from uuid import uuid4


def verify_rollback(case, api, merchant, buyer, confirmation, original, invoice, stock,
                    checkout_headers, start_worker):
    def stock_count():
        return api("/store-api/product/mug", headers=merchant)["product"]["stock"]

    def orders():
        return {order["id"] for order in api("/api/search/order", {}, merchant)["data"]}

    account_path = f"/store-api/account/orders/{original['id']}"
    api("/store-api/checkout/independent/confirm", confirmation, buyer, expected=503)
    case.assertEqual(orders(), {original["id"]})
    case.assertEqual(stock_count(), stock - 1)
    receipt = api(account_path, headers=buyer)
    case.assertEqual(receipt["orderNumber"], original["orderNumber"])
    case.assertEqual([item["id"] for item in receipt["receipts"]], [invoice[0]["id"]])

    native_headers = checkout_headers("mug", "rollback-" + uuid4().hex)
    native = api("/store-api/checkout/order", {}, native_headers)
    replay = api("/store-api/checkout/order", {}, native_headers)
    case.assertEqual(native["id"], replay["id"])
    case.assertNotEqual(native["id"], original["id"])
    case.assertEqual(orders(), {original["id"], native["id"]})
    case.assertEqual(stock_count(), stock - 2)

    native_receipts = f"/api/merchant/orders/{native['id']}/receipts"
    case.assertEqual(api(native_receipts, headers=merchant)["elements"], [])
    case.assertEqual(len(case.smtp.messages), 1)
    start_worker()
    for _ in range(150):
        documents = api(native_receipts, headers=merchant)["elements"]
        if documents and len(case.smtp.messages) >= 2:
            break
        time.sleep(.1)
    case.assertEqual([document["kind"] for document in documents], ["invoice"])
    case.assertEqual(len(case.smtp.messages), 2)
    case.assertIn(native["orderNumber"].encode(), case.smtp.messages[1][1])
