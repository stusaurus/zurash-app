# Living floor C (blue-gray slate with ice inlays) — candidate v2

Issue #42. Art concept generated from the existing approved winter cabin reference on 2026-11-17.

## Source and fidelity

- Source room render: `/ズラッシュ/暖炉と窓光の石床C原画.png` in Library (ID `libfile_81ec7451a5d08191a7b99d4f0ccaa9f3`). 1182×1330 PNG, SHA-256 `66d3ea551624061d68ead1e1bb6fe58e9a7e6f7e8b6ed309e2989ecd1a1a86cb`.
- Floor-only candidate: `assets/house/v7/living/ice-crane-c-v2.webp` (480×216; 25,866 bytes; SHA-256 `d22413ab8803b5e1fccbf0e250aa02760d3fa6ee8f36f47a3ca24cc3c8882bc2`). Git blob `3f74224b5baac9c9c4e97c55c37fa4ed33ff1981`.
- WebP is also saved in Library at `/ズラッシュ/ice-crane-c-v2-candidate.webp` (ID `libfile_9515d3313b5c8191a7a88f3760070cd2`).
- Same processing as B: resize source room 1182×1330 → 480×540 with Lanczos; crop floor pixels `(0,324)-(480,540)`. Use existing `ART_PLACEMENTS.living[0]=[0,324,480,216]` and `living-floor` SVG clip.
- Only saved style 2 uses C v2. Source PNG remains in Library, unmodified.

## Art intention

Replace the previous decorative stone floor with a floor that looks structurally continuous with the approved house rather than a picture frame. Unpolished cool blue-gray stone, restrained ice snowflakes in seams, warm firelight on the left and cool winter light on the right. No extra decorative raised rim.

## Quality gate

- The C room source is not a production background: only floor pixels are used; existing walls, fireplace, window, sofa and bookcase remain untouched.
- Compare old C versus new C in the **actual layered renderer** at 320/390/1440px in Chromium and WebKit. Check stone scale, perspective, edge continuity, doorway, fireplace hearth, sofa feet and furniture shadows.
- Independently confirm game/save/star/50-stage/second-chapter regression tests.
- No game or art approval solely from file creation or visual simulation; do not publish until all checks pass.

Rejection precedents: PR #34, #39, #41; do not revive simple full-room squashing or crop-and-stretch art.
