"""Adversarial provider-neutral capture snapshots must leave native finance unchanged on rejection."""
import copy, time, uuid

def run(c):
    call,ah,behavior,sql=(c[k] for k in ('call','ah','behavior','sql'))
    manifest=copy.deepcopy(c['m']);manifest['version']='1.2.0'
    method=manifest['paymentProvider']['methods'][0];method['intent']='authorize';method['capabilities'].append('multi_capture')
    call('/api/apps',{'manifest':manifest},ah)
    order,shopper=c['purchase']();attempt=order['payment']['attemptId'];c['wait'](attempt,shopper,'ready')
    c['reference'][attempt]='approved';call('/store-api/payments/'+attempt+'/reconcile',{}, {**shopper,'Idempotency-Key':uuid.uuid4().hex})
    original=c['wait'](attempt,shopper,'authorized');total=original['amountMinor'];id='MCAP-'+attempt
    record={'id':id,'amountMinor':1,'currency':'EUR'}
    def reconcile(records,amount,ok,**extra):
        behavior.update(capturesFor=attempt,captureSnapshot={'status':'partially_captured','captures':records,'settledAmountMinor':amount,'captureClosed':False,'authorizationId':'AUTH-'+attempt,'authorizedAmountMinor':total,**extra})
        job=call('/api/payments/'+attempt+'/reconcile',{'approve':True},{**ah,'Idempotency-Key':uuid.uuid4().hex})['jobId']
        for _ in range(100):
            status=call('/api/payments/jobs/'+job,h=ah)
            if status['state'] in ('succeeded','uncertain','failed'):break
            time.sleep(.1)
        assert status['state']==('succeeded' if ok else 'uncertain'),status
    for rows,amount,extra in [
        ([dict(record,amountMinor=-1)],-1,{}),([dict(record,currency='USD')],1,{}),([record,record],2,{}),
        ([dict(record,amountMinor=total+1)],total+1,{}),([record],2,{}),
        ([dict(record,requestKey='unknown-native-job')],1,{}),([record],1,{'authorizedAmountMinor':total-1}),
    ]:
        reconcile(rows,amount,False,**extra)
        assert call('/store-api/payments/'+attempt,h=shopper)['state']=='authorized'
        assert sql("SELECT count(*) FROM payment_receipt_claims WHERE tenant='workshop' AND kind='capture' AND attempt_id='"+attempt+"';")=='0'
    reconcile([record],1,True)
    assert call('/store-api/payments/'+attempt,h=shopper)['capturedMinor']==1
    reconcile([dict(record,amountMinor=2)],2,False)
    assert call('/store-api/payments/'+attempt,h=shopper)['capturedMinor']==1
    reconcile([record],1,True)
    assert sql("SELECT count(*) FROM payment_receipt_claims WHERE tenant='workshop' AND kind='capture' AND attempt_id='"+attempt+"';")=='1'
    # A native capture job can acquire exactly one capture ID, even in a cumulative snapshot.
    behavior['captureSnapshot']={'status':'authorized','authorizationId':'AUTH-'+attempt,'authorizedAmountMinor':total,'capturePending':True}
    job=call('/api/payments/'+attempt+'/capture',{'approve':True,'amountMinor':1,'finalCapture':False},{**ah,'Idempotency-Key':uuid.uuid4().hex})['jobId']
    for _ in range(100):
        if any(x.get('attemptId')==attempt and x.get('operation')=='capture' for x in c['calls']):break
        time.sleep(.1)
    second={'id':'SECOND-'+attempt,'amountMinor':1,'currency':'EUR','requestKey':job}
    third={**second,'id':'THIRD-'+attempt}
    reconcile([record,second,third],3,False)
    assert call('/store-api/payments/'+attempt,h=shopper)['capturedMinor']==1
    reconcile([record,second],2,True)
    assert call('/api/payments/jobs/'+job,h=ah)['state']=='succeeded'
    assert call('/store-api/payments/'+attempt,h=shopper)['capturedMinor']==2
    behavior.clear()
    print('PASS Provider-neutral captures reject changed invoice/amount/currency, duplicate or unknown-job receipts atomically; replay is exact')
