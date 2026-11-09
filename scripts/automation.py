#!/usr/bin/env python3
"""Real HTTP/PostgreSQL branching automation, private facts, durable delays and revoked-actor regressions. No providers."""
from testing.database import psql
import copy,json,os,subprocess,time,uuid,urllib.request,urllib.error,sys,pathlib
BASE=os.environ.get('BASE_URL','http://127.0.0.1:8787');suffix=uuid.uuid4().hex[:10];checks=[]
def call(path,body=None,h=None,method=None,expected=200):
    req=urllib.request.Request(BASE+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json',**(h or {})},method=method)
    try:
        with urllib.request.urlopen(req,timeout=30) as r:status=r.status;v=json.load(r)
    except urllib.error.HTTPError as e:status=e.code;v=json.load(e)
    assert status==expected,(path,status,expected,v)
    return v
def sql(statement):
    return subprocess.check_output(psql(os.getenv('DB_CONTAINER','veyndo-postgres-1'),'commerce',os.environ['TEST_DATABASE'],'-At','-v','ON_ERROR_STOP=1'),input=statement,text=True).strip()
def check(s):checks.append(s);print('PASS',s,flush=True)
def register(label):return call('/api/auth/register',{'workspaceId':label+'-'+suffix,'workspaceName':label,'name':'Owner','email':label+suffix+'@example.test','password':'Synthetic-flow-2026!'})
a=register('automate');foreign=register('autoforeign');t=a['workspace'];mh={'x-tenant':t,'Authorization':'Bearer '+a['token']};public={'x-tenant':t};fh={'x-tenant':t,'Authorization':'Bearer '+foreign['token']};names={l:'Automation '+l for l in ['en','de','fr','es']}
def mcp(name,v,h=mh):return call('/mcp',{'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':name,'arguments':v}},h)['result']
def save(id,data,revision=0):return call('/api/automation/flows/'+id,{'data':data,'revision':revision},mh,'PUT')
def source(name,**config):return {'type':'shopwareCondition','name':name,'config':config}
def flow(nodes,event='order.placed'):
    return {'name':names,'active':True,'event':event,'condition':{'type':'alwaysValid'},'action':'pipeline','instruction':names,'locale':'de-DE','pipeline':{'entry':nodes[0]['id'],'nodes':nodes}}
def action(id,name,config,next=None):return {'kind':'action','id':id,'action':name,'config':config,'next':next}
def wait(flowid,state='completed',cursor=None,error=None):
    for _ in range(120):
        jobs=call('/api/automation',h=mh)['jobs'];found=[j for j in jobs if j['flow']==flowid and j['state']==state and (cursor is None or j.get('cursor')==cursor) and (error is None or j['error']==error)]
        if found:return found[0]
        time.sleep(.1)
    raise AssertionError((flowid,state,jobs))
catalog=call('/api/automation/catalog',h=mh);assert len(catalog['sourceConditions'])==114 and len(catalog['sourceActions'])==16
assert catalog['flowCatalogVersion']==1
discovered=mcp('automation.catalog',{})['structuredContent']
for field in ('flowCatalogVersion','actions','events','pipelineContract'):
    assert discovered[field]==catalog[field]
call('/api/automation/catalog',h=fh,expected=403)
assert {'condition','action','delay','stop'}==set(catalog['pipelineContract']['nodes'])
assert any(x['type']=='scriptRule' and not x['supported'] for x in catalog['sourceConditions'])
tools_list={'jsonrpc':'2.0','id':1,'method':'tools/list'}
call('/mcp',tools_list,expected=400)
assert not any(x['name'].startswith('automation.')for x in call('/mcp',tools_list,public)['result']['tools'])
call('/mcp',{'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':'automation.list','arguments':{}}},fh,expected=403)
check('Original production catalog and MCP tools expose executable scope and tenant authority explicitly')
p=call('/api/merchant/products/mug',h=mh)
call('/api/automation/entities/products/mug',{'revision':p['revision'],'data':{'width':100,'height':100,'length':100,'markAsTopseller':True,'customFields':{'material':'ceramic'},'purchasePrices':{'gross':10,'net':8}}},mh,'PUT')
call('/api/automation/entities/products/mug',{'revision':p['revision'],'data':{}},mh,'PUT',409)
call('/api/automation/entities/products/mug',{'revision':p['revision']+1,'data':{'price':0}},mh,'PUT',400)
c=call('/store-api/checkout/cart',{},public);ch={**public,'sw-context-token':c['token']}
c=call('/store-api/checkout/cart',{'revision':c['revision'],'items':[{'id':'mug','quantity':2}]},ch,'PUT')
assert 'automation' not in call('/store-api/product/mug',{},public)['product']['extra']
assert 'ruleFacts' not in c and 'customer' not in c
for condition in [source('cartLineItemPromoted',isPromoted=True),source('cartTotalPurchasePrice',operator='=',type='net',amount=16),source('cartLineItemCustomField',operator='=',renderedField={'name':'material','type':'text'},renderedFieldValue='ceramic')]:
    assert mcp('automation.preview',{'condition':condition},{**mh,**ch})['structuredContent']['matched']
