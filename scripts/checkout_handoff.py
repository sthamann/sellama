#!/usr/bin/env python3
"""Exercise actual PostgreSQL checkout transfer, isolation, replay and durable ordering."""
from testing.database import psql
import concurrent.futures, hashlib, json, os, subprocess, urllib.request, urllib.error, uuid
BASE=os.getenv('BASE_URL','http://127.0.0.1:8787');checks=[]
def call(path,body=None,h=None,method=None,expected=200):
    request=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json',**(h or {})},method=method or ('GET' if body is None else 'POST'))
    try:
        with urllib.request.urlopen(request,timeout=20) as r: code=r.status;value=json.load(r)
    except urllib.error.HTTPError as e: code=e.code;value=json.load(e)
    if expected is not None:assert code==expected,(path,code,value,expected)
    return value if expected is not None else (code,value)
def check(s):checks.append(s);print('PASS',s)
def user():return call('/api/auth/register',{'email':uuid.uuid4().hex+'@example.test','name':'Handoff test','password':'Synthetic-checkout-2026!','workspaceId':'handoff-'+uuid.uuid4().hex[:12],'workspaceName':'Checkout test shop'})
u=user();other=user();h={'x-tenant':u['workspace']};mh={**h,'Authorization':'Bearer '+u['token']}
def cart():
    c=call('/store-api/checkout/cart',{'session':uuid.uuid4().hex},h);ch={**h,'sw-context-token':c['token']}
    c=call('/store-api/checkout/cart',{'revision':c['revision'],'items':[{'id':'mug-sage-350','quantity':2}]},ch,'PUT');return c,ch
def issue(c,ch):
    result=call('/store-api/checkout/handoff',{'revision':c['revision']},ch)
    assert result['checkoutPath'].startswith('/checkout?shop='+u['workspace']+'&channel=default&language=en-GB#checkout/'),result
    with urllib.request.urlopen(BASE+'/checkout',timeout=20) as page:
        assert page.status==200 and page.headers.get('content-type','').startswith('text/html')
        assert '<div id="root"></div>' in page.read().decode()
    return result['checkoutPath'].split('#checkout/')[1]
c=call('/store-api/checkout/cart',{'session':'empty'},h);call('/store-api/checkout/handoff',{'revision':c['revision']},{**h,'sw-context-token':c['token']},expected=409)
c,ch=cart();call('/store-api/checkout/handoff',{'revision':c['revision']-1},ch,expected=409);check('Empty and stale carts cannot issue a transfer')
ticket=issue(c,ch);call('/store-api/checkout/handoff/consume',{'ticket':ticket},{'x-tenant':other['workspace']},expected=410)
old=ticket;ticket=issue(c,ch);call('/store-api/checkout/handoff/consume',{'ticket':old},h,expected=410);check('Tickets are tenant scoped and reissue revokes the previous transfer')
digest=hashlib.sha256(ticket.encode()).hexdigest()
subprocess.run(psql(os.getenv('DB_CONTAINER','veyndo-postgres-1'),'commerce',os.getenv('TEST_DATABASE','commerce'),'-q','-c',f"UPDATE checkout_handoffs SET expires_at=now()-interval '1 second' WHERE digest='{digest}'"),check=True,capture_output=True)
call('/store-api/checkout/handoff/consume',{'ticket':ticket},h,expected=410);check('Expired transfers fail against database time')
ticket=issue(c,ch)
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:results=list(pool.map(lambda _:call('/store-api/checkout/handoff/consume',{'ticket':ticket},h,expected=None),range(2)))
assert sorted(code for code,_ in results)==[200,410],results
new=next(v for code,v in results if code==200);assert new['id']==c['id'] and new['token']!=c['token'] and new['revision']==c['revision']+1
assert new['lineItems'][0]['id']=='mug-sage-350' and new['lineItems'][0]['quantity']==2
call('/store-api/checkout/cart',h=ch,expected=404);call('/store-api/checkout/handoff/consume',{'ticket':ticket},h,expected=410);check('Exactly one concurrent consumer wins and the original cart token is revoked')
nh={**h,'sw-context-token':new['token'],'Idempotency-Key':uuid.uuid4().hex}
o=call('/store-api/checkout/order',{},nh);assert o['cart']['lineItems'][0]['referencedId']=='mug-sage-350'
assert call('/store-api/checkout/order',{},nh)['id']==o['id']
orders=call('/api/search/order',{},mh)['data'];assert any(x['id']==o['id'] for x in orders)
call('/store-api/checkout/handoff',{'revision':new['revision']},{**h,'sw-context-token':new['token']},expected=409);check('Transferred cart places one durable merchant order and terminal carts cannot transfer')
# The embedded checkout is permitted only by this tenant/channel's registered frontend.
alias='embedded-'+uuid.uuid4().hex[:12]
call('/api/settings/frontends',{'alias':alias,'channel':'default','revision':0},mh,'PUT')
origin='https://'+alias+'.veyndo.ai'
from urllib.parse import urlencode
def frame_url(parent,shop=u['workspace'],channel='default'):
 return BASE+'/checkout?'+urlencode({'shop':shop,'channel':channel,'parentOrigin':parent,'embed':'1'})
