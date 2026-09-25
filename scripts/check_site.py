#!/usr/bin/env python3
"""Check local assets/anchors and block releases with unsupplied photos."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import unquote, urlsplit
import argparse
import re
import sys

ROOT = Path(__file__).resolve().parents[1]

class Site(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.ids, self.refs, self.errors, self.pending = set(), [], [], []
        self.h1 = 0

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'h1':
            self.h1 += 1
        if 'id' in a:
            if a['id'] in self.ids:
                self.errors.append('Duplicate id: ' + a['id'])
            self.ids.add(a['id'])
        for key in ('href', 'src'):
            if key in a:
                self.refs.append(a[key])
        if 'srcset' in a:
            self.refs.extend(item.strip().split()[0] for item in a['srcset'].split(','))
        if tag == 'img' and not a.get('alt'):
            self.errors.append('Image needs descriptive alt text: ' + a.get('src', ''))
        if 'photo-pending' in a.get('class', '').split():
            self.pending.append(a.get('data-photo-slot', 'unknown'))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--publish', action='store_true', help='require supplied photos before deployment')
    args = parser.parse_args()
    html = (ROOT / 'index.html').read_text()
    site = Site()
    site.feed(html)
    if site.h1 != 1:
        site.errors.append('Expected one primary heading')
    for ref in site.refs:
        parts = urlsplit(ref)
        if parts.scheme or parts.netloc:
            continue
        if not parts.path:
            if parts.fragment and parts.fragment not in site.ids:
                site.errors.append('Missing anchor: ' + ref)
            continue
        if parts.path.startswith('/'):
            site.errors.append('Root-relative asset breaks the Pages project path: ' + ref)
        elif not (ROOT / unquote(parts.path)).is_file():
            site.errors.append('Missing local asset: ' + ref)
    for css in (ROOT / 'assets/css').glob('*.css'):
        for ref in re.findall(r'url\([\'\"]?([^\)\'\"]+)', css.read_text()):
            if not urlsplit(ref).scheme and not (css.parent / ref).is_file():
                site.errors.append('Missing CSS asset: ' + ref)
    if args.publish and site.pending:
        site.errors.append('Photos still pending: ' + ', '.join(site.pending))
    if site.errors:
        print('\n'.join('FAIL: ' + item for item in site.errors))
        return 1
    print(f'PASS: {len(site.ids)} unique anchors; {len(site.refs)} references; local assets and image alt text valid.')
    if site.pending:
        print('Development preview only; publication awaits: ' + ', '.join(site.pending))
    return 0

if __name__ == '__main__':
    sys.exit(main())
