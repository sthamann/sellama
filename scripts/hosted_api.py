#!/usr/bin/env python3
"""Check API discovery, explicit shop scope and presentation isolation on the existing HTTP server."""
import json
import os
from urllib.error import HTTPError
from urllib.request import Request, urlopen

base = os.environ["BASE_URL"]
api = {"Host": "api.veyndo.ai"}
scope = {**api, "x-tenant": "atelier"}


def request(path, headers, status=200, body=None):
    payload = json.dumps(body).encode() if body is not None else None
    req = Request(base + path, data=payload, headers={"Content-Type": "application/json", **headers})
    try:
        response = urlopen(req, timeout=10)
    except HTTPError as error:
        response = error
    with response:
        assert response.status == status, (path, response.status, status)
        return response.headers.get_content_type(), response.read()


_, discovery = request("/", api)
assert json.loads(discovery)["mode"] == "api-only"
assert request("/.well-known/veyndo", api)[1] == discovery
assert json.loads(request("/health", api)[1])["status"] == "ok"
for path in ["/checkout", "/products/desk", "/index.html", "/assets/index.js", "/apiary"]:
    mime, body = request(path, {**api, "Accept": "text/html"}, 404)
    assert mime == "application/json" and b"This origin serves commerce APIs" in body
native = {"Host": "app.veyndo.ai"}
if os.environ.get("HTTP_PROFILE") == "api-only":
    assert request("/", native)[1] == discovery
    request("/checkout", native, 404)
else:
    assert request("/", native)[0] == "text/html"
request("/store-api/product", api, 400, {"limit": 1})
_, products = request("/store-api/product", scope, body={"limit": 1})
assert len(json.loads(products)["elements"]) == 1
request("/store-api/product", {**scope, "x-tenant": "unknown-tenant"}, 404, {"limit": 1})
request("/api/merchant/commerce", scope, 401)
_, tools = request("/mcp", scope, body={"jsonrpc": "2.0", "id": 1, "method": "tools/list"})
names = {tool["name"] for tool in json.loads(tools)["result"]["tools"]}
assert "catalog.search" in names and "merchant.apply" not in names
assert "ucp" in json.loads(request("/.well-known/ucp", scope)[1])
assert request("/ucp/2026-10-13/b2b-negotiation.json", api)[0] == "application/json"
print("PASS Store, merchant, MCP and UCP routes respect the configured presentation profile")
