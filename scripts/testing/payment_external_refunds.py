"""Admit provider-initiated refunds through actual HTTP/SQL; malicious receipts leave the ledger untouched."""
import time
import uuid


def run(ctx):
    call, purchase, wait, sql, ah, behavior, reference = (
        ctx[k] for k in ('call', 'purchase', 'wait', 'sql', 'ah', 'behavior', 'reference')
    )
    order, shopper = purchase()
    attempt = order['payment']['attemptId']
    wait(attempt, shopper, 'ready')
    reference[attempt] = 'approved'
    call('/store-api/payments/' + attempt + '/reconcile', {}, {**shopper, 'Idempotency-Key': uuid.uuid4().hex})
    original = wait(attempt, shopper, 'captured')
    refund = {'id': 'EXTERNAL-' + uuid.uuid4().hex, 'amountMinor': 1, 'currency': 'EUR'}

    def reconcile(rows, succeeds):
        behavior.update(refundsFor=attempt, refunds=rows)
        job = call('/api/payments/' + attempt + '/reconcile', {'approve': True}, {**ah, 'Idempotency-Key': uuid.uuid4().hex})['jobId']
        for _ in range(100):
            found = next(j for j in call('/api/payments', h=ah)['jobs'] if j['id'] == job)
            if found['state'] in ('succeeded', 'uncertain', 'failed'):
                break
            time.sleep(.1)
        assert found['state'] == ('succeeded' if succeeds else 'uncertain'), found

    for rows in [
        [dict(refund, amountMinor=-1)], [dict(refund, currency='USD')],
        [dict(refund, amountMinor=original['amountMinor'] + 1)], [refund, refund],
        [dict(refund, requestKey='foreign-or-unknown-job')], {'not': 'an array'},
    ]:
        reconcile(rows, False)
        assert call('/store-api/payments/' + attempt, h=shopper)['refundedMinor'] == 0
        assert sql("SELECT count(*) FROM payment_receipt_claims WHERE tenant='workshop' AND kind='refund' AND attempt_id='" + attempt + "';") == '0'

    reconcile([refund], True)
    assert call('/store-api/payments/' + attempt, h=shopper)['refundedMinor'] == 1
    reconcile([refund], True)
    assert call('/store-api/payments/' + attempt, h=shopper)['refundedMinor'] == 1
    reconcile([dict(refund, amountMinor=2)], False)
    assert call('/store-api/payments/' + attempt, h=shopper)['refundedMinor'] == 1
    behavior.clear()
    print('PASS External refund receipts reject invalid amounts/currency/jobs/duplicates atomically; repeated and altered receipts cannot double-count')
