#!/usr/bin/env python3
"""Refresh the portfolio demos from the two independent Circle Multiplication repos.

Run from any directory: python3 scripts/sync_circle_multiplication.py
The curated project card, process text and screenshots live separately.
"""

from pathlib import Path
import shutil


SITE_ROOT = Path(__file__).resolve().parent.parent


def sync():
    target = SITE_ROOT / 'circle-multiplication'
    sources = (
        (SITE_ROOT.parent / 'p5-circle-multiplication', target),
        (SITE_ROOT.parent / 'p5-circle-multiplication-interactive', target / 'interactive'),
    )
    files = ('index.html', 'style.css', 'sketch.js')
    vendor = sources[0][0] / 'vendor'
    vendor_files = ('p5.min.js', 'p5.LICENSE.txt')
    for source, _ in sources:
        for name in files:
            if not (source / name).is_file():
                raise FileNotFoundError(source / name)
    for name in vendor_files:
        if not (vendor / name).is_file():
            raise FileNotFoundError(vendor / name)
    for source, destination in sources:
        destination.mkdir(parents=True, exist_ok=True)
        for name in files:
            shutil.copy2(source / name, destination / name)
    (target / 'vendor').mkdir(exist_ok=True)
    for name in vendor_files:
        shutil.copy2(vendor / name, target / 'vendor' / name)
    entry = target / 'interactive' / 'index.html'
    entry.write_text(entry.read_text(encoding='utf-8').replace(
        'src="vendor/p5.min.js"', 'src="../vendor/p5.min.js"'
    ), encoding='utf-8')
    print('Synced both Circle Multiplication demos and their shared p5.js dependency.')


if __name__ == '__main__':
    sync()
