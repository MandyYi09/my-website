#!/usr/bin/env python3
"""Open the portfolio through a local HTTP server for reliable previews."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import URLError
from urllib.request import urlopen
import sys
import webbrowser


SITE_ROOT = Path(__file__).resolve().parent.parent
PUBLIC_URL = "https://mandyyi09.github.io/my-website/"
PORTS = range(8765, 8776)


class PreviewHandler(SimpleHTTPRequestHandler):
    """Serve current files on every visit while the portfolio is being edited."""

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        self.send_header("Pragma", "no-cache")
        super().end_headers()


def existing_preview():
    """Reuse an open preview of this checkout instead of creating another port."""
    expected = (SITE_ROOT / "index.html").read_bytes()
    for port in PORTS:
        try:
            with urlopen("http://127.0.0.1:{}/index.html".format(port), timeout=0.4) as response:
                if response.headers.get("Cache-Control", "").startswith("no-store") and response.read() == expected:
                    return port
        except (OSError, URLError):
            continue
    return None


def main():
    running_port = existing_preview()
    if running_port is not None:
        url = "http://127.0.0.1:{}/index.html".format(running_port)
        print("Using the existing local preview: {}".format(url), flush=True)
        webbrowser.open(url)
        return 0

    handler = partial(PreviewHandler, directory=str(SITE_ROOT))
    server = None
    for port in PORTS:
        try:
            server = ThreadingHTTPServer(("127.0.0.1", port), handler)
            break
        except OSError:
            continue
    if server is None:
        try:
            server = ThreadingHTTPServer(("127.0.0.1", 0), handler)
        except OSError as exc:
            print("Could not start the local preview: {}".format(exc), file=sys.stderr)
            return 1

    url = "http://127.0.0.1:{}/index.html".format(server.server_port)
    print("Local preview: {}".format(url), flush=True)
    print("Little Mandy: http://127.0.0.1:{}/little-mandy/".format(server.server_port), flush=True)
    print("Keep this Terminal window open while previewing. Press Control-C to stop.", flush=True)
    print("Public portfolio link for applications: {}".format(PUBLIC_URL), flush=True)
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nPreview stopped.", flush=True)
    finally:
        server.server_close()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
