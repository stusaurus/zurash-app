#!/usr/bin/env python3
"""Turn a Playwright HTML art report into a named contact gallery.

Input: unpacked house-art-review-gallery artifact (or its playwright-chapter-report).
Only standard Python libraries are required. Technical success never approves artwork.
"""
import argparse
import base64
import html
import io
import json
import re
import shutil
import zipfile
from pathlib import Path


SCENES = ('exterior', 'entry', 'living', 'kitchen', 'bedroom', 'garden')
REPAIRS = ('home-entry-0', 'home-entry-1', 'home-entry-2', 'ice-crane',
           'home-living-1', 'home-living-2', 'ice-workshop', 'home-kitchen-1',
           'home-kitchen-2', 'home-bedroom-0', 'home-bedroom-1', 'home-bedroom-2',
           'crystal-gate', 'home-garden-1', 'home-garden-2')
EXPECTED_STATES = {f'{scene}-{phase}' for scene in SCENES
                   for phase in ('unrepaired', 'finished-A', 'finished-B', 'finished-C')}
EXPECTED_STATES.update(f'{index:02}-{repair}-{phase}'
                       for index, repair in enumerate(REPAIRS, 1)
                       for phase in ('before', 'after'))


def validate_coverage(records):
    if not records:
        raise ValueError('No art review images')
    modern = any(re.match(r'^(320|390)-', row['state']) for row in records)
    groups = {}
    for row in records:
        match = re.match(r'^(320|390)-(.*)$', row['state'])
        if modern and not match:
            raise ValueError('Mixed legacy and viewport-labelled art states')
        width, state = (int(match[1]), match[2]) if match else (390, row['state'])
        row['viewport_width'] = width
        group = groups.setdefault(row['project'], {}).setdefault(width, [])
        if state in group:
            raise ValueError(f'Duplicate state: {row["project"]}/{width}/{state}')
        group.append(state)
    required_widths = {320, 390} if modern else {390}
    for project, widths in groups.items():
        if set(widths) != required_widths:
            raise ValueError(f'Incomplete viewport coverage: {project}: {sorted(widths)}')
        for width, states in widths.items():
            missing, extra = EXPECTED_STATES - set(states), set(states) - EXPECTED_STATES
            if missing or extra:
                raise ValueError(f'Incomplete 54 states: {project}/{width}: missing={sorted(missing)}, extra={sorted(extra)}')
    counts = {project: sum(len(states) for states in widths.values()) for project, widths in groups.items()}
    viewports = {project: {str(width): len(states) for width, states in widths.items()} for project, widths in groups.items()}
    return counts, viewports


def build_gallery(source, output):
    root = Path(source).resolve()
    if (root / 'playwright-chapter-report').is_dir():
        root /= 'playwright-chapter-report'
    match = re.search(r'data:application/zip;base64,([A-Za-z0-9+/=]+)', (root / 'index.html').read_text())
    if not match:
        raise ValueError('Playwright report payload is missing')
    output = Path(output).resolve()
    if output == root or root.is_relative_to(output):
        raise ValueError('Output must be separate from the input report')
    (output / 'images').mkdir(parents=True, exist_ok=True)
    records = []
    seen = set()
    with zipfile.ZipFile(io.BytesIO(base64.b64decode(match[1]))) as payload:
        for member in payload.namelist():
            if member == 'report.json' or not member.endswith('.json'):
                continue
            data = json.loads(payload.read(member))
            for test in data.get('tests', []):
                if 'house visual audit' not in test.get('title', ''):
                    continue
                for result in test.get('results', []):
                    for attachment in result.get('attachments', []):
                        if attachment.get('contentType') != 'image/png':
                            continue
                        name = attachment['name']
                        project = test['projectName']
                        key = (project, name)
                        if key in seen:
                            raise ValueError(f'Duplicate review state: {key}')
                        seen.add(key)
                        image = (root / attachment['path']).resolve()
                        if not image.is_relative_to(root) or not image.is_file():
                            raise ValueError(f'Missing or invalid image: {name}')
                        safe = re.sub(r'[^a-zA-Z0-9_-]', '_', f'{project}-{name}') + '.png'
                        target = output / 'images' / safe
                        shutil.copyfile(image, target)
                        records.append(dict(project=project, state=name, file='images/' + safe))
    counts, viewports = validate_coverage(records)
    figures = ''.join('<figure><img loading="lazy" src="' + html.escape(r['file']) + '" alt="' + html.escape(r['state']) + '"><figcaption>' + html.escape(r['project'] + ' / ' + r['state']) + '</figcaption></figure>' for r in records)
    page = '''<!doctype html><html lang="ja"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>ズラッシュ！ 美術レビュー</title><style>body{margin:20px;background:#152942;color:#fff5e6;font:16px system-ui}h1{font-size:24px}p{max-width:70ch;line-height:1.7}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(250px,1fr));gap:14px}figure{margin:0;background:#253b58;border-radius:12px;overflow:hidden}img{display:block;width:100%;height:auto}figcaption{padding:10px;font-size:13px;overflow-wrap:anywhere}</style><h1>54状態 × 画面幅の美術レビュー</h1><p>技術的な画像取得：成功。美術判定：別途必要。全景と修復直前／直後を同じ大きさで確認し、A・B・Cすべての画風・パース・接地・境界・変化を審査します。悪化した案はCI成功でも採用しません。</p><main>''' + figures + '</main></html>'
    (output / 'index.html').write_text(page)
    (output / 'manifest.json').write_text(json.dumps(dict(technical_capture='passed', art_review='pending', counts=counts, viewports=viewports, images=records), ensure_ascii=False, indent=2))
    return counts


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source')
    parser.add_argument('output')
    args = parser.parse_args()
    print(build_gallery(args.source, args.output))
