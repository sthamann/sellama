"""Check real Rust include! inputs against the production image's explicit build COPY set."""
from pathlib import Path
import re
import sys
import tomllib

ROOT = Path(__file__).resolve().parents[2]


def build_inputs(dockerfile, context=ROOT):
    copying = False
    inputs = []
    for line in dockerfile.splitlines():
        if line.startswith('FROM '):
            copying = line.split()[1].startswith('rust:')
        elif copying and line.startswith('COPY '):
            inputs.extend(context / value for value in line.split()[1:-1])
    return inputs


def copied(target, inputs):
    return any(target == p.resolve() or (p.is_dir() and target.is_relative_to(p.resolve())) for p in inputs)


def missing_workspace(dockerfile):
    inputs = build_inputs(dockerfile)
    manifest = tomllib.loads((ROOT / 'Cargo.toml').read_text())
    required = [ROOT / 'Cargo.toml', ROOT / 'Cargo.lock', ROOT / 'LICENSE']
    for pattern in manifest.get('workspace', {}).get('members', []):
        if pattern == '.':
            continue
        for member in ROOT.glob(pattern):
            if member == ROOT or not member.is_dir():
                continue
            required.extend([member / 'Cargo.toml', *member.rglob('*.rs')])
    return [str(p.relative_to(ROOT)) for p in required if not copied(p.resolve(), inputs)]


def missing_package(dockerfile, context, entry, assets=()):
    """Follow the independent binary's local Cargo dependencies inside its build context."""
    inputs = build_inputs(dockerfile, context)
    required = {context / 'LICENSE', entry.with_name('Cargo.lock'), *assets}
    pending = [entry]
    seen = set()
    while pending:
        manifest_path = pending.pop().resolve()
        if manifest_path in seen:
            continue
        assert manifest_path.is_relative_to(context), 'Local package escaped the independent context'
        seen.add(manifest_path)
        manifest = tomllib.loads(manifest_path.read_text())
        package = manifest_path.parent
        required.add(manifest_path)
        targets = [
            value['path']
            for value in [manifest.get('lib', {}), *manifest.get('bin', [])]
            if 'path' in value
        ]
        roots = {(package / target).parent for target in targets}
        if not roots or (package / 'src').is_dir():
            roots.add(package / 'src')
        required.update(package / target for target in targets)
        for root in roots:
            assert root.is_dir() and root.resolve().is_relative_to(context), 'Independent source root escaped its context'
            required.update(root.rglob('*.rs'))
        for configuration in (manifest, *manifest.get('target', {}).values()):
            for section in ('dependencies', 'build-dependencies', 'dev-dependencies'):
                for dependency in configuration.get(section, {}).values():
                    if isinstance(dependency, dict) and 'path' in dependency:
                        pending.append(package / dependency['path'] / 'Cargo.toml')
        build = manifest.get('package', {}).get('build', 'build.rs')
        if isinstance(build, str) and (package / build).is_file():
            required.add(package / build)
    for source in tuple(required):
        if source.suffix != '.rs':
            continue
        for value in re.findall(r'include_(?:str|bytes)!\s*\(\s*"([^"\n]+)"', source.read_text()):
            target = (source.parent / value).resolve()
            assert target.is_relative_to(context), 'Embedded input escaped the independent context'
            # The service images build the binary, while these fixtures are used by cfg(test).
            if 'tests' not in target.relative_to(context).parts:
                required.add(target)
    return sorted(str(p.relative_to(ROOT)) for p in required if not p.exists() or not copied(p.resolve(), inputs))


def missing_inputs(dockerfile):
    inputs = build_inputs(dockerfile)
    missing = []
    for source in [*(ROOT / 'src').rglob('*.rs'), *(ROOT / 'crates').rglob('*.rs'), *(ROOT / 'extensions').rglob('*.rs')]:
        for value in re.findall(r'include_(?:str|bytes)!\s*\(\s*"([^"\n]+)"', source.read_text()):
            target = (source.parent / value).resolve()
            if not target.is_file() or not copied(target, inputs):
                missing.append(str(target.relative_to(ROOT)))
    return sorted(set(missing))


def main():
    dockerfile = (ROOT / 'deploy/Dockerfile').read_text()
    missing = missing_inputs(dockerfile)
    if missing:
        raise SystemExit('Production Rust image is missing compile-time inputs:\n' + '\n'.join(missing))
    # Reproduce the public build failure: source-checkout tests alone could not find it.
    broken = dockerfile.replace('COPY reference/app-manifests/ reference/app-manifests/\n', '')
    lost = missing_inputs(broken)
    assert lost and all(p.startswith('reference/app-manifests/') for p in lost), lost
    missing_apps = missing_inputs(dockerfile.replace('COPY extensions/ extensions/\n', ''))
    assert missing_apps and any(p.startswith('extensions/apps/') for p in missing_apps), missing_apps
    images = [ROOT / 'deploy/Dockerfile', *ROOT.glob('extensions/**/Dockerfile')]
    apps = ROOT / 'extensions/services/app-storage'
    marketplaces = ROOT / 'extensions/apps/marketplaces'
    standalone = {
        marketplaces / 'Dockerfile': (marketplaces, marketplaces / 'Cargo.toml', (marketplaces / 'manifest.json',), 'COPY service '),
        apps / 'service/Dockerfile': (apps, apps / 'service/Cargo.toml', (apps / 'runtime/wit',), 'COPY authority/src/ '),
        apps / 'data-service/Dockerfile': (apps, apps / 'data-service/Cargo.toml', (), 'COPY model/src/ '),
    }
    count = 0
    for image in images:
        text = image.read_text()
        if not build_inputs(text):
            continue
        if image in standalone:
            context, entry, assets, dependency_copy = standalone[image]
            missing = missing_package(text, context, entry, assets)
            broken = '\n'.join(line for line in text.splitlines() if not line.startswith(dependency_copy))
            assert missing_package(broken, context, entry, assets), ('Missing independent source COPY not detected', image)
            broken = re.sub(r'(?<!\S)(?:[\w-]+/)?Cargo\.lock(?=\s)', '', text)
            assert missing_package(broken, context, entry, assets), ('Missing independent lock COPY not detected', image)
            for asset in assets:
                relative = asset.relative_to(context).as_posix()
                broken = re.sub(rf'(?<!\S){re.escape(relative)}/?(?=\s)', '', text)
                assert str(asset.relative_to(ROOT)) in missing_package(broken, context, entry, assets), ('Missing independent asset COPY not detected', image, asset)
        else:
            missing = missing_workspace(text)
            broken = '\n'.join(line for line in text.splitlines() if not line.startswith('COPY crates'))
            assert missing_workspace(broken), ('Missing workspace COPY not detected', image)
        assert not missing, (str(image.relative_to(ROOT)), missing)
        count += 1
    print(f'PASS {count} Rust image contexts include their own workspace/package closure; missing-source/lock negative controls')
    print(f'PASS production Rust image inputs; historical manifests and app package resources required ({len(lost)} legacy files)')


if __name__ == '__main__':
    main()
