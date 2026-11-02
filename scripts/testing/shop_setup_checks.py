"""Personal setup progression exercises the native HTTP/MCP workspace CAS and tenant boundaries."""
import copy

def verify_setup(call, account, headers, mcp):
    person = account('setup')
    foreign = account('other-setup')
    own, other = headers(person), headers(foreign)
    current = call('/api/studio/workspace', h=own)
    assert current['revision'] == 0
    original = current['data']
    progress = {'version': 1, 'state': 'active', 'step': 'products', 'reviewed': ['basics']}
    data = {**original, 'setup': progress}
    saved = call('/api/studio/workspace', {'revision': 0, 'data': data}, own, method='PUT')
    assert saved['revision'] == 1 and saved['data'] == data
    call('/api/studio/workspace', {'revision': 0, 'data': data}, own, 409, 'PUT')
    assert 'setup' not in call('/api/studio/workspace', h=other)['data']
    assert call('/api/studio/workspace', h=headers(person, foreign['workspace']), status=403)
    read = mcp('studio.workspace.read', {}, own)
    assert 'products' in str(read) and 'basics' in str(read)
    for patch in [{'step': 'root'}, {'reviewed': ['basics', 'basics']}, {'state': 'complete'}, {'permissions': ['owner']}]:
        invalid = copy.deepcopy(data)
        invalid['setup'].update(patch)
        call('/api/studio/workspace', {'revision': 1, 'data': invalid}, own, 400, 'PUT')
    assert call('/api/studio/workspace', h=own)['revision'] == 1
    paused = copy.deepcopy(data)
    paused['setup']['state'] = 'dismissed'
    call('/api/studio/workspace', {'revision': 1, 'data': paused}, own, method='PUT')
    restored = call('/api/studio/workspace', h=own)
    assert restored['data']['setup']['step'] == 'products'
    assert restored['data']['setup']['state'] == 'dismissed'
    assert len(restored['versions']) == 2
    assert restored['versions'][-1]['data']['setup']['state'] == 'active'
    complete = copy.deepcopy(paused)
    complete['setup'].update(state='complete', reviewed=['basics', 'products', 'design', 'checkout', 'legal', 'test'])
    call('/api/studio/workspace', {'revision': 2, 'data': complete}, own, method='PUT')
    assert call('/api/studio/workspace', h=other)['revision'] == 0
    print('PASS native setup save/reload/pause/complete, CAS/history, MCP and foreign-shop rejection', flush=True)
