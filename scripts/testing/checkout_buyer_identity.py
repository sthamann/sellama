"""Check native buyer exchange, private introspection and grant confinement through HTTP."""
import json
import os
from urllib.error import HTTPError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen


def verify(base, call, identity, other, current, receipt, recovery):
    store = "/store-api/checkout/session-"
    minted = call(store + "access", {}, identity)
    grant = minted["access_token"]
    assert grant.startswith("checkout-v1_") and identity["x-customer-token"] not in grant
    assert minted["audience"] == "veyndo-checkout" and minted["expires_in"] == 300

    def inspect(token, *, audience="veyndo-checkout", credential=None, expected=200):
        auth = credential or os.environ["CHECKOUT_INTROSPECTION_TOKEN"]
        request = Request(base + "/api/identity/checkout/introspect",
                          urlencode({"token": token, "token_type_hint": "access_token",
                                     "resource": audience}).encode(),
                          {"Content-Type": "application/x-www-form-urlencoded",
                           "Authorization": "Bearer " + auth})
        try:
            with urlopen(request, timeout=10) as response:
                assert response.status == expected and "no-store" in response.headers["Cache-Control"]
                return json.load(response)
        except HTTPError as error:
            assert error.code == expected, (error.code, expected)
            return None

    claims = inspect(grant)
    assert claims["active"] and claims["sub"] == current["customerId"]
    assert claims["tenant"] == identity["x-tenant"] and claims["aud"] == minted["audience"]
    assert "checkout.purchase.confirm" in claims["scope"].split()
    assert identity["x-customer-token"] not in json.dumps(claims)
    assert inspect(grant, credential="wrong-secret", expected=401) is None
    assert inspect(grant, audience="foreign-api") == {"active": False}
    assert inspect(identity["x-customer-token"]) == {"active": False}
    assert inspect(grant[:15] + ("A" if grant[15] != "A" else "B") + grant[16:]) == {"active": False}

    delegated = {**identity, "x-customer-token": grant}
    assert call(store + "receipt", recovery, delegated) == receipt
    call("/store-api/account/profile", headers=delegated, expected=401)
    call(store + "access", {}, delegated, expected=401)
    call(store + "receipt", recovery, {**delegated, "x-tenant": "workshop"}, expected=401)
    foreign = call(store + "access", {}, other)["access_token"]
    call(store + "receipt", recovery, {**other, "x-customer-token": foreign}, expected=404)
    call("/store-api/account/logout", {}, identity)
    assert inspect(grant) == {"active": False}
    call(store + "receipt", recovery, delegated, expected=401)


def verify_service(base, service, call, tenant):
    """Exercise the optional real Checkout service using a native HttpOnly buyer login."""
    from uuid import uuid4

    configured_origin = urlsplit(os.getenv("COMMERCE_PUBLIC_ORIGIN", ""))
    browser_origin = {"Origin": base}
    if configured_origin.scheme == "https":
        # The test connects to Core over loopback, as its TLS ingress would.
        browser_origin = {"Origin": f"https://{configured_origin.netloc}", "Host": configured_origin.netloc}

    def browser_login(path, body, cart_token=None):
        origin = {"x-veyndo-customer-session": "1", **browser_origin, **tenant}
        headers = {"Content-Type": "application/json", **origin}
        if cart_token:
            headers["sw-context-token"] = cart_token
        request = Request(base + "/store-api/account/" + path, json.dumps(body).encode(),
                          headers)
        with urlopen(request, timeout=10) as response:
            value = json.load(response)
            assert value["customerToken"] == "browser-customer-session"
            cookies = response.headers.get_all("Set-Cookie")
            assert any("HttpOnly" in cookie for cookie in cookies)
            if configured_origin.scheme == "https":
                assert all(cookie.startswith("__Host-") and "; Secure" in cookie for cookie in cookies)
        return {**origin, "Cookie": "; ".join(cookie.split(";")[0] for cookie in cookies),
                "x-veyndo-customer-csrf": value["customerBrowserCsrf"]}

    address = dict(name="Checkout Buyer", firstName="Checkout", lastName="Buyer",
                   street="Fixture 3", city="Berlin", postalCode="10115", country="DE")
    account = {"email": f"{uuid4().hex}@example.test", "password": "Synthetic-Checkout-review-fixture!"}
    browser = browser_login("register", {**account, "name": "Checkout Buyer",
                                          "billingAddress": address, "shippingAddress": address})
    issue = "/store-api/checkout/session-access"
    call(issue, {}, {**browser, "Origin": "https://foreign.example.test"}, expected=403)
    call(issue, {}, {**browser, "x-veyndo-customer-csrf": "wrong"}, expected=401)
    grant = call(issue, {}, browser)["access_token"]
    cart = call("/store-api/checkout/cart", {"session": uuid4().hex}, browser)
    cart_headers = {**browser, "sw-context-token": cart["token"]}
    cart = call("/store-api/checkout/cart/line-item",
                {"items": [{"referencedId": "lamp", "quantity": 1}]}, cart_headers)

    def checkout(path, body, credential=grant, *, cart_token=False, expected=200):
        headers = {"Content-Type": "application/json", "Authorization": "Bearer " + credential,
                   "x-customer-token": credential}
        if cart_token:
            headers["sw-context-token"] = cart["token"]
        request = Request(service + path, json.dumps(body).encode(), headers)
        try:
            with urlopen(request, timeout=20) as response:
                assert response.status == expected
                return json.load(response)
        except HTTPError as error:
            assert error.code == expected, (path, error.code, expected, error.read().decode())
            return None

    session = checkout("/v1/sessions", {"requestKey": uuid4().hex, "expiresIn": 3600,
        "context": {"cart": {"backend": "native", "id": cart["id"], "revision": cart["revision"]},
                    "salesChannel": "default", "environment": "live", "locale": cart["locale"],
                    "currency": cart["price"]["currency"], "country": cart["checkout"]["country"]}})
    key = {"id": session["id"]}
    review = {**key, "revision": session["revision"]}
    quote = checkout("/v1/sessions/quote", review, cart_token=True)
    assert quote["totalMinor"] == cart["price"]["totalMinor"]
    confirmation = {**review, "confirmed": True, **{k: quote[k] for k in
                    ("totalMinor", "country", "paymentMethod", "legalPolicyVersion")}}
    stock = call("/store-api/product/lamp", {}, tenant)["product"]["stock"]
    receipt = checkout("/v1/sessions/confirm", confirmation, cart_token=True)
    assert checkout("/v1/sessions/confirm", confirmation, cart_token=True) == receipt
    assert checkout("/v1/sessions/receipt", key) == receipt
    assert call("/store-api/product/lamp", {}, tenant)["product"]["stock"] == stock - 1
    call("/store-api/account/logout", {}, browser)
    checkout("/v1/sessions/receipt", key, expected=401)
    fresh_cart = call("/store-api/checkout/cart", {}, tenant)
    assert fresh_cart["lineItems"] == []
    fresh = browser_login("login", account, fresh_cart["token"])
    fresh_grant = call(issue, {}, fresh)["access_token"]
    assert checkout("/v1/sessions/receipt", key, fresh_grant) == receipt
