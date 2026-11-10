"""Reject drift and incomplete evidence in the hosted composition preflight."""

import copy
import json
import subprocess
import sys
import tempfile
import unittest

from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from composition_release import LOCK, compare, unique_keys, validate, verify_source, verify_sources


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


if __name__ == "__main__":
    unittest.main()
