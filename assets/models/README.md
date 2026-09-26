# AWE / ISS globe visualization

`awe-iss-globe-may2024.glb` is an unchanged copy of Jaime Aguilar Guerrero's promoted web-optimized May 26, 2024 AWE/ISS/globe export. Its source and validation history are recorded in `CONTENT_SOURCES.md`. The accompanying poster is `../images/awe-iss-globe-poster.webp`, optimized from a render of the same scene.

Visualization credit: Jaime Aguilar Guerrero / AWE Science Team. Scientific data, globe imagery, and mission assets retain their original source credits. These research visualization assets are not covered by the repository's MIT software license.

## Mobile variant (September 25, 2026)

`awe-iss-globe-may2024-mobile.glb` reduces decoded texture pressure and draw calls. The original above remains the desktop source. Mobile selection includes narrow screens (800px or less) and devices with a coarse primary pointer, and happens before the viewer is imported. The asset is selected once per page load to avoid loading both models during orientation changes.

| Budget | Original | Mobile |
| --- | ---: | ---: |
| GLB bytes | 12,152,992 | 10,518,240 |
| Estimated RGBA textures with mipmaps | 181.58 MiB | 38.58 MiB |
| Mesh primitives / nominal draw calls | 346 | 30 |
| Uploaded vertices | 1,042,430 | 523,766 |
| Triangles | 553,821 | 511,643 |

The texture estimate excludes geometry, render targets, browser overhead, and decoder working memory; it is not a measured total device-memory footprint. ISS detail textures are capped at 256px; geographic globe textures are reduced to 2048×1024. AWE observation textures retain their original bytes and full resolution. Identical vertices are welded, compatible ISS meshes joined under their animated parent, and high-detail ISS/orbit primitives mildly simplified. Solar panel meshes and small primitives are excluded from simplification.

`mobile-optimization.json` records the detailed budgets. The build script verifies every science triangle's vertex attributes and node transform, exact AWE texture bytes, and orbit animation samples after decoding the output. Triangle/index ordering may change without changing the scientific surface. Khronos validation of the decoded output reports zero errors; four tangent-space warnings remain on ISS materials.

Build-only tools: Node.js, `@gltf-transform/core`, `@gltf-transform/extensions`, and `@gltf-transform/functions` 4.5.0; `meshoptimizer` 0.25.0; and `sharp` 0.34.3. Install these in a temporary directory, copy `scripts/optimize-xr-model.mjs` alongside its `node_modules`, then run `node optimize-xr-model.mjs /absolute/path/to/research-homepage`. These tools are not website dependencies.

The viewer disables mobile contact shadows, allows adaptive resolution to fall to 25%, and pauses animation/rotation when offscreen, hidden, or reduced motion is requested. The custom poster slot uses a centered square `object-fit: cover` crop without altering the source image. The poster and USU gallery link remain available if loading fails or JavaScript is unavailable.