missing=source('orderCustomField',operator='=',renderedField={'name':'absent','type':'text'},renderedFieldValue='x')
assert mcp('automation.preview',{'condition':{'type':'notContainer','child':missing}},{**mh,**ch})['isError']
check('Revision-bound product metadata drives real cart rules; missing authority under NOT fails and private facts never escape')
customer=call('/store-api/account/register',{'email':'customer'+suffix+'@example.test','name':'Buyer','password':'Synthetic-buyer-2026!'},public)
ch={**public,'x-customer-token':customer['customerToken']};c=call('/store-api/checkout/cart',{},ch);ch['sw-context-token']=c['token']
c=call('/store-api/checkout/cart',{'revision':c['revision'],'items':[{'id':'mug','quantity':1}]},ch,'PUT')
call('/api/automation/rules/positive',{'revision':0,'data':{'name':names,'active':True,'condition':source('cartCartAmount',operator='>',amount=0)}},mh,'PUT')
assert mcp('automation.preview',{'condition':{'type':'ruleReference','ruleId':'positive'}},{**mh,**ch})['structuredContent']['matched']
assert mcp('automation.preview',{'condition':{'type':'ruleReference','ruleId':'foreign'}},{**mh,**ch})['isError']
first=flow([{'kind':'condition','id':'branch','condition':{'type':'ruleReference','ruleId':'positive'},'on_true':'tag','on_false':'stop'},action('tag','action.add.customer.tag',{'tagIds':['vip']},'delay'),{'kind':'delay','id':'delay','seconds':2,'next':'recheck'},{'kind':'condition','id':'recheck','condition':{'type':'ruleReference','ruleId':'positive'},'on_true':'state','on_false':'stop'},action('state','action.set.order.state',{'kind':'order','state':'in_progress'},'field'),action('field','action.set.order.custom.field',{'field':'handled','value':True},'stop'),{'kind':'stop','id':'stop'}])
draft={'revision':0,'data':{**first,'actor':'untrusted-caller'}}
path='/api/automation/flows/pipeline/validate'
tool='automation.validate_flow'
tool_meta=next(x for x in call('/mcp',tools_list,mh)['result']['tools'] if x['name']==tool)
assert tool_meta['annotations']['readOnlyHint'] is True
assert call(path,draft,mh)=={'valid':True,'saved':False,'revision':0}
assert mcp(tool,{'id':'pipeline',**draft})['structuredContent']=={'valid':True,'saved':False,'revision':0}
call(path,draft,fh,expected=403)
call(path,draft,public,expected=401)
call(path,{**draft,'data':[]},mh,expected=400)
legacy_path='/api/automation/flows/pipeline'
assert call(legacy_path,{**draft,'validateOnly':True},mh,'PUT')['saved'] is False
call(legacy_path,{**draft,'validateOnly':'true'},mh,'PUT',400)
call('/api/automation/rules/positive',{**draft,'validateOnly':True},mh,'PUT',400)
missing_rule=copy.deepcopy(first)
missing_rule['pipeline']['nodes'][0]['condition']['ruleId']='does_not_exist'
call(path,{**draft,'data':missing_rule},mh,expected=400)
assert mcp(tool,{'id':'pipeline',**draft,'data':missing_rule})['isError']
untouched=call('/api/automation',h=mh)
assert not any(r['id']=='pipeline' for r in untouched['flows'])
assert not any(j['flow']=='pipeline' for j in untouched['jobs'])
assert save('pipeline',draft['data'])=={'saved':True,'revision':1}
assert next(r for r in call('/api/automation',h=mh)['flows'] if r['id']=='pipeline')['data']['actor']!='untrusted-caller'
call(path,draft,mh,expected=409)
assert mcp(tool,{'id':'pipeline',**draft})['isError']
check('Dedicated HTTP and MCP draft endpoints share validation, deny foreign access and stale revisions, and never save or enqueue')
false=flow([{'kind':'condition','id':'branch','condition':source('cartCartAmount',operator='>',amount=100000),'on_true':'wrong','on_false':'correct'},action('wrong','action.add.order.tag',{'tags':['wrong']}),action('correct','action.add.order.tag',{'tags':['false-branch']})]);save('false_branch',false)
call('/api/merchant/receipts/settings',{'revision':0,'data':{'name':'Synthetic Flow Seller','address':'Test 1, Berlin','taxId':'TEST-ONLY'}},mh,'PUT')
invoice=flow([action('document','action.generate.document',{'kind':'invoice'})]);save('invoice',invoice)
terminal_delay=flow([
    action('note','note',{'instruction':names},'last_delay'),
    {'kind':'delay','id':'last_delay','seconds':2,'next':None},
]);save('terminal_delay',terminal_delay)
invalid=copy.deepcopy(first);invalid['pipeline']['nodes'][1]['next']='branch';call('/api/automation/flows/cycle',{'data':invalid,'revision':0},mh,'PUT',400)
invalid=flow([{'kind':'delay','id':'long','seconds':2592001,'next':None}]);call('/api/automation/flows/long',{'data':invalid,'revision':0},mh,'PUT',400)
call('/api/automation/flows/long/validate',{'data':invalid,'revision':0},mh,expected=400)
check('Graph admission rejects cycles and delays beyond thirty days before saving')
# One corrupted rule must become a visible failed job instead of poisoning the outbox for other flows.
save('bad_scope',flow([action('note','note',{'instruction':names})]))
sql("UPDATE commerce_flows SET data=jsonb_set(data,'{condition}','{\"type\":\"shopwareCondition\",\"name\":\"missing_runtime\",\"config\":{}}') WHERE tenant='"+t+"' AND id='bad_scope';")
save('bad_references',flow([action('note','note',{'instruction':names})]))
excessive=json.dumps({'type':'andContainer','children':[{'type':'ruleReference','ruleId':'missing'+str(i)}for i in range(101)]})
sql("UPDATE commerce_flows SET data=jsonb_set(data,'{condition}','"+excessive+"') WHERE tenant='"+t+"' AND id='bad_references';")
o=call('/store-api/checkout/order',{}, {**ch,'Idempotency-Key':'automation-'+suffix})
for _ in range(100):
    jobs=call('/api/automation',h=mh)['jobs'];waiting=[j for j in jobs if j['flow']=='pipeline' and j['state']=='queued' and j.get('cursor')=='recheck']
    if waiting:break
    time.sleep(.05)
