#!/usr/bin/env python3
"""Import verified front-door prototype PNGs from the chat-generated ZIP."""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
import struct
import zipfile

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "assets/house/exterior/door/manifest.json"
PNG_SIGNATURE = b"\x89PNG\r\n\x1a\n"

def inspect_png(raw: bytes) -> tuple[int, int, int]:
    if len(raw) < 33 or not raw.startswith(PNG_SIGNATURE) or raw[12:16] != b"IHDR":
        raise ValueError("Not a PNG file")
    width, height, depth, color_type = struct.unpack(">IIBB", raw[16:26])
    if depth != 8 or color_type != 6:
        raise ValueError(f"Expected 8-bit RGBA PNG, got {depth=} {color_type=}")
    return width, height, len(raw)

def import_assets(zip_path: Path, *, dry_run: bool = False) -> list[dict]:
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    staged = []
    with zipfile.ZipFile(zip_path) as archive:
        for variant in manifest["variants"]:
            if variant["present_in_git"]:
                raise RuntimeError(f"Already registered: {variant['id']}")
            basename = Path(variant["path"]).name
            matches = [s for s in archive.namelist() if Path(s).name == basename]
            if len(matches) != 1:
                raise ValueError(f"Expected one {basename}, got {len(matches)}")
            raw = archive.read(matches[0])
            width, height, size = inspect_png(raw)
            if (width, height) != (manifest["canvas"]["width"], manifest["canvas"]["height"]):
                raise ValueError(f"Wrong canvas in {basename}: {width}x{height}")
            digest = hashlib.sha256(raw).hexdigest()
            if digest != variant["sha256"] or size != variant["bytes"]:
                raise ValueError(f"{basename}: checksum or byte count mismatch")
            target = ROOT / variant["path"]
            if target.exists():
                raise FileExistsError(f"Refusing overwrite: {target}")
            staged.append((target, raw, variant))
    if not dry_run:
        for target, raw, variant in staged:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(raw)
            variant["present_in_git"] = True
        MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    return [{"path": str(target.relative_to(ROOT)), "sha256": variant["sha256"], "bytes":len(raw)}
            for target, raw, variant in staged]

if __name__ == "__main__":
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("zip_path", type=Path)
    p.add_argument("--dry-run", action="store_true")
    a = p.parse_args()
    print(json.dumps({"dry_run": a.dry_run, "files": import_assets(a.zip_path, dry_run=a.dry_run)}, ensure_ascii=False, indent=2))
