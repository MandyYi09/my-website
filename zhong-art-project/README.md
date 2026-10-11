# Full Zhong Art public project

Synced from the latest local Zhong Art `pages-dist` build on 2026-10-11.
This version opens in English and retains the Chinese language switch.
The complete public app includes Home, Daily Draw, Atlas, My Path, and Compose.

To update it after building Zhong Art:

```sh
python3 scripts/sync_zhong_art.py /path/to/zhong-art/pages-dist
```

The sync script copies the public build and resolves its asset and router base
from the local module URL, so it works both in local previews and under a
portfolio hosting subdirectory. The carousel's animated scene remains in
`zhong-art-preview/`.
