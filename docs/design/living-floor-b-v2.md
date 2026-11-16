# Living floor B (herringbone) — candidate v2

Related issue: #42. Source came from the image directly attached by the user in ChatGPT on 2026-11-17.

## Provenance and geometry

- Original artwork in Library: `暖炉と窓光の寄木張りの床.png`, ID `libfile_84530489e6348191b51290a7431e28fb`. The original PNG is preserved in Library.
- **This Chat attachment was JPEG** (`1182×1330`, SHA-256 `a6e69c4a9b06b840a36e5ad478ac48328a9fd92f0febc7da728df5cf27fb1cef`). This is not a byte-identical copy of the Library PNG.
- Game art is a separate WebP: `assets/house/v7/living/ice-crane-b-v2.webp` (480×216, 23,284 bytes, SHA-256 `828e3ab7790ef8b85306eec8ecc4098650d9310dff97cb1b83111741b125e53e`).
- Git blob SHA: `0506bc6e731ea95453e7975ae31017b5ce7f70ca`, verified against the local file before commit.
- Map full-room source to 480×540 by Lanczos, then crop pixels `(0,324)-(480,540)`. This is **not** squashing the full room into the floor slot.
- Keep the current `ART_PLACEMENTS.living[0]=[0,324,480,216]` and `living-floor` clip (`M0 324L480 337V540H0Z`). Sofa, bookcase and fireplace stay behind/above floor as before.
- Only completed B (saved style index 1) references the new `-v2` file. Before/A/C, unlocks, stars, saves and stage rules remain unchanged.

## Acceptance gates

1. WebP header and variant isolation Node tests.
2. Chromium/WebKit in viewport widths 320, 390 and 1440. Capture old B/new B, unrepaired/A/C on identical camera and fully furnished room.
3. Run 216-image house gallery and verify no missing image or rendering regressions.
4. Run chapter 1/2, game quality and existing save/star regressions.
5. **Manual art decision:** look for floor-to-baseboard transition, hearth contact, far-right doorway, tile perspective and sofa contact. Art acceptance cannot be inferred from CI success.
6. Do not merge before technical and art review. iPhone actual Safari remains #30.

## Handoff and preservation

The user's persistent Library contains `/ズラッシュ/zurash-floor-B-integration-candidate.zip` (Library ID `libfile_0d64bc620bdc8191a5d421c124a66b41`) with the JPEG attachment, derived WebP, code patch, tests and comparison mock.
The WebP is separately in `/ズラッシュ/ice-crane-b-v2-candidate.webp` (ID `libfile_ecef2ee148e88191a24c5c640904478b`).

The package comparison image is a manually composited study, **not** a real-browser game screenshot. The PR CI output is the authoritative art review for the final renderer.