with urllib.request.urlopen(frame_url(origin),timeout=20) as page:
 assert page.status==200 and ('frame-ancestors \'self\' '+origin) in page.headers['content-security-policy']
 assert page.headers['cache-control']=='no-store' and page.headers['referrer-policy']=='no-referrer'
for parent,shop,channel in [('https://foreign.veyndo.ai',u['workspace'],'default'),(origin,other['workspace'],'default'),(origin,u['workspace'],'unknown'),('https://'+alias+'.veyndo.ai.evil.test',u['workspace'],'default'),(origin+'/path',u['workspace'],'default'),(origin+':8443',u['workspace'],'default')]:
 try: urllib.request.urlopen(frame_url(parent,shop,channel),timeout=20);raise AssertionError('Unregistered parent admitted')
 except urllib.error.HTTPError as e: assert e.code in [400,403],e.code
check('Embedded checkout admits only the exact registered tenant/channel origin')
# The parent has only its recovery key and receives no completion message from the frame.
def hosted_cart():
    initial, headers = cart()
    reply = call('/store-api/checkout/handoff', {'revision':initial['revision'],'parentOrigin':origin}, headers)
    return initial, reply['recovery'], reply['checkoutPath'].split('#checkout/')[1]
def recover(key, headers=h, parent=origin, reopen=False, expected=200):
    return call('/store-api/checkout/handoff/recover', {**key,'parentOrigin':parent,'reopen':reopen}, headers, expected=expected)
initial, recovery, ticket = hosted_cart()
frame = call('/store-api/checkout/handoff/consume', {'ticket':ticket}, h)
assert recover(recovery) == {'state':'open'}
assert recovery['key'] != initial['token'] and recovery['key'] != frame['token']
recover({**recovery,'key':uuid.uuid4().hex},expected=404)
recover(recovery,parent='https://foreign.veyndo.ai',expected=403)
other_alias='other-'+uuid.uuid4().hex[:12]
other_h={'x-tenant':other['workspace']}
call('/api/settings/frontends',{'alias':other_alias,'channel':'default','revision':0},
     {**other_h,'Authorization':'Bearer '+other['token']},'PUT')
recover(recovery,other_h,'https://'+other_alias+'.veyndo.ai',expected=404)
forged={**h,'sw-context-token':recovery['key']}
call('/store-api/checkout/cart',h=forged,expected=404)
call('/store-api/checkout/handoff/consume',{'ticket':recovery['key']},h,expected=410)
replacement=recover(recovery,reopen=True)
assert replacement['state']=='open' and 'checkoutPath' in replacement
frame_headers={**h,'sw-context-token':frame['token'],'Idempotency-Key':uuid.uuid4().hex}
call('/store-api/checkout/cart',h=frame_headers,expected=404)
assert call('/store-api/checkout/order',{},frame_headers,expected=None)[0] in (400,404,409)
replacement_cart=call('/store-api/checkout/handoff/consume',{'ticket':replacement['checkoutPath'].split('#checkout/')[1]},h)
assert replacement_cart['id']==initial['id'] and replacement_cart['token']!=frame['token']
confirmed=call('/store-api/checkout/order',{}, {**h,'sw-context-token':replacement_cart['token'],'Idempotency-Key':uuid.uuid4().hex})
assert recover(recovery,reopen=True)=={'state':'ordered','completion':{'cartId':initial['id'],'orderId':confirmed['id'],'token':replacement_cart['token']}}
assert recover(recovery)['completion']['orderId']==confirmed['id']
check('A hosted checkout recovers the original order without a browser message and protects its capability and scope')
initial, recovery, ticket = hosted_cart()
frame = call('/store-api/checkout/handoff/consume',{'ticket':ticket},h)
frame_headers={**h,'sw-context-token':frame['token'],'Idempotency-Key':uuid.uuid4().hex}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    purchase=pool.submit(call,'/store-api/checkout/order',{},frame_headers,expected=None)
    reopening=pool.submit(recover,recovery,reopen=True)
    code, order=purchase.result()
    resumed=reopening.result()
