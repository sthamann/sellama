"""Actual caption proposal, ownership, locale persistence and selected page-release regressions; synthetic provider only."""
import base64, copy, json, urllib.request, uuid


def verify(call, account, headers, mcp, base, state, seen):
    owner, foreign = account('caption-owner'), account('caption-foreign')
    h, other = headers(owner), headers(foreign)
    path = '/api/merchant/media/caption'
    body = {'locale': 'de-DE', 'context': 'Chair from the current merchant catalogue'}
    before = call('/api/merchant/products/chair', h=h)
    count = len(seen)
    call(path, body, status=401)
    call(path, {**body, 'locale': 'zz-ZZ'}, h, 400)
    key = call('/api/workspace/integrations', {'name': 'Caption denied', 'permissions': ['catalog.read'], 'expiresInDays': 1}, h)
    denied = {'x-tenant': owner['workspace'], 'Authorization': 'Bearer '+key['key']}
    call(path, body, denied, 403)
    assert len(seen) == count
    result = call(path, body, h)
    assert result['locale'] == 'de-DE' and result['basis'] == 'context' and result['promptId'] == 'media-caption@1'
    assert call('/api/merchant/products/chair', h=h) == before
    tool = mcp('merchant.media.caption', body, h)['result']
    assert not tool.get('isError') and tool['structuredContent']['caption'] == result['caption']
    prompt = seen[-1]['messages'][0]['content']
    assert prompt.startswith('[prompt:media-caption@1]') and 'untrusted' in prompt
    # A private native upload is evidence only for its owning merchant.
    boundary = uuid.uuid4().hex
    png = base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR4nGP4DwQACfsD/fteaysAAAAASUVORK5CYII=')
    parts = [('title', json.dumps({'en-GB': 'Synthetic chair'})), ('kind', 'attachment')]
    payload = b''.join(('--'+boundary+'\r\nContent-Disposition: form-data; name="'+k+'"\r\n\r\n'+v+'\r\n').encode() for k,v in parts)
    payload += ('--'+boundary+'\r\nContent-Disposition: form-data; name="file"; filename="fixture.png"\r\nContent-Type: image/png\r\n\r\n').encode()+png+('\r\n--'+boundary+'--\r\n').encode()
    upload = urllib.request.Request(base+'/api/merchant/products/chair/assets', data=payload, headers={**h, 'Content-Type':'multipart/form-data; boundary='+boundary})
    with urllib.request.urlopen(upload) as response: asset = json.load(response)
    url = '/store-api/assets/'+asset['id']
    result = call(path, {**body, 'imageUrl': url}, h)
    assert result['basis'] == 'image' and seen[-1]['messages'][1]['images']
    count = len(seen)
    call(path, {**body, 'imageUrl': url+'?shop='+owner['workspace']}, other, 404)
    call(path, {**body, 'imageUrl': 'https://127.0.0.1/secret'}, h, 403)
    assert len(seen) == count
    # Persist the accepted text through the existing product revision owner.
    edit = copy.deepcopy(before)
    for field in ('id', 'channels'): edit.pop(field, None)
    edit['commerce']['media'] = [{'id':'caption_photo', 'url':'https://example.test/chair.png', 'view':'Chair', 'alt':{'en-GB':'Accessible chair'}, 'caption':{'en-GB':'A chair in sunlight.', 'de-DE':result['caption'], 'fr-FR':None}}]
    call('/api/merchant/products/chair', edit, h, method='PUT')
    stored = call('/api/merchant/products/chair', h=h)
    assert stored['commerce']['media'][0]['caption']['de-DE'] == result['caption']
    public = {'x-tenant':owner['workspace'], 'x-commerce-locale':'de-DE'}
    assert call('/store-api/product/chair', {}, public)['product']['media'][0]['caption'] == result['caption']
    assert call('/store-api/product/chair', {}, {**public, 'x-commerce-locale':'fr-FR'})['product']['media'][0]['caption'] == 'A chair in sunlight.'
    edit = copy.deepcopy(stored)
    for field in ('id', 'channels'): edit.pop(field, None)
    edit['commerce']['media'][0]['caption']['de-DE'] = ''
    call('/api/merchant/products/chair', edit, h, method='PUT')
    assert call('/store-api/product/chair', {}, public)['product']['media'][0]['caption'] == ''
    baseline = call('/api/merchant/products/chair', h=h)
    edit['revision'] = baseline['revision']
    for invalid in ({'zz-ZZ':'Unknown locale'}, {'de-DE':'x'*601}):
        edit['commerce']['media'][0]['caption'] = invalid
        call('/api/merchant/products/chair', edit, h, 400, 'PUT')
    assert call('/api/merchant/products/chair', h=h) == baseline
    state['captionMode'] = 'markup'
    call(path, body, h, 400)
    state['captionMode'] = 'unavailable'
    error = call(path, body, h, 502)
    assert 'provider-secret' not in json.dumps(error)
    state.pop('captionMode')
    assert call('/api/merchant/products/chair', h=h) == baseline
    # Captions stay in the existing app document and atomic sandbox release.
    call('/api/apps', {'builtIn':'site_builder'}, h)
    page = {'channel':'default','slug':'caption','title':{'en-GB':'Caption page'},'kind':'page','status':'published','starts_at':None,'content':{'blocks':[{'id':'photo','kind':'image','image':'https://example.test/chair.png','caption':{'en-GB':'Live caption'},'imageAlt':{'en-GB':'Accessible chair'}}]},'theme':{},'seo':None,'author':None,'category':None}
    save = '/api/apps/site_builder/actions/save_page'
    call(save, {'id':'caption_page','revision':0,'fields':page}, h)
    stage = call('/api/environments', {'name':'Caption preview'}, h)['id']
    sh = headers(owner, stage)
    page['content']['blocks'][0]['caption']['de-DE'] = 'Aus der Sandbox'
    call(save, {'id':'caption_page','revision':1,'fields':page}, sh)
    def pages(): return call('/store-api/apps/site_builder/actions/pages', {}, public)['elements']
    assert pages()[0]['content']['blocks'][0]['caption'] == {'en-GB':'Live caption'}
    change = next(c for c in call('/api/environments/'+stage+'/diff', h=h)['changes'] if c['key']=='appdata:site_builder:pages:caption_page')
    call('/api/environments/'+stage+'/release', {'approve':True,'selections':[{'key':change['key'],'digest':change['digest']}]}, h)
    assert pages()[0]['content']['blocks'][0]['caption']['de-DE'] == 'Aus der Sandbox'
    assert call('/api/apps/site_builder/entities/pages/caption_page/history', h=h)['versions']
    call(save, {'id':'caption_page','revision':1,'fields':page}, h, 409)
    print('PASS caption HTTP/MCP proposal parity, permission/locale/owned-image admission, bounded image evidence, product inheritance/explicit empty, provider failure non-mutation and sandbox page publication')
