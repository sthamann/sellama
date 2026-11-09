"""Exercise installed MCP App placement, native tool calls, actor admission and conversation attachments."""
import copy
import json
import urllib.request


def verify(root, base, call, merchant, visitor, other, restricted):
    manifest = json.loads((root / 'extensions/apps/assistant-examples/mcp-app.json').read_text())
    manifest['surfaces'][1]['label']['en'] = '</script><img src=x onerror=alert(1)>'
    app = manifest['id']

    def rpc(method, params=None, who=visitor):
        return call('/mcp', {'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or {}}, who)

    broken = copy.deepcopy(manifest)
    broken['actions'][0]['mcp'] = False
    call('/api/apps', {'manifest': broken}, merchant, expected=400)
    call('/api/apps', {'manifest': manifest}, merchant)
    action = f'/api/apps/{app}/actions/save_entries'
    for key, title, segment in [('a', 'Machine washable', 'standard'), ('b', 'Air dry only', 'priority')]:
        call(action, {'id': key, 'fields': {'product_id':'mug','title':{'en':title},'segment':segment}}, merchant)

    call(f'/api/apps/{app}/actions/save_merchant_entry',
         {'id': 'private', 'fields': {'product_id':'mug','title':{'en':'Private notes fixture'},'segment':'priority'}}, merchant)
    call(f'/api/apps/{app}/actions/save_merchant_entry',
         {'id': 'z-private', 'fields': {'product_id':'mug','title':{'en':'Standard notes fixture'},'segment':'standard'}}, merchant)

    extension = 'io.modelcontextprotocol/ui'
    mime = 'text/html;profile=mcp-app'
    assert extension in rpc('initialize', {'capabilities': {'extensions': {extension: {'mimeTypes': [mime]}}}})['result']['capabilities']['extensions']
    tools = {t['name']: t for t in rpc('tools/list')['result']['tools']}
    public_tool = f'app.{app}.list_entries'
    private_tool = f'app.{app}.list_merchant_entries'
    public_uri = tools[public_tool]['_meta']['ui']['resourceUri']
    assert private_tool not in tools
    merchant_tools = {t['name']: t for t in rpc('tools/list', who=merchant)['result']['tools']}
    private_uri = merchant_tools[private_tool]['_meta']['ui']['resourceUri']
    resource = rpc('resources/read', {'uri': public_uri})['result']['contents'][0]
    assert resource['mimeType'] == mime and resource['_meta']['ai.veyndo/definition']['toolName'] == public_tool
    assert [c['value'] for c in resource['_meta']['ai.veyndo/definition']['filter']['choices']] == ['standard', 'priority']
    assert r'\u003c/script\u003e' in resource['text'] and '<img src=x' not in resource['text']
    assert 'Machine washable' not in resource['text']
    assert any(r['uri'] == public_uri for r in rpc('resources/list')['result']['resources'])
    assert rpc('resources/read', {'uri': private_uri}, merchant)['result']['contents']
    for who, uri in [(visitor, private_uri), (restricted, private_uri), (other, public_uri)]:
        assert rpc('resources/read', {'uri': uri}, who)['error']['code'] == -32602
    page = rpc('tools/call', {'name': public_tool, 'arguments': {'limit': 1}})['result']
    assert page['structuredContent']['elements'][0]['id'] == 'a'
    assert 'Private notes fixture' not in json.dumps(page)
    private_page = rpc('tools/call', {'name': private_tool, 'arguments': {'limit': 1}}, merchant)['result']
    assert private_page['structuredContent']['elements'][0]['id'] == 'private'
    args = {'name': public_tool, 'arguments': {'limit': 1, 'after': page['structuredContent']['nextCursor']},
            '_meta': {'ai.veyndo/resourceUri': public_uri}}
    assert rpc('tools/call', args)['result']['structuredContent']['elements'][0]['id'] == 'b'
    assert rpc('tools/call', {**args, '_meta': {'ai.veyndo/resourceUri': private_uri}})['result']['isError']
    for who, tool, uri, record in [(visitor, public_tool, public_uri, 'b'),
                                    (merchant, private_tool, private_uri, 'private')]:
        filtered = {'name': tool, 'arguments': {'limit': 1, 'filter': {'product_id': 'mug', 'segment': 'priority'}},
                    '_meta': {'ai.veyndo/resourceUri': uri}}
        rows = rpc('tools/call', filtered, who)['result']['structuredContent']['elements']
        assert [row['id'] for row in rows] == [record]
        if who == merchant:
            for denied in [visitor, restricted, other]:
                response = rpc('tools/call', filtered, denied)
                assert 'error' in response or response['result']['isError']
    with urllib.request.urlopen(base + '/app-ui/mcp-view') as iframe:
        assert iframe.headers['content-security-policy'].startswith("sandbox allow-scripts;")
        assert "connect-src 'none'" in iframe.headers['content-security-policy']
        assert 'Machine washable' not in iframe.read().decode()
    return app, public_uri, private_uri
