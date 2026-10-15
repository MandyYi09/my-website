#!/usr/bin/env python3
"""Build the project data used when projects.html is opened directly from disk."""

import json
from pathlib import Path


SITE_ROOT = Path(__file__).resolve().parent.parent


def build_catalog():
    collections = [
        json.loads((SITE_ROOT / 'data' / name).read_text(encoding='utf-8'))
        for name in ('git-projects.json', 'study-projects.json', 'curated-projects.json')
    ]
    if any(not isinstance(collection, list) for collection in collections):
        raise ValueError('Project collections must be JSON arrays')
    output = (
        '// Generated from git-projects.json, study-projects.json, and curated-projects.json.\n'
        '// Regenerate with: python3 scripts/build_project_catalog.py\n'
        'window.portfolioProjectCatalog = '
        + json.dumps(collections, ensure_ascii=True, separators=(',', ':'))
        + ';\n'
    )
    (SITE_ROOT / 'data' / 'project-catalog.js').write_text(output, encoding='utf-8')


if __name__ == '__main__':
    build_catalog()