assert waiting,'Pipeline did not persist its delayed cursor'
call('/api/automation/rules/positive',{'revision':1,'data':{'name':names,'active':True,'condition':source('cartCartAmount',operator='>',amount=100000)}},mh,'PUT')
assert not mcp('automation.preview',{'condition':{'type':'ruleReference','ruleId':'positive'}},{**mh,**ch})['structuredContent']['matched']
completed=wait('pipeline');assert completed['result']['stopped'] and len(completed['result']['trace'])>=4
wait('false_branch');wait('invoice');bad=wait('bad_scope','failed');assert 'Unknown Shopware rule' in bad['error'];assert 'Maximum 100 referenced rules' in wait('bad_references','failed')['error']
terminal=wait('terminal_delay')
assert terminal['result']=={'completed':True}
assert sql("SELECT attempts || ':' || (execution->>'delayCompleted') FROM flow_jobs WHERE id='"+terminal['id']+"'")=='2:last_delay'
assert sql("SELECT count(*) FROM flow_steps WHERE job='"+terminal['id']+"'")=='1'
check('A final delay completes on its second claim and never repeats the preceding action')
read=call('/api/merchant/orders/'+o['id'],h=mh);assert read['state']=='in_progress'
assert json.loads(sql("SELECT data->'automation' FROM orders WHERE id='"+o['id']+"'"))=={'customFields':{'handled':True},'tags':['false-branch']}
assert json.loads(sql("SELECT automation FROM customers WHERE tenant='"+t+"' AND id='"+o['orderCustomer']['customerId']+"'"))['tags']==['vip']
assert len(call('/api/merchant/orders/'+o['id']+'/receipts',h=mh)['elements'])==1
assert int(sql("SELECT count(*) FROM flow_steps WHERE job='"+completed['id']+"' AND state='completed'"))==3
check('Committed checkout runs true/false branches, a persisted delay, customer tags, guarded state, custom fields and one immutable invoice')
check('A changed saved rule affects current preview while a delayed event continues with its frozen original rule version')
check('Broken scope and oversized reference sets fail independently while other flows and checkout continue')
# Replaying a previously confirmed graph reuses its per-node receipts, without repeating transitions or tags.
sql("UPDATE flow_jobs SET state='queued',cursor=NULL WHERE id='"+completed['id']+"';")
wait('pipeline');time.sleep(.5)
assert int(sql("SELECT count(*) FROM flow_steps WHERE job='"+completed['id']+"'"))==3
assert int(sql("SELECT count(*) FROM order_activity WHERE order_id='"+o['id']+"' AND kind='transition'"))==1
check('Replayed flow jobs reuse persisted action results rather than repeat side effects')
unknown=flow([action('unknown','unsupported.future.action',{})])
call('/api/automation/flows/unknown_action',{'data':unknown,'revision':0},mh,'PUT',400)
unknown=flow([{'kind':'stop','id':'stop'}],event='order.unregistered')
call('/api/automation/flows/unknown_event',{'data':unknown,'revision':0},mh,'PUT',400)
sql("UPDATE flow_jobs SET state='queued',cursor=NULL,definition=jsonb_set(definition,'{flow,action}',to_jsonb('unsupported.future.action'::text)) WHERE id='"+completed['id']+"';")
assert wait('pipeline','failed')['error']=='Unsupported stored Flow action'
check('Unknown Flow names fail on save and an unknown queued action cannot fall through to inference')
# A stored cursor that no longer names a node is a failed job, not a fresh start.
sql("UPDATE flow_jobs SET state='queued',cursor='unknown_cursor',definition=jsonb_set(definition,'{flow,action}',to_jsonb('pipeline'::text)) WHERE id='"+completed['id']+"';")
wait('pipeline','failed',error='Unknown flow cursor')
assert sql("SELECT count(*) FROM flow_steps WHERE job='"+completed['id']+"'")=='3'
check('An unknown persisted cursor fails without restarting the graph or writing another effect')
# Delay execution rechecks current permissions rather than preserving the creating actor's old grant.
for id in ['pipeline','false_branch','invoice','terminal_delay']:
    current=next(x for x in call('/api/automation',h=mh)['flows']if x['id']==id);save(id,{**current['data'],'active':False},current['revision'])
