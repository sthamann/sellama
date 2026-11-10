"""Enforce reviewed Cargo owners and dependency capabilities, including aliases and unnamed helper crates."""
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
OWNERS = {name: ROOT / 'crates' / name.removeprefix('veyndo-') for name in (
    'veyndo-kernel', 'veyndo-flow-graph', 'veyndo-runtime', 'veyndo-commerce', 'veyndo-apps', 'veyndo-cognition',
    'veyndo-automation')}
OWNERS.update({'veyndo': ROOT, 'veyndo-migration': ROOT / 'extensions/apps/migration',
               'veyndo-marketplaces': ROOT / 'extensions/apps/marketplaces',
               'veyndo-app-storage': ROOT / 'extensions/services/app-storage',
               'veyndo-app-model': ROOT / 'extensions/services/app-storage/model',
               'veyndo-app-runtime': ROOT / 'extensions/services/app-storage/runtime',
               'veyndo-app-authority': ROOT / 'extensions/services/app-storage/authority'})
ALLOWED = {
    'veyndo-app-model': set(),
    'veyndo-app-runtime': {'veyndo-app-model'},
    'veyndo-app-storage': {'veyndo-app-model'},
    'veyndo-marketplaces': set(),
    'veyndo-kernel': set(),
    'veyndo-flow-graph': set(),
    'veyndo-automation': {'veyndo-kernel'},
    'veyndo-runtime': {'veyndo-app-authority'},
    'veyndo-app-authority': set(),
    'veyndo-commerce': {'veyndo-kernel'},
    'veyndo-apps': {'veyndo-kernel', 'veyndo-app-runtime'},
    'veyndo-cognition': {'veyndo-runtime', 'veyndo-kernel', 'veyndo-app-authority'},
}
# Reviewed direct external capabilities. Cargo reports actual package names even
# when a manifest renames sqlx as something innocuous. New dependencies need an
# explicit architecture decision, including build/dev/optional/target variants.
EXTERNAL = {
    'veyndo-app-model': {'serde', 'serde_json', 'chrono', 'cron', 'sha2', 'semver', 'url'},
    'veyndo-app-runtime': {'wasmtime', 'wat', 'sha2', 'serde_json'},
    'veyndo-app-storage': {'sqlx', 'serde_json', 'sha2', 'tokio', 'chrono', 'base64', 'ring', 'zeroize'},
    'veyndo-app-authority': {'zeroize', 'hmac', 'sha2', 'uuid', 'sqlx', 'reqwest', 'serde', 'serde_json', 'aes-gcm', 'base64'},
    'veyndo-marketplaces': {'axum', 'tokio', 'serde', 'serde_json', 'sha2', 'hmac', 'ring', 'chrono', 'reqwest'},
    'veyndo-kernel': set(),
    'veyndo-flow-graph': set(),
    'veyndo-automation': {'serde_json', 'chrono', 'chrono-tz'},
    'veyndo-commerce': {'serde', 'serde_json'},
    'veyndo-apps': set(),
    'veyndo-runtime': {'hmac', 'sha2', 'zeroize', 'sqlx', 'tokio', 'futures-util',
                       'serde_json', 'reqwest', 'async-stream', 'uuid'},
    'veyndo-cognition': {'serde', 'serde_json', 'tokio', 'reqwest', 'aes-gcm',
                         'base64', 'sha2', 'sqlx', 'tracing'},
}


def check(packages):
    names = {p['name'] for p in packages}
    assert names == set(OWNERS), ('Unclassified or missing workspace owner', names ^ set(OWNERS))
    for package in packages:
        name = package['name']
        owner = OWNERS[name].resolve()
        assert Path(package['manifest_path']).resolve() == owner / 'Cargo.toml', (name, 'Wrong owner directory')
        for target in package['targets']:
            assert Path(target['src_path']).resolve().is_relative_to(owner), (name, 'Target escapes its owner')
        if name not in ALLOWED:
            continue
        allowed = ALLOWED[name] | EXTERNAL[name]
        for dependency in package['dependencies']:
            dep = dependency['name']
            assert dep in allowed, (name, 'Unreviewed dependency capability', dep)
            if dep == 'veyndo-app-authority':
                if name == 'veyndo-cognition':
                    assert not dependency.get('uses_default_features', True) and set(dependency.get('features', [])) == {'vault'}, 'Cognition imports vault only, without database/OAuth features'
                elif name == 'veyndo-runtime':
                    assert not set(dependency.get('features', [])) - {'database'}, 'Runtime imports the existing signed database protocol only'
            if dependency.get('path'):
                assert dep in ALLOWED[name] and Path(dependency['path']).resolve() == OWNERS[dep].resolve(), (name, 'Path dependency escapes its owner', dep)
            elif dep in ALLOWED[name]:
                raise AssertionError((name, 'Domain dependency must use its reviewed local owner', dep))
        assert not any('custom-build' in t['kind'] for t in package['targets']), (name, 'Unreviewed domain build script')


def main():
    data = json.loads(subprocess.check_output(
        ['cargo', 'metadata', '--locked', '--no-deps', '--format-version', '1'], cwd=ROOT))
    check(data['packages'])
    from workspace_boundary_tests import negative_controls
    count = negative_controls(data['packages'])
    print(f'PASS Cargo owner/dependency boundaries; {count} bypass negative controls')


if __name__ == '__main__':
    main()
