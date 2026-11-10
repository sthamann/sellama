#!/usr/bin/env python3
"""Exercise a checked-out Knowledge service and the installed catalog app against disposable local Core."""
import json
import os
from pathlib import Path
import secrets
import socket
import sys
from urllib.parse import urlsplit

from testing.app_approval import digest, pin
from testing.runtime import ROOT, artifact_path, run, serve, stop


def main():
    env = dict(os.environ)
    database = urlsplit(env["DATABASE_URL"])
    origin = env["BASE_URL"]
    listener = urlsplit(origin)
    if (
        database.hostname not in ("127.0.0.1", "localhost")
        or listener.scheme != "http"
        or listener.hostname != "127.0.0.1"
        or not listener.port
        or origin != f"http://127.0.0.1:{listener.port}"
    ):
        raise SystemExit("Use only a disposable local database and Core listener")
    env.update(BIND_ADDR=listener.netloc, PROCESS_ROLE="all", APP_WORKER_ENABLED="true")
    if env.get("KNOWLEDGE_TEST_NATIVE_AUTHORITY") == "1":
        env.update(
            KNOWLEDGE_IDENTITY_SHOP="knowledge-sync-" + secrets.token_hex(5),
            KNOWLEDGE_INTROSPECTION_TOKEN=secrets.token_hex(32),
            PLATFORM_SECRET_KEY=secrets.token_hex(32),
        )
    component = Path(env["KNOWLEDGE_REPOSITORY"]).resolve()
    binary = str(Path(env["KNOWLEDGE_TEST_BINARY"]).resolve())
    manifest_path = ROOT / "extensions/apps/knowledge-catalog/manifest.json"
    manifest = json.loads(manifest_path.read_text())
    with socket.socket() as probe:
        probe.bind(("127.0.0.1", 0))
        knowledge_port = probe.getsockname()[1]
    token = "fixture-knowledge-catalog-delivery"
    app = manifest["id"]
    env["APP_SERVICES"] = json.dumps(pin({app: {
        "url": f"http://127.0.0.1:{knowledge_port}", "token": token,
    }}, app, manifest))
    with artifact_path("knowledge-component-catalog.log").open("w") as log:
        core = serve(env, origin, log)
        try:
            run([sys.executable, str(component / "service/tests/acceptance.py")], {
                **env,
                "KNOWLEDGE_TEST_ADMIN_URL": database._replace(path="/postgres").geturl(),
                "KNOWLEDGE_TEST_COMMERCE_ORIGIN": origin,
                "KNOWLEDGE_TEST_BIND_PORT": str(knowledge_port),
                "KNOWLEDGE_TEST_CATALOG_MANIFEST": str(manifest_path),
                "KNOWLEDGE_TEST_CATALOG_DIGEST": digest(manifest),
                "KNOWLEDGE_TEST_CATALOG_TOKEN": token,
                "KNOWLEDGE_TEST_BINARY": binary,
            })
        finally:
            stop(core)


if __name__ == "__main__":
    main()