sql("UPDATE commerce_flows SET data=jsonb_set(data,'{active}','false') WHERE tenant='"+t+"' AND id IN ('bad_scope','bad_references');")
mutation_customer=call('/store-api/account/register',{'email':'mutations'+suffix+'@example.test','name':'Mutation Buyer','password':'Synthetic-buyer-2026!'},public)
mc_headers={**public,'x-customer-token':mutation_customer['customerToken']};mc=call('/store-api/checkout/cart',{},mc_headers);mc_headers['sw-context-token']=mc['token']
mc=call('/store-api/checkout/cart',{'revision':mc['revision'],'items':[{'id':'mug','quantity':1}]},mc_headers,'PUT')
mutations=[
 ('add_customer','action.add.customer.tag',{'tags':['kept','temporary']}),
 ('remove_customer','action.remove.customer.tag',{'tagIds':['temporary']}),
 ('field_customer','action.set.customer.custom.field',{'field':'segment','value':{'name':'returning'}}),
 ('codes_customer','action.add.customer.affiliate.and.campaign.code',{'affiliateCode':'partner','campaignCode':'autumn'}),
 ('add_order','action.add.order.tag',{'tags':['kept','temporary']}),
 ('remove_order','action.remove.order.tag',{'tagIds':['temporary']}),
 ('codes_order','action.add.order.affiliate.and.campaign.code',{'affiliateCode':'partner','campaignCode':'autumn'}),
 ('group','action.change.customer.group',{'customerGroupId':'business'}),
 ('group_field','action.set.customer.group.custom.field',{'field':'tier','value':'priority'}),
 ('deactivate','action.change.customer.status',{'active':False}),
 ('reactivate','action.change.customer.status',{'active':True}),
 ('note','note',{'instruction':names})]
