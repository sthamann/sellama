#!/usr/bin/env python3
"""Standalone app process, opaque UI SDK transport, own SQLite inbox and independent durable worker."""
from testing.app_approval import consent
from testing.app_approval import pin
from testing.database import psql
import hashlib,sys
import json,os,pathlib,socket,sqlite3,subprocess,tempfile,time,urllib.request,urllib.error,uuid
ROOT=pathlib.Path(__file__).resolve().parents[1];checks=[]
def port():
    with socket.socket() as s:s.bind(('127.0.0.1',0));return s.getsockname()[1]
service_port=port();api_port=port();base=f'http://127.0.0.1:{api_port}';app_id='service_'+uuid.uuid4().hex[:12];token=uuid.uuid4().hex
processes=[];logs=[]
def start(cmd,env,name):
    log=open(ROOT/'.run'/name,'w');logs.append(log)
    p=subprocess.Popen(cmd,cwd=ROOT,env={**os.environ,**env},stdout=log,stderr=log);processes.append(p);return p
def call(path,body=None,h=None,expected=200,method=None):
    if path == '/api/apps' and isinstance(body,dict) and ('manifest' in body or 'builtIn' in body): body=consent(body)
    r=urllib.request.Request(base+path,data=None if body is None else json.dumps(body).encode(),headers={'Content-Type':'application/json',**(h or {})},method=method)
    try:
        with urllib.request.urlopen(r,timeout=20) as res:code=res.status;v=json.load(res)
    except urllib.error.HTTPError as e:code=e.code;v=json.load(e)
    assert code==expected,(path,code,v);return v
def passed(name):checks.append(name);print('PASS',name)
def flow_job(headers, predicate):
    for _ in range(100):
        jobs=call('/api/automation/executions',h=headers)['jobs']
        if match:=next((job for job in jobs if job['flow']=='worker_invoice' and predicate(job)),None):
            return match
        time.sleep(.15)
    raise AssertionError(jobs)
