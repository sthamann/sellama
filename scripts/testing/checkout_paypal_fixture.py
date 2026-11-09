"""Local PayPal wire fixture for the composed Checkout purchase and reconciliation."""
from contextlib import contextmanager
from copy import deepcopy
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from threading import Lock, Thread
from urllib.parse import parse_qs, urlsplit

PRIVATE_TOKEN = 'synthetic-private-checkout-provider-credential'


@contextmanager
def paypal_fixture(tenant):
    orders, refunds, remote_orders, lock = {}, {}, {}, Lock()

    class PayPal(BaseHTTPRequestHandler):
        def log_message(self, *_):
            pass

        def reply(self, value, status=200):
            body = json.dumps(value).encode()
            self.send_response(status)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Content-Length', str(len(body)))
            self.end_headers()
            self.wfile.write(body)

        def do_GET(self):
            with lock:
                order = orders.get(self.path.rsplit('/', 1)[-1])
                self.reply(order or {}, 200 if order else 404)

        def do_POST(self):
            raw = self.rfile.read(int(self.headers.get('Content-Length', 0)))
            if self.path == '/v1/oauth2/token':
                return self.reply({'access_token': 'synthetic-checkout-oauth'})
            body = json.loads(raw or b'{}')
            with lock:
                if self.path in ('/v1/onboarding', '/v1/payments/execute'):
                    return self.private_provider(body)
                if self.path == '/v2/checkout/orders':
                    context = body['payment_source']['paypal']['experience_context']
                    query = parse_qs(urlsplit(context['return_url']).query)
                    assert query['shop'] == [tenant] and query['paymentReturn'] == ['approved']
                    identifier = 'MOCK-' + body['purchase_units'][0]['custom_id']
                    result = orders.setdefault(identifier, {
                        'id': identifier, 'status': 'CREATED', 'purchase_units': body['purchase_units'],
                        'links': [{'rel': 'payer-action', 'href':
                                   'https://www.sandbox.paypal.com/checkoutnow?token=' + identifier}],
                    })
                    return self.reply(result)
                if self.path.endswith('/capture'):
                    order = orders[self.path.split('/')[-2]]
                    unit = order['purchase_units'][0]
                    assert order['status'] in ('APPROVED', 'COMPLETED')
                    order['status'] = 'COMPLETED'
                    unit['payments'] = {'captures': [{'id': 'CAP-' + order['id'],
                                        'status': 'COMPLETED', 'amount': deepcopy(unit['amount'])}]}
                    return self.reply(order)
                if self.path.endswith('/refund'):
                    key = self.headers['PayPal-Request-Id']
                    return self.reply(refunds.setdefault(key, {
                        'id': 'REF-' + str(len(refunds)), 'status': 'COMPLETED', 'amount': body['amount']}))
                self.reply({}, 404)

        def private_provider(self, body):
            assert self.headers['Authorization'] == 'Bearer ' + PRIVATE_TOKEN
            assert self.headers['x-tenant'] == body['tenant'] == tenant
            assert body['provider'] == 'shopware_payments'
            assert body['environment'] == 'contract-fixture'
            fields = ['apiVersion', 'provider', 'adapterVersion', 'tenant', 'environment']
            account = 'fixture-merchant-' + tenant
            if self.path == '/v1/onboarding':
                fields += ['channel']
                assert body['operation'] == 'start'
                return self.reply({**{key: body[key] for key in fields}, 'accountRef': account,
                                   'ready': True, 'status': 'ready', 'methods': ['paypal']})
            assert body['accountRef'] == account and body['method'] == 'paypal'
            fields += ['attemptId', 'orderId', 'accountRef', 'currency', 'amountMinor']
            attempt = body['attemptId']
            ref = 'REMOTE-' + attempt
            result = {**{key: body[key] for key in fields}, 'reference': ref, 'confirmed': True}
            operation = body['operation']
            if operation == 'create':
                query = parse_qs(urlsplit(body['returnUrl']).query)
                assert query['shop'] == [tenant] and query['paymentReturn'] == ['approved']
                remote_orders.setdefault(ref, 'ready')
                result.update(status='ready', approvalUrl='https://www.sandbox.paypal.com/checkoutnow?token=' + ref)
            elif operation == 'refund':
                assert remote_orders[ref] == 'captured'
                result.update(status='refunded', refund={'id': 'REFUND-' + body['requestKey'],
                              'amountMinor': body['input']['amountMinor'], 'currency': body['currency']})
            else:
                assert operation in ('reconcile', 'capture') and body['reference'] == ref
                if operation == 'capture':
                    assert remote_orders[ref] in ('approved', 'captured')
                    remote_orders[ref] = 'captured'
                result['status'] = remote_orders[ref]
                if result['status'] == 'captured':
                    result.update(captureId='CAP-' + attempt, settledAmountMinor=body['amountMinor'])
            return self.reply(result)

        def do_PUT(self):
            # Test runner alone uses this to model the buyer approving the provider page.
            if not self.path.startswith('/fixture/approve/'):
                return self.reply({}, 404)
            with lock:
                ref = self.path.rsplit('/', 1)[-1]
                if ref in remote_orders:
                    remote_orders[ref] = 'approved'
                else:
                    orders[ref]['status'] = 'APPROVED'
                self.reply({'approved': True})

    with ThreadingHTTPServer(('127.0.0.1', 0), PayPal) as server:
        worker = Thread(target=server.serve_forever, daemon=True)
        worker.start()
        try:
            yield f'http://127.0.0.1:{server.server_port}'
        finally:
            server.shutdown()
            worker.join(timeout=3)
