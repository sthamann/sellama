"""Measure catalog, simulated checkout and agent requests while a private worker restarts."""
from concurrent.futures import ThreadPoolExecutor
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from statistics import quantiles
import subprocess
from threading import Event, Thread
from time import monotonic, sleep
from uuid import uuid4

from testing.database import psql
from testing.native_tools import response
from testing.runtime import artifact_path


class ModelFixture(BaseHTTPRequestHandler):
    def log_message(self, *_):
        pass

    def do_POST(self):
        request = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if self.path != "/api/chat":
            self.send_error(503)
            return
        sleep(.08)
        result = response(request, provider="ollama") if request.get("tools") else {
            "done": True, "message": {"role": "assistant", "content": json.dumps({
                "explanation": "The catalog is available.", "recommended_ids": [],
                "layout": "discovery",
            })},
        }
        body = json.dumps(result).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def model(case):
    server = ThreadingHTTPServer(("127.0.0.1", 0), ModelFixture)
    thread = Thread(target=server.serve_forever, daemon=True)
    thread.start()
    case.addCleanup(server.server_close)
    case.addCleanup(server.shutdown)
    return f"http://127.0.0.1:{server.server_port}"


def measure(api, merchant, checkout_headers, stop_worker, start_worker,
            container, database, messages):
    tenant = merchant["x-tenant"]
    assert tenant.startswith("mail-") and tenant.removeprefix("mail-").isalnum()
    assert database.startswith("commerce_mail_")

    def sql(statement):
        return subprocess.check_output(
            psql(container, "commerce", database, "-XAtq", "-v", "ON_ERROR_STOP=1"),
            input=statement, text=True,
        ).strip()

    catalog_size, orders, reads, agent_calls = 200_000, 48, 240, 16
    # This is fixture preparation. Warm the same lexical projection without
    # timing row-by-row import, history, or an unrelated embedding backfill.
    sql(f"""
      BEGIN;
      ALTER TABLE products DISABLE TRIGGER history_before;
      ALTER TABLE products DISABLE TRIGGER history_after;
      ALTER TABLE products DISABLE TRIGGER cognitive_product_intake;
      ALTER TABLE products DISABLE TRIGGER knowledge_product_words_changed;
      INSERT INTO products(tenant,id,name,category,description,price,tax_rate,stock)
      SELECT '{tenant}', 'mixed-' || lpad(i::text,6,'0'), 'Synthetic ' || i,
             'Mixed fixture', 'Synthetic load fixture', 24.90, 19, 20
      FROM generate_series(1,{catalog_size}) i;
      INSERT INTO knowledge_product_lexemes
      SELECT p.tenant,p.id,word FROM products p CROSS JOIN LATERAL
        unnest(tsvector_to_array(to_tsvector('simple',p.name||' '||p.description))) word
      WHERE p.tenant='{tenant}' AND p.id LIKE 'mixed-%';
      SET CONSTRAINTS ALL IMMEDIATE;
      ALTER TABLE products ENABLE TRIGGER history_before;
      ALTER TABLE products ENABLE TRIGGER history_after;
      ALTER TABLE products ENABLE TRIGGER cognitive_product_intake;
      ALTER TABLE products ENABLE TRIGGER knowledge_product_words_changed;
      COMMIT;
      ANALYZE products;
      ANALYZE knowledge_product_lexemes;
    """)
    assert int(sql(f"SELECT count(*) FROM products WHERE tenant='{tenant}' "
                   "AND id LIKE 'mixed-%'")) == catalog_size
    headers = {"x-tenant": tenant}
    ready = []
    for i in range(orders):
        sku = f"mixed-{i + 1:06}"
        ch = checkout_headers(sku, f"mixed-{uuid4().hex}")
        ready.append((sku, ch))

    worker_stopped = Event()
    first_committed = Event()
    received_before = len(messages)
    started = monotonic()

    def timed(operation):
        start = monotonic()
        result = operation()
        return (monotonic() - start) * 1000, result

    def buy(i):
        assert worker_stopped.wait(10)
        _, ch = ready[i]
        result = api("/store-api/checkout/order", {}, ch)
        assert result["payment"]["realMoneyCharged"] is False
        first_committed.set()
        return result

    def catalog(_):
        result = api("/store-api/product", {"limit": 50}, headers)
        assert len(result["elements"]) == 50 and result["hasMore"]

    def ask(i):
        result = api("/api/concierge", {"request": f"Show available mugs. Fixture {i}."}, headers)
        assert result["answer"]["explanation"] == "The catalog is available."

    def restart():
        stop_worker()
        worker_stopped.set()
        assert first_committed.wait(15), "Core must commit while its app worker is stopped"
        assert len(messages) == received_before
        start_worker()

    with (ThreadPoolExecutor(max_workers=12) as buying,
          ThreadPoolExecutor(max_workers=4) as reading,
          ThreadPoolExecutor(max_workers=1) as asking,
          ThreadPoolExecutor(max_workers=1) as operations):
        reboot = operations.submit(restart)
        order_jobs = buying.map(lambda i: timed(lambda: buy(i)), range(orders))
        read_jobs = reading.map(lambda i: timed(lambda: catalog(i)), range(reads))
        agent_jobs = asking.map(lambda i: timed(lambda: ask(i)), range(agent_calls))
        purchases, catalogs, answers = list(order_jobs), list(read_jobs), list(agent_jobs)
        reboot.result()
    elapsed = monotonic() - started

    order_ids = {result["id"] for _, result in purchases}
    assert len(order_ids) == orders
    for (_, ch), (_, result) in zip(ready, purchases):
        assert api("/store-api/checkout/order", {}, ch)["id"] == result["id"]
    assert int(sql(f"SELECT count(*) FROM products WHERE tenant='{tenant}' "
                   f"AND id BETWEEN 'mixed-000001' AND 'mixed-{orders:06}' AND stock=19")) == orders
    until = monotonic() + 90
    while len(messages) < received_before + orders and monotonic() < until:
        sleep(.1)
    delivered = messages[received_before:]
    assert len(delivered) == orders
    for _, result in purchases:
        number = result["orderNumber"].encode()
        assert sum(number in body for _, body in delivered) == 1
        assert len(api(f"/api/merchant/orders/{result['id']}/receipts",
                       headers=merchant)["elements"]) == 1

    samples = {}
    for name, rows in [("catalog", catalogs), ("checkout", purchases), ("agent", answers)]:
        values = [duration for duration, _ in rows]
        centiles = quantiles(values, n=100, method="inclusive")
        samples[name] = {"count": len(values), **{
            f"p{p}Ms": round(centiles[p - 1], 2) for p in (50, 95, 99)
        }}
    report = {"syntheticProducts": catalog_size, "seconds": round(elapsed, 2),
              "orders": orders, "uniqueMailReceipts": len(delivered), "samples": samples}
    artifact_path("mixed-commerce-load.json").write_text(json.dumps(report, indent=2) + "\n")
    print("MIXED_COMMERCE_LOAD", json.dumps(report), flush=True)
