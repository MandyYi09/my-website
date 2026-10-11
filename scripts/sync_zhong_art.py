#!/usr/bin/env python3
"""Import the built public Zhong Art website into the portfolio."""

import argparse
from pathlib import Path
import re
import shutil


SITE_ROOT = Path(__file__).resolve().parent.parent


def sync(source):
    entry = (source / 'index.html').read_text(encoding='utf-8')
    scripts = re.findall(r'src="/zhong-art/(assets/[^\"]+\.js)"', entry)
    if len(scripts) != 1:
        raise ValueError('Expected one Zhong Art application entry script')
    bundle_path = source / scripts[0]
    bundle = bundle_path.read_text(encoding='utf-8')
    asset_base = 'return`/zhong-art/${'
    router_base = 'basepath:`/zhong-art/`'
    if bundle.count(asset_base) != 1 or bundle.count(router_base) != 1:
        raise ValueError('Unexpected Zhong Art asset or router base; review before syncing')
    # Resolve both routes and artwork against the copied module, including on Pages.
    bundle = 'const portfolioZhongBase = new URL("../", import.meta.url).pathname;\n' + bundle
    bundle = bundle.replace(asset_base, 'return`${portfolioZhongBase}${')
    bundle = bundle.replace(router_base, 'basepath:portfolioZhongBase')
    entry = entry.replace('src="/zhong-art/', 'src="./')
    entry = entry.replace('href="/zhong-art/', 'href="./')
    target = SITE_ROOT / 'zhong-art-project'
    target.mkdir(exist_ok=True)
    for name in ('assets', 'artwork', 'paintings'):
        shutil.copytree(source / name, target / name, dirs_exist_ok=True)
    (target / 'index.html').write_text(entry, encoding='utf-8')
    (target / scripts[0]).write_text(bundle, encoding='utf-8')
    print('Synced the complete Zhong Art public app, artwork, and paintings')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('build', type=Path, help='Path to the latest Zhong Art pages-dist directory')
    sync(parser.parse_args().build.resolve())
