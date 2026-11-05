#!/usr/bin/env python3
"""Verify pinned component source snapshots; explicit imports use clean, reviewed Git commits, never mutable branches."""
import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
import re
import subprocess

ROOT = Path(__file__).resolve().parents[1]
LOCK = ROOT / 'components.lock.json'
# A component may write only its declared app package, never Core or another app.
OWNERS = {'marketplaces': 'extensions/apps/marketplaces'}
IGNORED = {'__pycache__', 'node_modules', 'target'}


def digest(data):
    return hashlib.sha256(data).hexdigest()


def safe_path(name):
    p = PurePosixPath(name)
    assert not p.is_absolute() and p.parts and all(x not in ('.', '..', '.git') for x in p.parts), name
    assert str(p) == name and '\\' not in name, name
    return p


def verify(root=ROOT):
    lock = json.loads((root / 'components.lock.json').read_text())
    assert lock['version'] == 1
    assert set(lock['components']) == set(OWNERS), 'Unclassified component'
    for name, row in lock['components'].items():
        assert row['repository'] == 'https://github.com/veyndo/' + name, 'Wrong source repository'
        assert re.fullmatch('[0-9a-f]{40}', row['commit']), 'Exact commit required'
        assert row['path'] == OWNERS[name], 'Component escaped its owner'
        folder = root / row['path']
        actual = {}
        for file in folder.rglob('*'):
            assert not file.is_symlink(), 'Component snapshot contains a symlink'
            relative = file.relative_to(folder)
            if file.is_file() and not set(relative.parts) & IGNORED:
                actual[relative.as_posix()] = digest(file.read_bytes())
        for file in row['files']:
            safe_path(file)
        assert actual == row['files'], f'{name}: source snapshot differs from its reviewed commit; import upstream changes explicitly'
    print('PASS exact component commits, owner paths, file sets and SHA-256 contents')


def import_source(name, checkout, commit):
    assert name in OWNERS and re.fullmatch('[0-9a-f]{40}', commit)
    checkout = checkout.resolve()
    run = lambda *args: subprocess.check_output(['git', '-C', str(checkout), *args])
    assert not run('status', '--porcelain'), 'Source checkout must be clean'
    assert run('remote', 'get-url', 'origin').decode().strip().removesuffix('.git') == 'https://github.com/veyndo/' + name
    assert run('rev-parse', 'HEAD').decode().strip() == commit, 'Checkout must match reviewed commit'
    tree = run('ls-tree', '-rz', '--full-tree', commit).split(b'\0')
    files = {}
    for entry in filter(None, tree):
        metadata, raw_path = entry.split(b'\t', 1)
        mode, kind, oid = metadata.split()
        assert mode in (b'100644', b'100755') and kind == b'blob', 'Only regular source files are supported'
        path = raw_path.decode()
        safe_path(path)
        assert not set(PurePosixPath(path).parts) & IGNORED, 'Build artifacts must not be imported'
        files[path] = run('cat-file', 'blob', oid.decode())
    lock = json.loads(LOCK.read_text()) if LOCK.exists() else {'version': 1, 'components': {}}
    folder = ROOT / OWNERS[name]
    assert not folder.is_symlink()
    # Remove only prior regular snapshot files, preserving no hidden source forks.
    for file in folder.rglob('*'):
        assert not file.is_symlink(), 'Refusing to replace a linked component'
        if file.is_file() and not set(file.relative_to(folder).parts) & IGNORED:
            file.unlink()
    for path, data in files.items():
        file = folder / path
        file.parent.mkdir(parents=True, exist_ok=True)
        file.write_bytes(data)
    lock['components'][name] = {'repository': 'https://github.com/veyndo/' + name,
                               'commit': commit, 'path': OWNERS[name],
                               'files': {path: digest(data) for path, data in sorted(files.items())}}
    LOCK.write_text(json.dumps(lock, indent=2) + '\n')
    verify()


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--import-source', choices=OWNERS)
    parser.add_argument('--checkout', type=Path)
    parser.add_argument('--commit')
    args = parser.parse_args()
    if args.import_source:
        assert args.checkout and args.commit, 'Explicit source checkout and commit required'
        import_source(args.import_source, args.checkout, args.commit)
    else:
        verify()