mutation_flow=flow([action(id,name,config,mutations[i+1][0]if i+1<len(mutations)else None)for i,(id,name,config)in enumerate(mutations)])
save('mutations',mutation_flow)
mutation_order=call('/store-api/checkout/order',{}, {**mc_headers,'Idempotency-Key':'mutations-'+suffix});mutation_job=wait('mutations')
assert len(mutation_job['result']['trace'])==len(mutations)
customer_id=mutation_order['orderCustomer']['customerId']
customer_state=json.loads(sql("SELECT jsonb_build_object('group',group_name,'active',active,'automation',automation) FROM customers WHERE tenant='"+t+"' AND id='"+customer_id+"';"))
assert customer_state=={'group':'business','active':True,'automation':{'tags':['kept'],'customFields':{'segment':{'name':'returning'}},'affiliateCode':'partner','campaignCode':'autumn'}}
assert json.loads(sql("SELECT data FROM commerce_customer_groups WHERE tenant='"+t+"' AND id='business';"))['customFields']['tier']=='priority'
assert int(sql("SELECT count(*) FROM customer_sessions WHERE tenant='"+t+"' AND email='mutations"+suffix+"@example.test';"))==0
order_state=call('/api/merchant/orders/'+mutation_order['id'],h=mh)
assert order_state['affiliateCode']=='partner'and order_state['campaignCode']=='autumn'
assert json.loads(sql("SELECT data->'automation'->'tags' FROM orders WHERE tenant='"+t+"' AND id='"+mutation_order['id']+"';"))==['kept']
current=next(x for x in call('/api/automation',h=mh)['flows']if x['id']=='mutations');save('mutations',{**current['data'],'active':False},current['revision'])
check('Customer/order tag removal, typed fields, attribution, group fields and deactivate/reactivate actions commit real changes and revoke old sessions')
# The same documented CLI creates a separate playground and preserves edited definitions on restart.
demo_state=pathlib.Path('.run')/('playground-test-'+suffix+'.json')
command=[sys.executable,'scripts/playground.py','--base-url',BASE,'--email',a['user']['email'],'--state',str(demo_state)]
demo_env={**os.environ,'COMMERCE_PASSWORD':'Synthetic-flow-2026!'};demo_env.pop('COMMERCE_SESSION_TOKEN',None)
demo=json.loads(subprocess.check_output(command,env=demo_env,text=True));dt=demo['workspace']
assert dt!=t and len(demo['created'])==4 and demo['ordersCreated']==demo['providerCalls']==0
dh={'x-tenant':dt,'Authorization':'Bearer '+a['token']}
definitions=call('/api/automation',h=dh);rule=next(r for r in definitions['rules']if r['id']=='demo_high_value')
call('/api/automation/rules/demo_high_value',{'revision':rule['revision'],'data':{'name':rule['data']['name'],'active':True,'condition':source('cartCartAmount',operator='>=',amount=120)}},dh,'PUT')
again=json.loads(subprocess.check_output(command,env=demo_env,text=True));assert not again['created']and len(again['retained'])==4
assert next(r for r in call('/api/automation',h=dh)['rules']if r['id']=='demo_high_value')['data']['condition']['config']['amount']==120
assert demo_state.stat().st_mode&0o777==0o600 and 'token'not in json.loads(demo_state.read_text())
for product,quantity,tag in [('mug',1,'playground-standard'),('lamp',2,'playground-priority')]:
    cart=call('/store-api/checkout/cart',{}, {'x-tenant':dt});ph={'x-tenant':dt,'sw-context-token':cart['token']}
    cart=call('/store-api/checkout/cart',{'revision':cart['revision'],'items':[{'id':product,'quantity':quantity}]},ph,'PUT')
    placed=call('/store-api/checkout/order',{}, {**ph,'Idempotency-Key':'playground-'+product+suffix})
    for _ in range(250):
        entries=call('/api/automation/executions',h=dh)['jobs']
        job=next((j for j in entries if j['flow']=='demo_order_routing'and j['state']=='completed'and any(step.get('result',{}).get('orderId')==placed['id']for step in(j.get('result')or{}).get('trace',[]))),None)
        if job:break
        time.sleep(.1)
    assert job,(placed['id'],entries)
    assert json.loads(sql("SELECT data->'automation'->'tags' FROM orders WHERE tenant='"+dt+"' AND id='"+placed['id']+"';"))==[tag]
    assert len(call('/api/merchant/orders/'+placed['id']+'/receipts',h=dh)['elements'])==1
