#!/usr/bin/env python3
"""Real SQL checkout rejects unreviewed changes without orders or stock writes; synthetic fixture only."""
import json, os, uuid, urllib.request, urllib.error
BASE = os.environ['BASE_URL']
checks = []
def call(path, body=None, headers=None, method=None, expected=200):
    req = urllib.request.Request(BASE + path, data=None if body is None else json.dumps(body).encode(),
        headers={'Content-Type':'application/json', **(headers or {})}, method=method or ('GET' if body is None else 'POST'))
    try:
        with urllib.request.urlopen(req, timeout=30) as response: code, value = response.status, json.load(response)
    except urllib.error.HTTPError as error: code, value = error.code, json.load(error)
    assert code == expected, (path, code, value, expected)
    return value
def check(name): checks.append(name); print('PASS', name)
h = {'x-tenant':'atelier'}
ah = {**h, 'Authorization':'Bearer ' + os.environ['MERCHANT_TOKEN']}
c = call('/store-api/checkout/cart', {'session':uuid.uuid4().hex}, h)
h['sw-context-token'] = c['token']
c = call('/store-api/checkout/cart/line-item', {'items':[{'referencedId':'lamp','quantity':1}]}, h)
key = uuid.uuid4().hex
review = {**h,'Idempotency-Key':key,'x-commerce-cart-revision':str(c['revision']), 'x-commerce-total-minor':str(round(c['price']['totalPrice']*100))}
stock = call('/store-api/product/lamp', {}, h)['product']['stock']
orders = len(call('/api/search/order', {}, ah)['data'])
call('/store-api/checkout/order', {}, {**review,'x-commerce-total-minor':'1'}, expected=409)
call('/store-api/checkout/order', {}, {**review,'x-commerce-total-minor':'-1'}, expected=409)
call('/store-api/checkout/order', {}, {**review,'x-commerce-cart-revision':'0'}, expected=409)
call('/store-api/checkout/order', {}, {**review,'x-commerce-cart-revision':'invalid'}, expected=400)
call('/store-api/checkout/order', {}, {**h,'Idempotency-Key':key,'x-commerce-total-minor':'100'}, expected=400)
assert len(call('/api/search/order', {}, ah)['data']) == orders
assert call('/store-api/product/lamp', {}, h)['product']['stock'] == stock
check('Changed amount/revision and malformed partial review are rejected without orders or stock writes')
# Updating quantity invalidates the old review even when the caller supplies the new amount.
next_cart = call('/store-api/checkout/cart', {'revision':c['revision'],'items':[{'id':'lamp','quantity':2}]}, h, 'PUT')
call('/store-api/checkout/order', {}, {**review,'x-commerce-total-minor':str(round(next_cart['price']['totalPrice']*100))}, expected=409)
check('A stale cart revision cannot purchase an updated cart')
call('/store-api/checkout/order', {}, {**review,'x-tenant':'workshop'}, expected=404)
check('Reviewed cart tokens cannot purchase in a foreign tenant')
review.update({'x-commerce-cart-revision':str(next_cart['revision']), 'x-commerce-total-minor':str(round(next_cart['price']['totalPrice']*100))})
order = call('/store-api/checkout/order', {}, review)
assert call('/store-api/checkout/order', {}, {**review,'x-commerce-total-minor':'1'})['id'] == order['id']
assert call('/store-api/product/lamp', {}, h)['product']['stock'] == stock - 2
check('Explicit current review succeeds and replay returns the original order without a second reservation')
assert 'media' in next_cart['lineItems'][0]
assert next_cart['shippingMethodOptions'] and next_cart['paymentMethodOptions']
assert all('countries' in p for p in next_cart['paymentMethodOptions'])
check('Country-edit candidates and native cart media are part of the quote contract')

# The independent Checkout service calls these three Commerce operations.
tenant = {'x-tenant': 'atelier'}
def buyer():
    address = dict(name='Checkout fixture', firstName='Checkout', lastName='Fixture',
                   street='Fixture 3', city='Berlin', postalCode='10115', country='DE')
    account = call('/store-api/account/register', {
        'name': 'Checkout fixture', 'email': f'{uuid.uuid4().hex}@example.test',
        'password': 'Synthetic-Checkout-review-fixture!',
        'billingAddress': address, 'shippingAddress': address,
    }, tenant)
    identity = {**tenant, 'x-customer-token': account['customerToken']}
    return identity, call('/store-api/account/profile', headers=identity)['id']

identity, customer_id = buyer()
other, _ = buyer()
cart = call('/store-api/checkout/cart', {}, identity)
credentials = {**identity, 'sw-context-token': cart['token']}
cart = call('/store-api/checkout/cart/line-item',
            {'items': [{'referencedId': 'lamp', 'quantity': 1}]}, credentials)
host = '/store-api/checkout/session-'
binding = {'cartId': cart['id'], 'customerId': customer_id}
current = {**binding, 'cartRevision': cart['revision']}
quote = call(host + 'quote', current, credentials)
assert quote['totalMinor'] == cart['price']['totalMinor']
assert quote['legal'] == cart['legal']
recovery = {**binding, 'sessionId': str(uuid.uuid4())}
confirmation = {**current, 'sessionId': recovery['sessionId'], 'confirmed': True,
                **{field: quote[field] for field in
                   ('locale', 'currency', 'country', 'paymentMethod', 'legalPolicyVersion', 'totalMinor')}}
stock = call('/store-api/product/lamp', {}, tenant)['product']['stock']
call(host + 'receipt', recovery, identity, expected=404)
call(host + 'order', {**confirmation, 'legalPolicyVersion': '0' * 64}, credentials, expected=409)
call(host + 'order', {**confirmation, 'paypalSandbox': True}, credentials, expected=409)
assert call('/store-api/product/lamp', {}, tenant)['product']['stock'] == stock
check('The host quote matches native price and legal context, and changed policy or unsupported payment cannot reserve stock')
receipt = call(host + 'order', confirmation, credentials)
assert call(host + 'order', confirmation, credentials) == receipt
call(host + 'order', {**confirmation, 'totalMinor': '1'}, credentials, expected=409)
assert call(host + 'receipt', recovery, identity) == receipt
call(host + 'receipt', recovery, other, expected=404)
assert call('/store-api/product/lamp', {}, tenant)['product']['stock'] == stock - 1
check('One host order, one stock change and an exact receipt without the cart token; another buyer cannot recover it')
if os.getenv('CHECKOUT_IDENTITY_SHOPS'):
    from testing.checkout_buyer_identity import verify
    verify(BASE, call, identity, other, current, receipt, recovery)
    check('Checkout grants preserve buyer/shop binding, cannot replace a native login and stop working after logout')
if service := os.getenv('CHECKOUT_TEST_SERVICE_URL'):
    from testing.checkout_buyer_identity import verify_service
    verify_service(BASE, service, call, tenant)
    check('Standalone Checkout uses the actual HttpOnly buyer login, confirms one order and recovers it after a fresh login')
if os.getenv('REPORT_PATH'):
    from pathlib import Path
    Path(os.environ['REPORT_PATH']).write_text(json.dumps({'passed':len(checks),'checks':checks,'realMoneyCharged':False},indent=2)+'\n')
