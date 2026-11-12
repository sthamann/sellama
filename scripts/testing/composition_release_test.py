"""Reject drift and incomplete evidence in the hosted composition preflight."""

import copy
import json
import subprocess
import sys
import tempfile
import unittest
from types import SimpleNamespace
from unittest.mock import patch

from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from composition_release import (
    LOCK, compare, component_candidate, core_candidate, prepare_component, prepare_core,
    unique_keys, validate, verify_instances, verify_shared_schema, verify_source, verify_sources,
)


class CompositionReleaseTest(unittest.TestCase):
    def setUp(self):
        self.lock = json.loads(LOCK.read_text(), object_pairs_hook=unique_keys)

    def test_checked_in_profile_is_complete(self):
        validate(self.lock)

    def test_missing_component_or_contract_is_rejected(self):
        altered = copy.deepcopy(self.lock)
        del altered["components"]["app-worker"]
        with self.assertRaisesRegex(ValueError, "component"):
            validate(altered)
        altered = copy.deepcopy(self.lock)
        altered["contracts"].pop()
        with self.assertRaisesRegex(ValueError, "contract"):
            validate(altered)

    def test_floating_source_and_missing_schema_are_rejected(self):
        altered = copy.deepcopy(self.lock)
        altered["components"]["checkout"]["commit"] = "main"
        with self.assertRaisesRegex(ValueError, "commit SHA"):
            validate(altered)
        altered = copy.deepcopy(self.lock)
        altered["components"]["checkout"]["schema"]["inputs"].clear()
        with self.assertRaisesRegex(ValueError, "schema"):
            validate(altered)
        with self.assertRaisesRegex(ValueError, "Repeated"):
            json.loads('{"digest":"one","digest":"two"}', object_pairs_hook=unique_keys)

    def test_exact_build_requires_matching_image_and_non_floating_selector(self):
        row = self.lock["components"]["checkout"]
        build = {"nfObjectId": row["build_service"], "buildId": row["build_id"],
                 "repository": row["repository"], "buildSHA": row["commit"],
                 "deployedSHA": row["commit"]}
        deployment = {"instances": 1, "internal": build}
        logs = [{"log": f"pushing manifest for registry/demo@{row['digest']}"}]
        compare("checkout", row, deployment, logs)
        for invalid in ([], [{"log": f"pulling cache {row['digest']}"}],
                        [*logs, {"log": "pushing manifest for registry/demo@sha256:" + "1" * 64}]):
            with self.assertRaisesRegex(ValueError, "manifest"):
                compare("checkout", row, deployment, invalid)
        build["buildSHA"] = "latest"
        with self.assertRaisesRegex(ValueError, "buildSHA"):
            compare("checkout", row, deployment, logs)
        build["buildSHA"] = row["commit"]
        build["buildId"] = "other-build"
        with self.assertRaisesRegex(ValueError, "buildId"):
            compare("checkout", row, deployment, logs)

    def test_import_id_must_match_even_with_same_source_tag(self):
        row = self.lock["components"]["automation"]
        deployment = {"instances": 1, "importedImage": {"imageId": row["import_id"]},
                      "image": {"tag": f"sha-{row['commit']}"}}
        compare("automation", row, deployment)
        deployment["importedImage"]["imageId"] = "other-import"
        with self.assertRaisesRegex(ValueError, "import"):
            compare("automation", row, deployment)

    def test_live_instances_require_current_replicas_and_configured_probes(self):
        running = {"status": "TASK_RUNNING", "probes": [
            {"kind": "readiness", "state": "success"},
            {"kind": "liveness", "state": "success"},
        ]}
        checks = [{"type": "readinessProbe"}, {"type": "livenessProbe"}]
        current = {"containers": [running, running], "hasMore": False}
        verify_instances("checkout", 2, checks, {"current": current})
        verify_instances("app-worker", 1, [], {"current": {
            "containers": [{"status": "TASK_RUNNING", "probes": []}], "hasMore": False,
        }})
        for changes, error in (
            ({"hasMore": True}, "incomplete"),
            ({"containers": [running]}, "expected 2 running"),
            ({"containers": [running, {"status": "TASK_CRASHLOOP"}]}, "expected 2 running"),
            ({"containers": [running, {**running, "probes": []}]}, "readiness"),
            ({"containers": [running, {**running, "probes": [
                {"kind": "readiness", "state": "success"},
                {"kind": "liveness", "state": "failure"},
            ]}]}, "liveness"),
        ):
            with self.subTest(error=error), self.assertRaisesRegex(ValueError, error):
                verify_instances("checkout", 2, checks, {"current": {**current, **changes}})


    def test_pinned_source_checks_actual_git_objects_and_migration_boundary(self):
        with tempfile.TemporaryDirectory() as directory:
            def git(*arguments):
                return subprocess.check_output(["git", "-C", directory, *arguments],
                                               stderr=subprocess.DEVNULL, text=True).strip()
            git("init", "--quiet")
            migration = Path(directory) / "migrations" / "001.sql"
            migration.parent.mkdir()
            migration.write_text("SELECT 1;\n")
            git("add", "migrations")
            git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.test",
                "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", "Fixture")
            row = {"commit": git("rev-parse", "HEAD"),
                   "schema": {"inputs": {"migrations": git("rev-parse", "HEAD:migrations")},
                              "through": "001.sql"}}
            verify_source(row, directory)
            row["schema"]["inputs"]["migrations"] = "1" * 40
            with self.assertRaisesRegex(ValueError, "differs"):
                verify_source(row, directory)
            row["schema"]["inputs"]["migrations"] = git("rev-parse", "HEAD:migrations")
            row["schema"]["through"] = "002.sql"
            with self.assertRaisesRegex(ValueError, "missing"):
                verify_source(row, directory)
            row["commit"] = "2" * 40
            with self.assertRaisesRegex(ValueError, "missing"):
                verify_source(row, directory)

    def test_unknown_or_malformed_source_selection_is_rejected(self):
        for selection in ("missing=repo", "checkout", "checkout="):
            with self.assertRaisesRegex(ValueError, "COMPONENT=CHECKOUT"):
                verify_sources(self.lock, [selection])

    def test_shared_schema_checks_exact_pinned_migration_histories(self):
        with tempfile.TemporaryDirectory() as directory:
            def git(*arguments):
                return subprocess.check_output(["git", "-C", directory, *arguments],
                                               stderr=subprocess.DEVNULL, text=True).strip()

            def snapshot(through):
                git("add", "-A")
                git("-c", "user.name=Fixture", "-c", "user.email=fixture@example.test",
                    "-c", "commit.gpgsign=false", "commit", "--quiet", "-m", through)
                return {"commit": git("rev-parse", "HEAD"),
                        "schema": {"inputs": {"migrations": git("rev-parse", "HEAD:migrations")},
                                   "through": through}}

            git("init", "--quiet")
            folder = Path(directory) / "migrations"
            folder.mkdir()
            first = folder / "001.sql"
            first.write_text("SELECT 1;\n")
            worker = snapshot("001.sql")
            (folder / "003.sql").write_text("SELECT 3;\n")
            core = snapshot("003.sql")
            lock = {"components": {"core": core, "app-worker": worker}}
            verify_shared_schema(lock, directory)
            with self.assertRaisesRegex(ValueError, "unchanged prefix"):
                verify_shared_schema({"components": {"core": worker, "app-worker": core}}, directory)
            wrong_boundary = copy.deepcopy(lock)
            wrong_boundary["components"]["core"]["schema"]["through"] = "001.sql"
            with self.assertRaisesRegex(ValueError, "last source migration"):
                verify_shared_schema(wrong_boundary, directory)
            first.write_text("SELECT 4;\n")
            lock["components"]["core"] = snapshot("003.sql")
            with self.assertRaisesRegex(ValueError, "unchanged prefix"):
                verify_shared_schema(lock, directory)

    def candidate_inputs(self):
        current = self.lock["components"]["core"]
        commit = "7" * 40
        build = {"id": "candidate-build", "status": "SUCCESS", "sha": commit}
        builder = {"id": current["build_service"], "buildSource": "git",
                   "vcsData": {"projectUrl": current["repository"]}}
        logs = [{"log": "pushing manifest for registry/demo@sha256:" + "8" * 64}]
        return build, builder, logs, commit

    def test_candidate_changes_only_core_artifact_after_source_validation(self):
        build, builder, logs, commit = self.candidate_inputs()
        original = copy.deepcopy(self.lock)
        with patch("composition_release.verify_source") as source:
            candidate = core_candidate(self.lock, build, builder, logs, commit, "fixture")
            source.assert_called_once_with(candidate["components"]["core"], "fixture")
        self.assertEqual(self.lock, original)
        for name, row in original["components"].items():
            if name != "core":
                self.assertEqual(candidate["components"][name], row)
        self.assertEqual(candidate["contracts"], original["contracts"])
        self.assertEqual(candidate["components"]["core"]["schema"],
                         original["components"]["core"]["schema"])
        self.assertEqual(candidate["components"]["core"]["commit"], commit)
        self.assertEqual(candidate["components"]["core"]["digest"], "sha256:" + "8" * 64)

    def test_candidate_rejects_wrong_build_owner_source_schema_and_manifest(self):
        build, builder, logs, commit = self.candidate_inputs()
        for field, value in (("status", "BUILDING"), ("sha", "6" * 40)):
            altered = {**build, field: value}
            with self.assertRaisesRegex(ValueError, "requested commit"):
                core_candidate(self.lock, altered, builder, logs, commit, "fixture")
        foreign = {**builder, "vcsData": {"projectUrl": "https://example.test/foreign"}}
        with self.assertRaisesRegex(ValueError, "source owner"):
            core_candidate(self.lock, build, foreign, logs, commit, "fixture")
        with self.assertRaisesRegex(ValueError, "manifest"):
            core_candidate(self.lock, build, builder, [], commit, "fixture")
        with patch("composition_release.verify_source", side_effect=ValueError("schema changed")):
            with self.assertRaisesRegex(ValueError, "schema changed"):
                core_candidate(self.lock, build, builder, logs, commit, "fixture")

    def test_candidate_file_is_exclusive_and_baseline_drift_prevents_output(self):
        build, builder, logs, commit = self.candidate_inputs()
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "candidate.json"
            args = SimpleNamespace(northflank="fixture-cli", project="fixture", commit=commit,
                                   prepare_core=build["id"], output=output, source=["core=fixture"])
            with patch("composition_release.verify_hosted", side_effect=ValueError("live drift")):
                with self.assertRaisesRegex(ValueError, "live drift"):
                    prepare_core(self.lock, args)
            self.assertFalse(output.exists())
            for exists in (False, True):
                with patch("composition_release.verify_hosted"), \
                        patch("composition_release.verify_source"), \
                        patch("composition_release.request", side_effect=[builder, build, logs]):
                    if exists:
                        before = output.read_bytes()
                        with self.assertRaises(FileExistsError):
                            prepare_core(self.lock, args)
                        self.assertEqual(output.read_bytes(), before)
                    else:
                        prepare_core(self.lock, args)
                        self.assertEqual(json.loads(output.read_text())["components"]["core"]["commit"],
                                         commit)

    def test_each_build_backed_component_preserves_every_other_owner_and_contract(self):
        for name, current in self.lock["components"].items():
            if name == "automation":
                continue
            with self.subTest(component=name):
                build = {"id": "isolated-build", "status": "SUCCESS", "sha": "7" * 40}
                builder = {"id": current["build_service"], "buildSource": "git",
                           "vcsData": {"projectUrl": current["repository"]}}
                logs = [{"log": "pushing manifest for registry/test@sha256:" + "8" * 64}]
                before = copy.deepcopy(self.lock)
                with patch("composition_release.verify_source") as source:
                    candidate = component_candidate(self.lock, name, build, builder, logs,
                                                    build["sha"], "source")
                    source.assert_called_once_with(candidate["components"][name], "source")
                self.assertEqual(before, self.lock)
                self.assertEqual(candidate["contracts"], self.lock["contracts"])
                self.assertEqual(candidate["components"][name]["schema"], current["schema"])
                for peer in self.lock["components"]:
                    if peer != name:
                        self.assertEqual(candidate["components"][peer], self.lock["components"][peer])

    def test_component_preparation_rejects_imports_foreign_builders_and_missing_source(self):
        build, builder, logs, commit = self.candidate_inputs()
        for name in ("automation", "unknown"):
            with self.assertRaisesRegex(ValueError, "build-backed"):
                component_candidate(self.lock, name, build, builder, logs, commit, "fixture")
        with self.assertRaisesRegex(ValueError, "source owner"):
            component_candidate(self.lock, "experience", build, builder, logs, commit, "fixture")
        args = SimpleNamespace(northflank="fixture", commit=commit, output="unused", source=["core=fixture"])
        with self.assertRaisesRegex(ValueError, "experience=CHECKOUT"):
            prepare_component(self.lock, args, "experience", "candidate")

    def test_component_candidate_is_written_only_after_all_baseline_peers_match(self):
        row = self.lock["components"]["experience"]
        build = {"id": "experience-candidate", "status": "SUCCESS", "sha": "7" * 40}
        builder = {"id": row["build_service"], "buildSource": "git",
                   "vcsData": {"projectUrl": row["repository"]}}
        logs = [{"log": "pushing manifest for registry/test@sha256:" + "8" * 64}]
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "candidate.json"
            args = SimpleNamespace(northflank="fixture", project="fixture", commit=build["sha"],
                                   output=output, source=["experience=fixture"])
            with patch("composition_release.verify_hosted", side_effect=ValueError("peer drift")):
                with self.assertRaisesRegex(ValueError, "peer drift"):
                    prepare_component(self.lock, args, "experience", build["id"])
            self.assertFalse(output.exists())
            with patch("composition_release.verify_hosted"), patch("composition_release.verify_source"), \
                    patch("composition_release.request", side_effect=[builder, build, logs]):
                prepare_component(self.lock, args, "experience", build["id"])
            self.assertEqual(json.loads(output.read_text())["components"]["experience"]["commit"], build["sha"])


if __name__ == "__main__":
    unittest.main()
