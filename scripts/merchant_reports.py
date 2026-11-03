#!/usr/bin/env python3
"""Native report aggregation over real checkout/POS/consent flows plus isolated historical fixtures; no external providers."""
import copy,json,os,pathlib,subprocess,urllib.request,urllib.error,uuid
from decimal import Decimal
BASE=os.environ['BASE_URL'];tag=uuid.uuid4().hex[:9]
def call(path,body=None,h=None,method=None,status=200):
    req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json',**(h or {})},method=method)
    try:
        with urllib.request.urlopen(req,timeout=45)as r:code=r.status;value=json.load(r)
    except urllib.error.HTTPError as e:code=e.code;value=json.load(e)
    assert code==status,(path,code,status,value);return value

def register(prefix):
    s=call('/api/auth/register',{'workspaceId':prefix+tag,'workspaceName':'Report laboratory','name':'Report test owner','email':prefix+tag+'@example.test','password':'Synthetic-report-fixture-2026!'})
    return s,{'x-tenant':s['workspace'],'Authorization':'Bearer '+s['token']}
a,h=register('reports-');other,foreign=register('reports-other-')
def report(query=None,headers=h,status=200):return call('/api/merchant/reports',query or {},headers,status=status)
def current(v):return next((x for x in v['totals']if x['period']=='current'),{'orders':0,'revenue':'0'})
assert current(report())['orders']==0
product=str(uuid.uuid4())
draft={'id':product,'revision':0,'catalog':{'active':True,'parentId':None,'productNumber':'REPORT-LAMP','options':{},'categoryIds':[]},'commerce':{'price':49.9,'taxRate':19,'stock':50,'minPurchase':1,'purchaseSteps':1,'maxPurchase':None,'deliveryDays':2,'listPrice':None,'advancedPrices':[],'media':[],'properties':{}},'extra':{},'translations':{'en':{'name':'Report lamp','description':'Synthetic report fixture'}}}
call('/api/merchant/products',draft,h)
pub={'x-tenant':a['workspace']};cart=call('/store-api/checkout/cart',{},pub);buyer={**pub,'sw-context-token':cart['token']}
policy=call('/store-api/legal',h=buyer);call('/store-api/privacy/consent',{'policyVersion':policy['policyVersion'],'choices':{'analytics':True}},buyer,'PUT')
for kind in ['page_view','product_view']:
    call('/store-api/behavior/events',{'eventId':uuid.uuid4().hex,'kind':kind,'productId':product if kind=='product_view'else None,'surface':'product','viewport':'desktop'},buyer)
cart=call('/store-api/checkout/cart/line-item',{'items':[{'referencedId':product,'quantity':2}]},buyer)
addr={'name':'Report Buyer','firstName':'Report','lastName':'Buyer','street':'Fixture Street 1','postalCode':'10115','city':'Berlin','country':'DE'}
selection={**cart['checkout'],'customerEmail':'report-buyer@example.test','address':addr,'billingAddress':addr}
cart=call('/store-api/checkout/context',{'revision':cart['revision'],'checkout':selection},buyer,'PUT')
for kind in ['cart_add','checkout_start']:
    call('/store-api/behavior/events',{'eventId':uuid.uuid4().hex,'kind':kind,'productId':product if kind=='cart_add'else None,'surface':'checkout','viewport':'desktop'},buyer)
