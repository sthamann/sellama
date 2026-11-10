#!/usr/bin/env python3
"""Validate the Lumen release lock and optionally compare it with Northflank."""

import argparse
from concurrent.futures import ThreadPoolExecutor
import json
from pathlib import Path
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / "deploy/composition.lock.json"
GIT_SHA = re.compile(r"[0-9a-f]{40}")
OCI_DIGEST = re.compile(r"sha256:[0-9a-f]{64}")
RESOURCE = re.compile(r"[a-z0-9][a-z0-9-]*")
REPOSITORIES = {
    "core": "veyndo", "app-worker": "veyndo", "checkout": "checkout",
    "knowledge": "knowledge", "connectors": "connectors", "payments": "shopware-payments",
    "experience": "experience", "automation": "automation",
}
CONNECTIONS = {
    ("experience", "core"), ("core", "checkout"), ("core", "payments"),
    ("app-worker", "core"), ("app-worker", "connectors"), ("app-worker", "knowledge"),
    ("automation", "core"),
}


def require(condition, message):
    if not condition:
        raise ValueError(message)


def unique_keys(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, f"Repeated lock field: {key}")
        result[key] = value
    return result


def validate(lock, root=ROOT):
    require(lock["version"] == 1 and lock["profile"] == "hosted-lumen-commerce",
            "Unsupported composition lock version or profile")
    components = lock["components"]
    require(components.keys() == REPOSITORIES.keys(), "Missing or unknown Lumen component")
    services = set()
    for name, row in components.items():
        require(row["repository"] == f"https://github.com/veyndo/{REPOSITORIES[name]}",
                f"{name}: wrong source repository")
        require(GIT_SHA.fullmatch(row["commit"]) and OCI_DIGEST.fullmatch(row["digest"]),
                f"{name}: expected a commit SHA and a manifest digest")
        service = row["service"]
        require(RESOURCE.fullmatch(service) and service not in services, f"{name}: invalid service")
        services.add(service)
        if name == "automation":
            require(re.fullmatch(r"[0-9a-f]{24}", row["import_id"]) and row["schema"] is None,
                    "automation: expected an immutable import and no storage")
            continue
        for field in ("build_service", "build_id"):
            require(RESOURCE.fullmatch(row[field]) and row[field] != "latest",
                    f"{name}: invalid {field}")
        schema = row["schema"]
        require(schema["owner"] == ("core" if name == "app-worker" else name)
                and bool(schema["inputs"]), f"{name}: missing schema ownership or inputs")
        for path, sha in schema["inputs"].items():
            candidate = Path(path)
            require(path not in ("", ".") and not candidate.is_absolute()
                    and ".." not in candidate.parts and GIT_SHA.fullmatch(sha),
                    f"{name}: invalid schema input")
        if name in {"core", "app-worker", "payments"}:
            require(re.fullmatch(r"[0-9]{3}(?:-[a-z0-9-]+)?\.sql", schema["through"]),
                    f"{name}: missing migration boundary")

    contracts = lock["contracts"]
    connections = {(edge["consumer"], edge["provider"]) for edge in contracts}
    require(connections == CONNECTIONS and len(contracts) == len(connections),
            "Incomplete or repeated contract edges")
    for edge in contracts:
        guide = edge["guide"].split("#", 1)[0]
        require(bool(edge["contract"].strip()) and guide.startswith("docs/")
                and ".." not in Path(guide).parts and (root / guide).is_file(),
                "Missing compatibility contract guide")


def compare(name, row, deployment, logs=None):
    require(deployment.get("instances", 0) > 0, f"{name}: no configured instances")
    if name == "automation":
        require(deployment.get("importedImage", {}).get("imageId") == row["import_id"]
                and deployment.get("image", {}).get("tag") == f"sha-{row['commit']}",
                f"{name}: deployment uses a different import or source revision")
        return
    build = deployment.get("internal", {})
    for field, expected in {
        "nfObjectId": row["build_service"], "buildId": row["build_id"],
        "repository": row["repository"], "buildSHA": row["commit"], "deployedSHA": row["commit"],
    }.items():
        require(build.get(field) == expected, f"{name}: deployment {field} differs from the lock")
    digests = {
        digest for line in logs
        if "pushing manifest for" in line["log"]
        for digest in OCI_DIGEST.findall(line["log"])
    }
    require(digests == {row["digest"]}, f"{name}: build has no unique matching manifest digest")


def verify_source(row, directory):
    def git(*arguments):
        result = subprocess.run(["git", "-C", str(directory), *arguments],
                                capture_output=True, text=True, timeout=15, check=False)
        require(result.returncode == 0, "Source checkout is missing the pinned commit or schema input")
        return result.stdout.strip()

    sha = row["commit"]
    git("cat-file", "-e", f"{sha}^{{commit}}")
    schema = row["schema"]
    if schema is None:
        return
    for path, expected in schema["inputs"].items():
        require(git("rev-parse", f"{sha}:{path}") == expected,
                f"Source schema input differs from the lock: {path}")
    if "through" in schema:
        folders = [path for path in schema["inputs"] if path.rsplit("/", 1)[-1] == "migrations"]
        require(len(folders) == 1, "Migration boundary has no unique schema directory")
        git("cat-file", "-e", f"{sha}:{folders[0]}/{schema['through']}")


def verify_sources(lock, sources):
    selected = set()
    for selection in sources:
        name, separator, directory = selection.partition("=")
        require(separator and directory and name in lock["components"] and name not in selected,
                "Use --source COMPONENT=CHECKOUT once per known component")
        selected.add(name)
        verify_source(lock["components"][name], directory)
        print(f"{name}: pinned source and schema inputs matched")


def verify_hosted(lock, cli, project):
    def request(*arguments):
        result = subprocess.run([cli, "get", "service", *arguments, "--project", project, "-o", "json"],
                                capture_output=True, text=True, timeout=30, check=False)
        require(result.returncode == 0, f"Northflank query failed: {' '.join(arguments[:3])}")
        return json.loads(result.stdout)

    def verify(item):
        name, row = item
        deployment = request("deployment", "--service", row["service"])
        logs = None
        if "build_id" in row:
            logs = request("build-logs", "--service", row["build_service"], "--build", row["build_id"],
                           "--lineLimit", "300", "--textIncludes", "pushing manifest for")
        compare(name, row, deployment, logs)
        service = request("--service", row["service"])
        require(service.get("status", {}).get("deployment", {}).get("status") == "COMPLETED",
                f"{name}: deployment has not completed")
        print(f"{name}: exact deployment matched ({row['commit'][:8]})")

    with ThreadPoolExecutor(max_workers=4) as pool:
        list(pool.map(verify, lock["components"].items()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--northflank", metavar="CLI", help="read live metadata with the authenticated CLI")
    parser.add_argument("--source", action="append", default=[], metavar="COMPONENT=CHECKOUT",
                        help="check pinned commits and schema inputs in a local component repository")
    parser.add_argument("--project", default="vendune")
    args = parser.parse_args()
    try:
        lock = json.loads(LOCK.read_text(), object_pairs_hook=unique_keys)
        validate(lock)
        verify_sources(lock, args.source)
        if args.northflank:
            verify_hosted(lock, args.northflank, args.project)
    except (ValueError, TypeError, KeyError, OSError, subprocess.TimeoutExpired) as error:
        parser.exit(1, f"Composition verification failed: {error}\n")
    print(f"Composition lock verified: {lock['profile']}")


if __name__ == "__main__":
    main()
