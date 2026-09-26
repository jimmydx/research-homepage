// Run a copy alongside the build-only dependencies documented in assets/models/README.md.
import { NodeIO } from '@gltf-transform/core';
import { ALL_EXTENSIONS, EXTMeshoptCompression } from '@gltf-transform/extensions';
import { dedup, weld, join, prune, textureCompress, simplifyPrimitive } from '@gltf-transform/functions';
import { MeshoptDecoder, MeshoptEncoder, MeshoptSimplifier } from 'meshoptimizer';
import sharp from 'sharp';
import { createHash } from 'node:crypto';
import { stat, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.argv[2];
if (!root) throw new Error('Provide the research-homepage directory.');
await Promise.all([MeshoptDecoder.ready, MeshoptEncoder.ready, MeshoptSimplifier.ready]);
const io = new NodeIO().registerExtensions(ALL_EXTENSIONS).registerDependencies({
  'meshopt.decoder': MeshoptDecoder, 'meshopt.encoder': MeshoptEncoder,
});
const input = path.join(root, 'assets/models/awe-iss-globe-may2024.glb');
const output = path.join(root, 'assets/models/awe-iss-globe-may2024-mobile.glb');
const doc = await io.read(input);
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

// Compare every indexed science vertex attribute, not just the mesh bounds.
function scienceSnapshot(document) {
  return document.getRoot().listNodes().filter(n => /^AWE_/.test(n.getName())).map(n => ({
    name: n.getName(), matrix: n.getMatrix(),
    primitives: n.getMesh().listPrimitives().map(p => {
      const indices = p.getIndices();
      const attributes = p.listSemantics().sort().map(s => p.getAttribute(s));
      const vertexHashes = Array.from({length: attributes[0].getCount()}, (_, i) => {
        const values = attributes.flatMap(a => a.getElement(i, []));
        return hash(Buffer.from(new Float32Array(values).buffer));
      });
      const triangles = [];
      for (let i = 0; i < indices.getCount(); i += 3) {
        const a = vertexHashes[indices.getScalar(i)], b = vertexHashes[indices.getScalar(i + 1)], c = vertexHashes[indices.getScalar(i + 2)];
        // Meshopt may rotate triangle indices, without changing vertices or winding.
        triangles.push([a+b+c, b+c+a, c+a+b].sort()[0]);
      }
      return hash(triangles.sort().join(''));
    }),
  }));
}
function animationSnapshot(document) {
  return document.getRoot().listAnimations().map(a => ({name: a.getName(), channels: a.listChannels().map(c => ({
    node: c.getTargetNode().getName(), path: c.getTargetPath(), interpolation: c.getSampler().getInterpolation(),
    input: Array.from(c.getSampler().getInput().getArray()), output: Array.from(c.getSampler().getOutput().getArray()),
  }))}));
}
const swathTextures = document => document.getRoot().listTextures().filter(t => /AWE-UV/.test(t.getName())).map(t => [t.getName(), hash(t.getImage())]);
async function metrics(document, filename) {
  const meshes = document.getRoot().listMeshes();
  const primitives = meshes.flatMap(m => m.listPrimitives());
  const textures = await Promise.all(document.getRoot().listTextures().map(async t => {
    const {width, height} = await sharp(t.getImage()).metadata();
    return {name: t.getName(), width, height};
  }));
  return {
    bytes: (await stat(filename)).size, meshes: meshes.length, primitives: primitives.length,
    vertices: primitives.reduce((n, p) => n + p.getAttribute('POSITION').getCount(), 0),
    triangles: primitives.reduce((n, p) => n + p.getIndices().getCount() / 3, 0),
    estimatedTextureMiBWithMipmaps: textures.reduce((n, t) => n + t.width * t.height * 4 * 4 / 3, 0) / 1048576,
    textures,
  };
}
const before = await metrics(doc, input);
const science = scienceSnapshot(doc), animation = animationSnapshot(doc), swath = swathTextures(doc);
await doc.transform(weld());
for (const mesh of doc.getRoot().listMeshes()) {
  const name = mesh.getName();
  if (/^AWE_|p6_ani|Plane|panel|solar/i.test(name)) continue;
  for (const primitive of mesh.listPrimitives()) {
    if (primitive.getIndices().getCount() < 3000) continue;
    simplifyPrimitive(primitive, {simplifier: MeshoptSimplifier,
      ratio: /^iss_orbit/.test(name) ? 0.2 : 0.75,
      error: /^iss_orbit/.test(name) ? 0.00005 : 0.0005,
      lockBorder: true});
  }
}
await doc.transform(
  dedup(),
  weld(), // Only bitwise-identical vertices are merged. No scientific surface decimation.
  join({filter: node => /^ISS_root/.test(node.getParentNode()?.getName() || '')}),
  textureCompress({encoder: sharp, targetFormat: 'webp', pattern: /^(ISS_|foil|ecostress|Palette)/, resize: [256, 256], quality: 85}),
  textureCompress({encoder: sharp, targetFormat: 'webp', pattern: /GLOBE/, resize: [2048, 2048], lossless: true}),
  prune(),
);
// Re-encode without another quantization pass or lossy filters.
doc.createExtension(EXTMeshoptCompression).setRequired(true).setEncoderOptions({method: EXTMeshoptCompression.EncoderMethod.QUANTIZE});
await io.write(output, doc);
const result = await io.read(output);
for (const [name, actual, expected] of [
  ['science geometry and transforms', scienceSnapshot(result), science],
  ['ISS orbit animation', animationSnapshot(result), animation],
  ['AWE observation textures', swathTextures(result), swath],
]) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`Changed ${name}`);
}
const report = {before, after: await metrics(result, output), validation: {
  scienceGeometryAndTransformsUnchanged: true, orbitAnimationUnchanged: true, aweTexturesUnchanged: true,
}};
await writeFile(path.join(root, 'assets/models/mobile-optimization.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
