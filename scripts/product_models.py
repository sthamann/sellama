#!/usr/bin/env python3
"""Real native product GLB upload, variant materials, isolated preview, CAS, channel admission and selected release."""
import copy,json,os,pathlib,urllib.request,urllib.error,uuid
from testing.model_fixture import model,glb
base=os.environ['BASE_URL'];tenant='models-'+uuid.uuid4().hex[:10]
def raw(path,data=None,h=None,m=None,status=200):
    req=urllib.request.Request(base+path,data=data,headers=h or {},method=m)
    try:
        with urllib.request.urlopen(req,timeout=60)as r:code=r.status;content=r.read()
    except urllib.error.HTTPError as e:code=e.code;content=e.read()
    assert code==status,(path,code,status,content[:400]);return content

def call(path,data=None,h=None,m=None,status=200):
    return json.loads(raw(path,None if data is None else json.dumps(data).encode(),{'Content-Type':'application/json',**(h or {})},m,status))

def upload(product,headers,content=None,status=200):
    content=model() if content is None else content;boundary=uuid.uuid4().hex
    parts=[f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode()for k,v in {'kind':'attachment','title':json.dumps({'en':'3D stool'})}.items()]
    parts+=[f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="stool.glb"\r\nContent-Type: model/gltf-binary\r\n\r\n'.encode()+content+b'\r\n',f'--{boundary}--\r\n'.encode()]
    return json.loads(raw('/api/merchant/products/'+product+'/assets',b''.join(parts),{**headers,'Content-Type':'multipart/form-data; boundary='+boundary},status=status))

def payload(v):
    return {k:copy.deepcopy(v[k])for k in ['revision','contentRevision','catalog','commerce','extra','translations']if k in v}

session=call('/api/auth/register',{'workspaceId':tenant,'name':'3D test owner','email':tenant+'@example.test','password':'Synthetic-3d-fixture-password!'})
h={'x-tenant':tenant,'Authorization':'Bearer '+session['token']}
draft={'id':str(uuid.uuid4()),'revision':0,'catalog':{'active':False,'parentId':None,'productNumber':'3D-STOOL','options':{},'categoryIds':[]},'commerce':{'price':129,'taxRate':19,'stock':10,'minPurchase':1,'purchaseSteps':1,'maxPurchase':None,'deliveryDays':2,'listPrice':None,'advancedPrices':[],'media':[],'properties':{}},'extra':{},'translations':{'en':{'name':'3D Stool','description':'Synthetic model and variant acceptance'}}}
root=call('/api/merchant/products',draft,h)['id'];asset=upload(root,h)
raw('/api/merchant/assets/'+asset['id'],h=h);raw('/api/merchant/assets/'+asset['id'],h={'x-tenant':tenant},status=401)
raw('/store-api/assets/'+asset['id']+'?shop='+tenant,status=404)
call('/api/merchant/assets/'+asset['id'],{'digest':asset['digest'],'public':True},h,'PUT')
item={'id':asset['id'],'type':'model','url':'/store-api/assets/'+asset['id']+'?shop='+tenant,'view':'3D stool','modelVariant':'Oak','alt':{'en':'3D stool','de':None}}
edit=payload(call('/api/merchant/products/'+root,h=h));edit['commerce']['media']=[item];edit['catalog']['active']=True
call('/api/merchant/products/'+root,edit,h,'PUT');call('/api/merchant/products/'+root,edit,h,'PUT',409)
assert raw(item['url'])==model()
assert call('/store-api/product/'+root,{},{'x-tenant':tenant})['product']['media'][0]['type']=='model'
for invalid in [glb({'asset':{'version':'2.0'},'images':[{'uri':'https://example.test/track.png'}]}),b'glTF invalid',model()+b'x']:
    upload(root,h,invalid,400)
base_draft=payload(call('/api/merchant/products/'+root,h=h));base_draft.pop('contentRevision',None)
variants=[]
for color,material in [('Oak','Oak'),('Ocean','Ocean')]:
    d=copy.deepcopy(base_draft);d['id']=str(uuid.uuid4());d['revision']=0;d['catalog'].update(parentId=root,options={'color':color},productNumber='3D-'+color);d['commerce']['media'][0]['modelVariant']=material
    variants.append(call('/api/merchant/products',d,h)['id'])
for sku,material in zip(variants,['Oak','Ocean']):
    assert call('/store-api/product/'+sku,{},{'x-tenant':tenant})['product']['media'][0]['modelVariant']==material
    assert raw(item['url']+'&productId='+sku)==model()
wrong=payload(call('/api/merchant/products/'+variants[0],h=h));wrong['commerce']['media'][0]['modelVariant']='Missing';call('/api/merchant/products/'+variants[0],wrong,h,'PUT',400)
other=call('/api/auth/register',{'workspaceId':tenant+'-other','name':'Other model owner','email':tenant+'-other@example.test','password':'Synthetic-3d-fixture-password!'})
oh={'x-tenant':other['workspace'],'Authorization':'Bearer '+other['token']}
raw('/api/merchant/assets/'+asset['id'],h=oh,status=404)
raw(item['url'].replace(tenant,other['workspace']),status=404)
wide=upload(variants[1],h,model(True));call('/api/merchant/assets/'+wide['id'],{'digest':wide['digest'],'public':True},h,'PUT')
d=payload(call('/api/merchant/products/'+variants[1],h=h));d['commerce']['media']=[{**item,'id':wide['id'],'url':'/store-api/assets/'+wide['id']+'?shop='+tenant,'modelVariant':'Ocean'}];call('/api/merchant/products/'+variants[1],d,h,'PUT')
assert raw(d['commerce']['media'][0]['url']+'&productId='+variants[1])==model(True)
# A channel exposing only a child may serve that child's inherited model, not an unrelated product.
channel={'id':'model_channel','revision':0,'data':{'name':{'en-GB':'Models'},'kind':'storefront','active':True,'visibility':'public','locales':['en-GB'],'productIds':[variants[0]]}}
call('/api/automation/channels/model_channel',channel,h,'PUT')
assert raw(item['url']+'&productId='+variants[0]+'&channel=model_channel')==model()
raw(item['url']+'&channel=model_channel',status=404)
# Sandbox model bytes and draft product must be explicitly released together.
stage=call('/api/environments',{'name':'3D preview'},h)['id'];sh={**h,'x-tenant':stage}
sa=upload(root,sh,model(True));call('/api/merchant/assets/'+sa['id'],{'digest':sa['digest'],'public':True},sh,'PUT')
sd=payload(call('/api/merchant/products/'+root,h=sh));sd['commerce']['media']=[{**item,'id':sa['id'],'url':'/store-api/assets/'+sa['id']+'?shop='+stage}];call('/api/merchant/products/'+root,sd,sh,'PUT')
changes=call('/api/environments/'+stage+'/diff',h=h)['changes'];keys=['product:'+root,'asset:'+sa['id']];selection=[{'key':c['key'],'digest':c['digest']}for c in changes if c['key']in keys]
assert len(selection)==2
call('/api/environments/'+stage+'/release',{'approve':True,'selections':[v for v in selection if v['key'].startswith('product:')]},h,status=409)
call('/api/environments/'+stage+'/release',{'approve':True,'selections':selection},h)
assert raw('/store-api/assets/'+sa['id']+'?shop='+tenant)==model(True)
if os.environ.get('MODEL_FIXTURE_OUT'):
    pathlib.Path(os.environ['MODEL_FIXTURE_OUT']).write_text(json.dumps({'shop':tenant,'token':session['token'],'product':root,'variants':variants,'stage':stage}))
print('PASS native GLB upload/preview, malformed/external rejection, real material and geometry variants, tenant/channel isolation, stale revision and selected sandbox release')
