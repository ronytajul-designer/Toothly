#!/usr/bin/env python3
"""Assemble static pages: src/pages/*.html + src/partials/*.html -> ./*.html

Page front matter (first line):
  <!--meta title="..." description="..." active="home" body="page-home" -->
Includes:  {{> partial-name}}
Variables: {{title}} {{description}} {{active}}
Active nav: any element with data-nav="<active>" gets aria-current="page".
Run:  python3 tools/build.py
"""
import re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
partials = {p.stem: p.read_text() for p in (SRC / "partials").glob("*.html")}
META = re.compile(r'^<!--meta(.*?)-->\s*', re.S)
ATTR = re.compile(r'(\w+)="([^"]*)"')
INC = re.compile(r'\{\{>\s*([\w-]+)\s*\}\}')

def expand(text, depth=0):
    if depth > 5: raise RuntimeError("include depth exceeded")
    return INC.sub(lambda m: expand(partials[m.group(1)], depth + 1), text)

for page in sorted((SRC / "pages").glob("*.html")):
    raw = page.read_text()
    m = META.match(raw)
    meta = dict(ATTR.findall(m.group(1))) if m else {}
    body = raw[m.end():] if m else raw
    html = expand(partials["layout"].replace("{{content}}", body))
    for k, v in meta.items():
        html = html.replace("{{" + k + "}}", v)
    active = meta.get("active", "")
    if active:
        html = html.replace(f'data-nav="{active}"', f'data-nav="{active}" aria-current="page"')
    html = re.sub(r"\{\{\w+\}\}", "", html)
    (ROOT / page.name).write_text(html)
    print("built", page.name)