if code==200:
    assert resumed['state']=='ordered' and resumed['completion']['orderId']==order['id']
else:
    assert code in (400,404,409) and resumed['state']=='open'
    fresh=call('/store-api/checkout/handoff/consume',{'ticket':resumed['checkoutPath'].split('#checkout/')[1]},h)
    assert fresh['id']==initial['id']
    order=call('/store-api/checkout/order',{}, {**frame_headers,'sw-context-token':fresh['token']})
assert recover(recovery)['completion']['orderId']==order['id']
assert sum(x['id']==order['id'] for x in call('/api/search/order',{},mh)['data'])==1
subprocess.run(psql(os.getenv('DB_CONTAINER','veyndo-postgres-1'),'commerce',os.getenv('TEST_DATABASE','commerce'),'-q','-c',
    f"UPDATE checkout_handoffs SET recovery_expires_at=clock_timestamp()-interval '1 second' WHERE cart_id='{initial['id']}'"),check=True,capture_output=True)
recover(recovery,expected=404)
check('Concurrent purchase and reopen either recover the placed order or fence the old frame; expired recovery is denied')
# Rebranding keeps machine calls on their original host and retains the same native tenant admission.
legacy='migration.previous.test'
legacy_cart=call('/store-api/checkout/cart',{'session':uuid.uuid4().hex},{'Host':u['workspace']+'.'+legacy})
stored=subprocess.run(psql(os.getenv('DB_CONTAINER','veyndo-postgres-1'),'commerce',os.getenv('TEST_DATABASE','commerce'),'-Atc',f"SELECT tenant FROM carts WHERE id='{legacy_cart['id']}'"),check=True,capture_output=True,text=True).stdout.strip()
assert stored==u['workspace'],stored
call('/store-api/context',h={'Host':other['workspace']+'.'+legacy,'x-tenant':u['workspace']},expected=400)
legacy_origin='https://'+alias+'.'+legacy
with urllib.request.urlopen(frame_url(legacy_origin),timeout=20) as page:
 assert page.status==200 and ('frame-ancestors \'self\' '+legacy_origin) in page.headers['content-security-policy']
for parent,shop in [('https://foreign.'+legacy,u['workspace']),(legacy_origin,other['workspace'])]:
 try: urllib.request.urlopen(frame_url(parent,shop),timeout=20);raise AssertionError('Foreign legacy parent admitted')
 except urllib.error.HTTPError as e: assert e.code in [400,403],e.code
check('Legacy API hosts preserve the exact tenant and registered checkout origin; foreign scopes remain denied')
# Localized names are saved from locked products, independent of the last request header.
p=call('/api/merchant/products/mug',h=mh)
p['translations']['de']={'name':'Tasse Deutsch unveränderlich','description':'Deutscher Produkttext'}
call('/api/merchant/products/mug',p,mh,'PUT')
deh={**h,'x-commerce-locale':'de-DE'}
dc=call('/store-api/checkout/cart',{'session':uuid.uuid4().hex},deh)
dch={**deh,'sw-context-token':dc['token']}
dc=call('/store-api/checkout/cart',{'revision':dc['revision'],'items':[{'id':'mug-sage-350','quantity':1}]},dch,'PUT')
do=call('/store-api/checkout/order',{}, {**dch,'x-commerce-locale':'en-GB','Idempotency-Key':uuid.uuid4().hex})
assert do['cart']['lineItems'][0]['label']=='Tasse Deutsch unveränderlich · sage / 350',do['cart']['lineItems']
p=call('/api/merchant/products/mug',h=mh);p['translations']['de']['name']='Tasse später geändert'
call('/api/merchant/products/mug',p,mh,'PUT')
assert next(x for x in call('/api/search/order',{},mh)['data'] if x['id']==do['id'])['cart']['lineItems'][0]['label']=='Tasse Deutsch unveränderlich · sage / 350'
check('German variant order labels inherit parent translation and remain immutable after edits')
summary={'passed':len(checks),'checks':checks,'orderId':o['id'],'workspace':u['workspace'],'paymentState':o['payment']['state'],'paymentMode':'simulated, no external charge'}
if os.getenv('REPORT_PATH'):open(os.environ['REPORT_PATH'],'w').write(json.dumps(summary,indent=2)+'\n')
print(json.dumps(summary))