with tempfile.TemporaryDirectory() as directory:
    db=str(pathlib.Path(directory)/'inbox.sqlite');config={app_id:{'url':f'http://127.0.0.1:{service_port}','uiUrl':f'http://127.0.0.1:{service_port}/','token':token}}
    manifest=json.loads((ROOT/'extensions/apps/service-example/manifest.json').read_text());manifest['id']=app_id;manifest['events'].append('order.state_changed');manifest['permissions'].append('events:order.state_changed')
    sys.path.insert(0,str(ROOT/'extensions/sdk'))
    from ui_bundle import bundle
    ui=bundle((ROOT/'extensions/apps/service-example/index.html').read_text())
    config[app_id]['uiDigests']={'ui':hashlib.sha256(ui).hexdigest()}
    pin(config,app_id,manifest)
    env={'APP_SERVICES':json.dumps(config),'PROCESS_ROLE':'all','APP_WORKER_ENABLED':'false',
         'BIND_ADDR':f'127.0.0.1:{api_port}'}
    worker_env={**env,'PROCESS_ROLE':'app-worker'}
    del worker_env['APP_WORKER_ENABLED']
    try:
        start(['python3',str(ROOT/'extensions/apps/service-example/server.py')],{'APP_PORT':str(service_port),'APP_TOKEN':token,'APP_DB':db,'APP_ID':app_id},'service-example-test.log')
        core=start([str(ROOT/'target/debug/veyndo')],env,'service-api-test.log')
        for _ in range(80):
            try:call('/health');break
            except OSError:time.sleep(.25)
        u=call('/api/auth/register',{'email':uuid.uuid4().hex+'@example.test','name':'Service Test','password':'Synthetic-service-account-2026!','workspaceId':'svc-'+uuid.uuid4().hex[:12],'workspaceName':'Synthetic service shop'})
        h={'Authorization':'Bearer '+u['token'],'x-tenant':u['workspace']}
        call('/api/apps',{'manifest':manifest},h)
        call(f'/api/apps/{app_id}/entities/notes',{'id':'one','fields':{'title':'Tenant-scoped app note'}},h)
        result=call(f'/api/apps/{app_id}/actions/availability',{'sku':'mug'},h);assert result['available'] and 'synthetic' in result['source']
        mcp=call('/mcp',{'jsonrpc':'2.0','id':1,'method':'tools/call','params':{'name':f'app.{app_id}.availability','arguments':{'sku':'mug'}}},h);assert mcp['result']['structuredContent']==result
        call(f'/api/apps/{app_id}/actions/availability',{'sku':'mug'},{'x-tenant':u['workspace']},401)
        passed('External service action is shared by HTTP/MCP and requires merchant permission')
        packages=call('/api/apps',h=h);assert token not in json.dumps(packages) and next(p for p in packages['packages'] if p['id']==app_id)['uiUrl']==config[app_id]['uiUrl']
        with urllib.request.urlopen(f'http://127.0.0.1:{service_port}/sdk.js') as r:assert r.headers['Access-Control-Allow-Origin']=='*' and 'connectCommerce' in r.read().decode()
        passed('Operator UI URL is exposed without service secrets; opaque-origin SDK import has CORS')
        names={locale:'Worker invoice' for locale in ('en','de','es','fr')}
        flow={'name':names,'active':True,'event':'order.placed','condition':{'type':'alwaysValid'},
              'action':'pipeline','instruction':names,'locale':'de-DE','pipeline':{'entry':'branch','nodes':[
                  {'kind':'condition','id':'branch','condition':{'type':'alwaysValid'},'on_true':'note','on_false':'stop'},
                  {'kind':'action','id':'note','action':'note','config':{'instruction':names},'next':'delay'},
                  {'kind':'delay','id':'delay','seconds':300,'next':'invoice'},
                  {'kind':'action','id':'invoice','action':'action.generate.document','config':{'kind':'invoice'}},
                  {'kind':'stop','id':'stop'},
              ]}}
        call('/api/merchant/receipts/settings',{'revision':0,'data':{'name':'Worker Test Seller','address':'Test 1, Berlin','taxId':'TEST-ONLY'}},h,method='PUT')
        flow_url='/api/automation/flows/worker_invoice'
        call(flow_url,{'revision':0,'data':flow},h,method='PUT')
        ch={'x-tenant':u['workspace']};cart=call('/store-api/checkout/cart',{'session':uuid.uuid4().hex},ch);ch['sw-context-token']=cart['token']
        call('/store-api/checkout/cart/line-item',{'items':[{'referencedId':'mug','quantity':1}]},ch)
        order_key=uuid.uuid4().hex
        order=call('/store-api/checkout/order',{}, {**ch,'Idempotency-Key':order_key})
        projected=flow_job(h,lambda job:job['state']=='queued')
        assert projected['cursor'] is None
        assert not call('/api/merchant/orders/'+order['id']+'/receipts',h=h)['elements']
        with sqlite3.connect(db) as conn:assert conn.execute('SELECT count(*) FROM events').fetchone()[0]==0
        passed('Core with its app lane off still commits and projects an order; no app action runs before the handoff')
        worker=start([str(ROOT/'target/debug/veyndo')],worker_env,'service-worker-test.log')
        for _ in range(80):
            with sqlite3.connect(db) as conn:rows=conn.execute('SELECT tenant,event_key,data FROM events').fetchall()
            if rows:break
            time.sleep(.25)
        assert len(rows)==1 and rows[0][0]==u['workspace'] and json.loads(rows[0][2])['data']['orderId']==order['id']
        passed('Separate app worker consumes queued order event into app-owned durable SQLite storage')
        delayed=flow_job(h,lambda job:job['state']=='queued' and job['cursor']=='invoice')
        assert delayed['execution']['delayCompleted']=='delay'
        worker.terminate();worker.wait(15)
        # Edit the merchant definition while the original worker is gone. A saved job still uses its own definition.
        flow['pipeline']['nodes'][0]['condition']={'type':'notContainer','child':{'type':'alwaysValid'}}
        call(flow_url,{'revision':1,'data':flow},h,method='PUT')
        assert call('/store-api/product/mug',h={'x-tenant':u['workspace']})['product']['id']=='mug'
        assert call('/store-api/checkout/order',{}, {**ch,'Idempotency-Key':order_key})['id']==order['id']
        assert flow_job(h,lambda job:job['id']==delayed['id'])['availableAt']==delayed['availableAt']
        assert not call('/api/merchant/orders/'+order['id']+'/receipts',h=h)['elements']
        # Advance only this fixture's timer. The database, rather than the worker, owns the deadline.
        subprocess.run(psql(os.environ['DB_CONTAINER'],'commerce',os.environ['TEST_DATABASE'],
                            '-v','ON_ERROR_STOP=1','-v','job='+delayed['id']),
                       input="UPDATE flow_jobs SET available_at=now() WHERE id=:'job' AND state='queued';",
                       text=True,check=True)
        worker=start([str(ROOT/'target/debug/veyndo')],worker_env,'service-worker-restart-test.log')
        resumed=flow_job(h,lambda job:job['id']==delayed['id'] and job['state']=='completed')
        assert [step['node'] for step in resumed['result']['trace']]==['branch','note','invoice']
        assert len(call('/api/merchant/orders/'+order['id']+'/receipts',h=h)['elements'])==1
        passed('Separate Core worker resumes a frozen Flow after restart while HTTP serves the shop and replays the same order')
        request=urllib.request.Request(f'http://127.0.0.1:{service_port}/events',data=rows[0][2].encode(),headers={'Content-Type':'application/json','Authorization':'Bearer '+token,'x-tenant':u['workspace']})
        with urllib.request.urlopen(request) as r:assert json.load(r)['duplicate']
        time.sleep(.8)
        with sqlite3.connect(db) as conn:assert conn.execute('SELECT count(*) FROM events').fetchone()[0]==1
        passed('App inbox survives worker restart and deduplicates repeated event delivery')
        body={'kind':'order','state':'in_progress','revision':order['revision'],'requestKey':'app-state-'+uuid.uuid4().hex}
        first=call('/api/merchant/orders/'+order['id']+'/transition',body,h);assert call('/api/merchant/orders/'+order['id']+'/transition',body,h)['revision']==first['revision']
        for _ in range(80):
            with sqlite3.connect(db)as conn:updated=conn.execute('SELECT data FROM events').fetchall()
            if len(updated)==2:break
            time.sleep(.25)
        transitions=[json.loads(row[0])for row in updated if json.loads(row[0])['kind']=='order.state_changed']
        assert len(transitions)==1 and transitions[0]['data']['state']=='in_progress' and 'order'not in transitions[0]['data'] and 'email'not in transitions[0]['data']
        passed('Repeated status command produces one state event delivered into the external app inbox without shopper credentials')
        worker.terminate();worker.wait(20)
        second_headers={'x-tenant':u['workspace']}
        second_cart=call('/store-api/checkout/cart',{'session':uuid.uuid4().hex},second_headers)
        second_headers['sw-context-token']=second_cart['token']
        call('/store-api/checkout/cart/line-item',{'items':[{'referencedId':'mug','quantity':1}]},second_headers)
        second=call('/store-api/checkout/order',{}, {**second_headers,'Idempotency-Key':uuid.uuid4().hex})
        pending=flow_job(h,lambda job:job['id']!=delayed['id'] and job['state']=='queued')
        core.terminate();core.wait(20)
        start([str(ROOT/'target/debug/veyndo')],{**env,'APP_WORKER_ENABLED':'true'},'service-api-rollback-test.log')
        for _ in range(80):
            try:call('/health');break
            except OSError:time.sleep(.25)
        rollback=flow_job(h,lambda job:job['id']==pending['id'] and job['state']=='completed')
        assert rollback['result']=={'stopped':True,'trace':[{'node':'branch','matched':False}]}
        assert not call('/api/merchant/orders/'+second['id']+'/receipts',h=h)['elements']
        assert len(call('/api/merchant/orders/'+order['id']+'/receipts',h=h)['elements'])==1
        passed('Rolling back to the combined Core drains queued work and preserves both orders and the original invoice')
        report={'passed':len(checks),'checks':checks,'processIsolation':'separate process; no microVM claim'}
        if os.getenv('REPORT_PATH'):pathlib.Path(os.environ['REPORT_PATH']).write_text(json.dumps(report,indent=2)+'\n')
        print(json.dumps(report))
    finally:
        for p in reversed(processes):
            if p.poll() is None:p.terminate();p.wait(15)
        for log in logs:log.close()
