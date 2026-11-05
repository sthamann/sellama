"""Mutation checks for the exact upstream component snapshot consumed by the Veyndo composition."""
import contextlib
import copy
import io
import json
from pathlib import Path
import tempfile
import sys
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from component_sources import OWNERS, digest, safe_path, verify

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
    for value in ['../src/main.rs','/tmp/file','a/../b','a\\b','.git/config','a//b']:
        try: safe_path(value)
        except AssertionError: continue
        raise AssertionError('Invalid source path accepted: ' + value)
print('PASS component snapshot: content, missing/extra files, links, wrong repository/commit/owner and traversal rejection')