order=call('/store-api/checkout/order',{}, {**buyer,'Idempotency-Key':'reports-'+tag,'x-commerce-cart-revision':str(cart['revision']),'x-commerce-total-minor':str(int(Decimal(str(cart['price']['totalPrice']))*100)),'x-commerce-currency':'EUR'})
r=report();assert current(r)['orders']==1 and Decimal(current(r)['revenue'])==Decimal(str(order['cart']['price']['totalPrice']))
assert r['traffic']['totals'][0]['visits']==1 and r['traffic']['totals'][0]['converted']==1
assert r['products'][0]['quantity']=='2'
assert r['traffic']['channels'][0]['visits']==1 and r['traffic']['channels'][0]['converted']==1
# An actual cashier sale goes through the native register checkout, not fabricated reporting rows.
channel={'name':{'en-GB':'Counter','de-DE':'Kasse'},'kind':'pos','active':True,'locales':['en-GB','de-DE'],'productIds':[],'pos':{'country':'DE','columns':4,'compact':False,'receiptMessage':{'en-GB':'Test receipt'}}}
call('/api/automation/channels/counter',{'revision':0,'data':channel},h,'PUT')
pc=call('/api/pos/counter/create',{},h)['cart'];pc=call('/api/pos/counter/replace',{'cartToken':pc['token'],'revision':pc['revision'],'items':[{'id':product,'quantity':1}]},h)
po=call('/api/pos/counter/complete',{'cartToken':pc['token'],'revision':pc['revision'],'requestKey':'reports-pos-'+tag,'totalMinor':pc['price']['totalMinor'],'tenderMinor':pc['price']['totalMinor']},h)
r=report({'channelType':'pos'});assert current(r)['orders']==1 and r['channels'][0]['channel']=='counter'
assert current(report({'channel':'default'}))['orders']==1
assert current(report({},foreign))['orders']==0
report({},pub,401)
report({'timezone':'UTC;DROP TABLE orders'},status=400)
report({'period':'custom','from':'2026-11-04','to':'2026-10-01'},status=400)
report({'period':'custom','from':'2000-01-01','to':'2026-01-01','interval':'day'},status=400)
report({'channel':'foreign'},status=404)
# Current rights gate aggregate traffic/product projections and MCP discovery as well as direct HTTP.
key=call('/api/workspace/integrations',{'name':'Report totals','expiresInDays':1,'permissions':['overview.read']},h)
limited={'x-tenant':a['workspace'],'Authorization':'Bearer '+key['key']}
r=report({},limited);assert r['products']==[] and r['traffic']is None
roleless=call('/api/workspace/integrations',{'name':'No reports','expiresInDays':1,'permissions':['catalog.read']},h)
report({}, {'x-tenant':a['workspace'],'Authorization':'Bearer '+roleless['key']},403)
args={'period':'today','timezone':'Europe/Berlin'}
rpc=call('/mcp',{'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'merchant.reports.read','arguments':args}},h)
assert not rpc.get('error') and not rpc['result'].get('isError'),rpc
# Channel grouping uses native channel definitions. Historical fixture attribution follows the stored channel.
for kind in ['marketplace','headless']:
    call('/api/automation/channels/'+kind,{'revision':0,'data':{k:v for k,v in {**channel,'kind':kind}.items() if k!='pos'}},h,'PUT')
# Report layouts reuse the actor's native workspace CAS/history; they cannot carry authority or rows.
w=call('/api/studio/workspace',h=h);layout={'query':{'period':'year','interval':'month','timezone':'Europe/Berlin','channelType':'all','compare':True},'widgets':[{'id':'sales','kind':'revenue','view':'line','width':'full'}]}
w['data']['todayReports']=layout;w['data']['areas']=[{'id':'reports','name':'Reports','cards':[],'pins':[],'reports':layout}];w['data']['active']='reports'
saved=call('/api/studio/workspace',{'revision':w['revision'],'data':w['data']},h,'PUT')
assert saved['data']['todayReports']=={**layout,'query':{**layout['query'],'from':None,'to':None,'channel':None,'currency':None}}
call('/api/studio/workspace',{'revision':w['revision'],'data':w['data']},h,'PUT',409)
invalid=copy.deepcopy(saved['data']);invalid['todayReports']['query']['tenant']='forged'
call('/api/studio/workspace',{'revision':saved['revision'],'data':invalid},h,'PUT',400)
assert call('/api/studio/workspace',h=foreign)['data']['areas']==[]
# Native withdrawal immediately removes visitor counts without changing authoritative order revenue.
call('/store-api/privacy/consent',{'policyVersion':policy['policyVersion'],'choices':{'analytics':False}},buyer,'PUT')
assert report()['traffic']['totals']==[]
from testing.report_history import verify
verify(a['workspace'],report)
if os.environ.get('REPORT_FIXTURE_OUT'):
    pathlib.Path(os.environ['REPORT_FIXTURE_OUT']).write_text(json.dumps({'shop':a['workspace'],'token':a['token'],'email':a['user']['email']}))
print('PASS native checkout/POS reports, consent withdrawal, exact currency sums, filters, periods, MCP, private layouts, CAS and current rights')
