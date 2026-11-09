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
    assert resource['_meta']['ai.veyndo/definition']['productReference'] == 'product_id'
    assert [c['value'] for c in resource['_meta']['ai.veyndo/definition']['filter']['choices']] == ['standard', 'priority']
    assert r'\u003c/script\u003e' in resource['text'] and '<img src=x' not in resource['text']
    assert 'Machine washable' not in resource['text']
    assert any(r['uri'] == public_uri for r in rpc('resources/list')['result']['resources'])
    private_resource = rpc('resources/read', {'uri': private_uri}, merchant)['result']['contents'][0]
    assert private_resource['_meta']['ai.veyndo/definition']['productReference'] is None
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


def verify_cart_review(call, merchant, visitor, other):
    for variant, size in [('guide_mug_small', 'Small'), ('guide_mug_large', 'Large')]:
        call('/api/merchant/products', {
            'id': variant, 'revision': 0, 'extra': {},
            'catalog': {'active': True, 'parentId': 'mug', 'productNumber': variant,
                        'options': {'Size': size}, 'categoryIds': []},
            'commerce': {'price': 25, 'taxRate': 19, 'stock': 10, 'minPurchase': 1,
                         'purchaseSteps': 1, 'deliveryDays': 2, 'advancedPrices': [],
                         'media': [], 'properties': {}},
            'translations': {'en': {'name': f'Guide mug {size}', 'description': 'Fixture'}},
        }, merchant)
    cart_path = '/store-api/checkout/cart'
    cart = call(cart_path, {}, visitor)
    shopper = {**visitor, 'sw-context-token': cart['token']}
    requested = {'revision': cart['revision'], 'items': [{'id': 'guide_mug_large', 'quantity': 1}]}
    quote = call(cart_path + '/preview', requested, shopper)
    assert quote['price']['totalPrice'] > 0 and quote['delivery']['earliest']
    assert 'token' not in quote and 'checkout' not in quote
    unchanged = call(cart_path, headers=shopper)
    assert unchanged['revision'] == cart['revision'] and not unchanged['lineItems']
    call(cart_path + '/preview', requested, {**other, 'sw-context-token': cart['token']}, expected=404)
    call(cart_path, {**requested, 'items': [{'id': 'guide_mug_small', 'quantity': 1}],
                     'review': quote['review']}, shopper, expected=409, method='PUT')
    variant_path = '/api/merchant/products/guide_mug_large'
    product = call(variant_path, headers=merchant)
    product['commerce']['price'] = 26
    call(variant_path, product, merchant, method='PUT')
    call(cart_path, {**requested, 'review': quote['review']}, shopper, expected=409, method='PUT')
    quote = call(cart_path + '/preview', requested, shopper)
    confirmed = call(cart_path, {**requested, 'review': quote['review']}, shopper, method='PUT')
    assert confirmed['price']['totalMinor'] == quote['price']['totalMinor']
    assert confirmed['lineItems'][0]['id'] == 'guide_mug_large'
    call(cart_path, {**requested, 'review': quote['review']}, shopper, expected=409, method='PUT')
    assert call(cart_path, headers=shopper)['lineItems'][0]['quantity'] == 1


def verify_shopper_stream(base, visitor, expected_uri, finished, release):
    request = urllib.request.Request(
        base + "/api/concierge",
        data=json.dumps({"request": "Inspect guide fixture. Hold shopper final."}).encode(),
        headers={**visitor, "Content-Type": "application/json", "Accept": "text/event-stream"},
    )

    def frame(response):
        event = None
        for line in response:
            if line.startswith(b"event: "):
                event = line.removeprefix(b"event: ").decode().strip()
            elif line.startswith(b"data: "):
                return event, json.loads(line.removeprefix(b"data: "))
        raise AssertionError("Shopper stream ended before its next event")

    try:
        with urllib.request.urlopen(request, timeout=8) as response:
            assert response.headers.get_content_type() == "text/event-stream"
            assert "no-store" in response.headers["Cache-Control"]
            kind, views = frame(response)
            assert kind == "app-views" and len(views) == 1
            assert views[0]["resourceUri"] == expected_uri
            assert views[0]["result"]["structuredContent"]["elements"][0]["id"] == "a"
            assert "Private notes fixture" not in json.dumps(views)
            assert not finished.is_set(), "The app result must be readable before the model finishes"
            release.set()
            kind, complete = frame(response)
            assert kind == "complete" and complete["answer"]["appViews"] == views
    finally:
        release.set()


def verify_studio_progress(call, merchant, other, colleague, expected_uri, finished, release):
    from time import monotonic, sleep

    chat = call("/api/agent/chat", {
        "message": "Read merchandise fixture. Hold Studio final.",
        "background": True,
        "inference": {"provider": "openai", "model": "local-fixture"},
    }, merchant)
    path = "/api/agent/runs/" + chat["run"]["taskId"]

    def wait_for(predicate):
        deadline = monotonic() + 12
        while monotonic() < deadline:
            status = call(path, headers=merchant)
            if predicate(status):
                return status
            sleep(.15)
        raise AssertionError(f"Expected Studio run transition, last state: {status['state']}")

    try:
        status = wait_for(lambda run: run.get("appViews"))
        assert status["state"] == "running" and status["preview"] is None
        assert not finished.is_set()
        views = status["appViews"]
        assert views == [{"attachmentId": 0, "resourceUri": expected_uri,
                          "arguments": {"limit": 1, "filter": {"product_id": "mug"}}}]
        call(path, headers=other, expected=404)
        call(path, headers=colleague, expected=403)
        result = call("/mcp", {
            "jsonrpc": "2.0", "id": 1, "method": "tools/call",
            "params": {"name": "app.example_agent_results.list_merchant_entries",
                       "arguments": views[0]["arguments"],
                       "_meta": {"ai.veyndo/resourceUri": expected_uri}},
        }, merchant)["result"]
        assert result["structuredContent"]["elements"][0]["id"] == "private"
        conversation = call("/api/agent/conversations/" + chat["conversationId"], headers=merchant)
        assert [message["role"] for message in conversation["messages"]] == ["user"]
        release.set()
        complete = wait_for(lambda run: run["state"] == "ready")
        assert "appViews" not in complete
        final_view = complete["preview"]["appViews"][0]
        assert {key: final_view[key] for key in views[0]} == views[0]
        assert final_view["result"]["structuredContent"]["elements"][0]["id"] == "private"
    finally:
        release.set()