check('Documented playground CLI creates an isolated owner shop, retains edited rules and executes both order branches with real invoices')
revoked=flow([{'kind':'delay','id':'pause','seconds':60,'next':'effect'},action('effect','action.add.order.tag',{'tags':['must-not-run']})]);save('revoked',revoked)
claim_probe='claim_probe_'+suffix
save('claim_guard',flow([
    action(claim_probe,'note',{'instruction':names},'stale_effect'),
    action('stale_effect','action.add.order.tag',{'tags':['stale-worker']}),
]))
save('claim_barrier',terminal_delay)
# Inject a changed claim immediately after the real first step returns.
# The old runner must be unable to overwrite its checkpoint or run the next step.
sql(f"""
CREATE FUNCTION {claim_probe}() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  UPDATE flow_jobs SET attempts=attempts+1,execution='{{"claimProbe":true}}'
  WHERE id=NEW.job AND tenant='{t}' AND flow='claim_guard';
  RETURN NEW;
END;
$$;
CREATE TRIGGER {claim_probe} AFTER UPDATE ON flow_steps
FOR EACH ROW WHEN (NEW.node='{claim_probe}' AND NEW.state='completed')
EXECUTE FUNCTION {claim_probe}();
""")
c=call('/store-api/checkout/cart',{},public);h={**public,'sw-context-token':c['token']};c=call('/store-api/checkout/cart',{'revision':c['revision'],'items':[{'id':'notebook','quantity':1}]},h,'PUT');second=call('/store-api/checkout/order',{}, {**h,'Idempotency-Key':'revoke-'+suffix})
try:
    wait('claim_barrier')
    claim=wait('claim_guard','running')
    assert sql("SELECT attempts || ':' || (execution->>'claimProbe') FROM flow_jobs WHERE id='"+claim['id']+"'")=='2:true'
    assert sql("SELECT count(*) FROM flow_steps WHERE job='"+claim['id']+"'")=='1'
    assert sql("SELECT data->'automation'->'tags' FROM orders WHERE id='"+second['id']+"'") in ['','null']
    sql("UPDATE flow_jobs SET lease_until=now()-interval '1 second' WHERE id='"+claim['id']+"'")
    assert wait('claim_guard','uncertain')['error']=='Worker stopped before result confirmation'
    check('A stale claim cannot save a cursor, finish a newer claim or run its next action; an expired claim stays uncertain')
finally:
    sql(f"DROP TRIGGER {claim_probe} ON flow_steps; DROP FUNCTION {claim_probe}();")
queued=wait('revoked','queued',cursor='effect')
# A newly enqueued job is also 'queued', before its delay has run. Wait for the
# committed delayed cursor, otherwise the worker can overwrite available_at
# after this test advances it and the revocation assertion races a 60s timer.
assert sql("SELECT execution->>'delayCompleted' FROM flow_jobs WHERE id='"+queued['id']+"'")=='pause'
sql("BEGIN; UPDATE memberships SET active=false WHERE tenant='"+t+"'; UPDATE flow_jobs SET available_at=now() WHERE id='"+queued['id']+"' AND state='queued' AND cursor='effect'; COMMIT;")
for _ in range(100):
    delayed=json.loads(sql("SELECT jsonb_build_object('state',state,'cursor',cursor,'error',error,'attempts',attempts,'availableAt',available_at,'leaseUntil',lease_until) FROM flow_jobs WHERE id='"+queued['id']+"'"))
    if delayed['state']=='failed':break
    time.sleep(.1)
assert delayed['state']=='failed' and delayed['error']=='Flow owner lost access',delayed
assert sql("SELECT data->'automation'->'tags' FROM orders WHERE id='"+second['id']+"'") in ['','null']
sql("UPDATE memberships SET active=true WHERE tenant='"+t+"';")
check('Revoking a delayed flow actor prevents the future mutation')
from testing.rule_history import verify as verify_rule_history
verify_rule_history(call, sql, mcp, mh, foreign, t, suffix, check)
print(json.dumps({'passed':len(checks),'paidProviderCalls':0,'checks':checks}))
