"""Mutation checks for the exact upstream component snapshot consumed by the Veyndo composition."""
import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import sys
import subprocess
import os
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from component_sources import OWNERS, digest, safe_path, verify
import component_sources

with tempfile.TemporaryDirectory() as directory:
    root = Path(directory)
    package = root / 'extensions/apps/marketplaces'
    package.mkdir(parents=True)
    source = package / 'Cargo.toml'
    source.write_text('original')
    lock = {'version': 1, 'components': {'marketplaces': {
        'repository': 'https://github.com/veyndo/marketplaces', 'commit': 'a'*40,
        'path': 'extensions/apps/marketplaces', 'files': {'Cargo.toml': digest(b'original')}}}}
    for name, folder in OWNERS.items():
        if name == 'marketplaces': continue
        destination = root / folder
        destination.mkdir(parents=True)
        (destination/'Cargo.toml').write_text('original')
        lock['components'][name] = {'repository':'https://github.com/veyndo/'+name, 'commit':'b'*40,
                                    'path':folder, 'files':{'Cargo.toml':digest(b'original')}}
    runtime_wit = root / OWNERS['apps'] / 'runtime/wit/commerce.wit'
    sdk_wit = root / 'extensions/sdk/wit/commerce.wit'
    for file in (runtime_wit, sdk_wit):
        file.parent.mkdir(parents=True, exist_ok=True);file.write_text('package fixture:commerce;')
    lock['components']['apps']['files']['runtime/wit/commerce.wit'] = digest(runtime_wit.read_bytes())
    native_scope = root / 'migrations/099-authenticated-database-scope.sql'
    native_scope.parent.mkdir(parents=True)
    native_scope.write_text('SELECT 1;\n\n-- Keep all existing per-table/actor checks;\n')
    app_scope = root / OWNERS['apps'] / 'authority/sql/signed_scope.sql'
    app_scope.parent.mkdir(parents=True)
    app_scope.write_text('-- provenance\nSELECT 1;\n')
    lock['components']['apps']['files']['authority/sql/signed_scope.sql'] = digest(app_scope.read_bytes())
    def save(value): (root / 'components.lock.json').write_text(json.dumps(value))
    def check():
        with contextlib.redirect_stdout(io.StringIO()): verify(root)
    def denied():
        try: check()
        except AssertionError: return
        raise AssertionError('Invalid source snapshot accepted')
    save(lock);check()
    source.write_text('changed');denied();source.write_text('original')
    source.unlink();denied();source.write_text('original')
    extra = package / 'extra.rs';extra.write_text('extra');denied();extra.unlink()
    extra.symlink_to(source);denied();extra.unlink()
    for key, value in [('path','src'),('repository','https://example.test/other'),('commit','main')]:
        altered = copy.deepcopy(lock);altered['components']['marketplaces'][key] = value;save(altered);denied()
    save(lock);check()
    sdk_wit.write_text('changed');denied();sdk_wit.unlink();denied()
    sdk_wit.symlink_to(runtime_wit);denied();sdk_wit.unlink()
    sdk_wit.write_bytes(runtime_wit.read_bytes());check()
    app_scope.write_text('-- provenance\nSELECT 2;\n')
    altered = copy.deepcopy(lock)
    altered['components']['apps']['files']['authority/sql/signed_scope.sql'] = digest(app_scope.read_bytes())
    save(altered);denied()
    app_scope.write_text('-- provenance\nSELECT 1;\n');save(lock);check()
    # Real clean Git import: unchanged source mtimes survive, changed bytes update,
    # removed files disappear, and the exact content/source guard still runs.
    with tempfile.TemporaryDirectory() as checkout:
        upstream = Path(checkout)
        app_root = root / OWNERS['apps']
        for file in app_root.rglob('*'):
            if file.is_file():
                target = upstream / file.relative_to(app_root)
                target.parent.mkdir(parents=True, exist_ok=True)
                target.write_bytes(file.read_bytes())
        (upstream / 'Cargo.toml').write_text('updated')
        def git(*args):
            return subprocess.check_output(['git','-C',str(upstream),*args],stderr=subprocess.DEVNULL).decode().strip()
        git('init');git('remote','add','origin','https://github.com/veyndo/apps.git')
        git('add','.')
        git('-c','user.name=Fixture','-c','user.email=fixture@example.test','commit','-m','Synthetic component')
        os.utime(runtime_wit,ns=(1000000000,1000000000))
        before = runtime_wit.stat().st_mtime_ns
        stale = app_root / 'removed.rs';stale.write_text('removed')
        old_root,old_lock=component_sources.ROOT,component_sources.LOCK
        try:
            component_sources.ROOT=root;component_sources.LOCK=root/'components.lock.json'
            with contextlib.redirect_stdout(io.StringIO()):
                component_sources.import_source('apps',upstream,git('rev-parse','HEAD'))
        finally:
            component_sources.ROOT=old_root;component_sources.LOCK=old_lock
        assert runtime_wit.stat().st_mtime_ns==before,'Unchanged component source rewritten'
        assert (app_root/'Cargo.toml').read_text()=='updated'
        assert not stale.exists()
    for value in ['../src/main.rs','/tmp/file','a/../b','a\\b','.git/config','a//b']:
        try: safe_path(value)
        except AssertionError: continue
        raise AssertionError('Invalid source path accepted: ' + value)
print('PASS component snapshot: content, missing/extra files, links, wrong repository/commit/owner and traversal rejection')
