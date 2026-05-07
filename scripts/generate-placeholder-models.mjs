/**
 * Generates minimal valid .glb placeholder files for development.
 * A .glb file is binary glTF — this creates the smallest valid scene
 * (an empty scene with a single empty node) so the Three.js loader
 * doesn't crash.
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

// Minimal glTF JSON for an empty scene with one node
const gltfJson = JSON.stringify({
  asset: { version: '2.0', generator: 'placeholder' },
  scene: 0,
  scenes: [{ nodes: [0] }],
  nodes: [{ name: 'Candle', mesh: 0 }],
  meshes: [{
    primitives: [{
      attributes: { POSITION: 0 },
    }]
  }],
  accessors: [{
    bufferView: 0,
    componentType: 5126, // FLOAT
    count: 3,
    type: 'VEC3',
    max: [0.5, 1.0, 0.5],
    min: [-0.5, 0.0, -0.5],
  }],
  bufferViews: [{
    buffer: 0,
    byteOffset: 0,
    byteLength: 36,
  }],
  buffers: [{
    byteLength: 36,
  }],
});

// Minimal triangle vertices (a simple triangle as placeholder geometry)
const vertices = new Float32Array([
  0.0, 1.0, 0.0,   // top
  -0.5, 0.0, 0.5,  // bottom-left
  0.5, 0.0, -0.5,  // bottom-right
]);
const binBuffer = Buffer.from(vertices.buffer);

// Build the .glb binary
function createGlb(jsonStr, binBuf) {
  const jsonBuffer = Buffer.from(jsonStr);
  // Pad JSON to 4-byte alignment
  const jsonPadding = (4 - (jsonBuffer.length % 4)) % 4;
  const paddedJson = Buffer.concat([jsonBuffer, Buffer.alloc(jsonPadding, 0x20)]);

  // Pad BIN to 4-byte alignment
  const binPadding = (4 - (binBuf.length % 4)) % 4;
  const paddedBin = Buffer.concat([binBuf, Buffer.alloc(binPadding, 0x00)]);

  const totalLength = 12 + (8 + paddedJson.length) + (8 + paddedBin.length);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546C67, 0); // magic: 'glTF'
  header.writeUInt32LE(2, 4);           // version: 2
  header.writeUInt32LE(totalLength, 8); // total length

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(paddedJson.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4E4F534A, 4); // 'JSON'

  const binChunkHeader = Buffer.alloc(8);
  binChunkHeader.writeUInt32LE(paddedBin.length, 0);
  binChunkHeader.writeUInt32LE(0x004E4942, 4); // 'BIN\0'

  return Buffer.concat([header, jsonChunkHeader, paddedJson, binChunkHeader, paddedBin]);
}

const glbBuffer = createGlb(gltfJson, binBuffer);

// All model paths that need placeholders
const modelFiles = [
  'models/hero-candle.glb',
  'models/lavender-soy.glb',
  'models/lavender-mist-soy.glb',
  'models/lavender-beeswax.glb',
  'models/cinnamon-soy.glb',
  'models/cinnamon-ember-soy.glb',
  'models/cinnamon-beeswax.glb',
];

for (const file of modelFiles) {
  const filePath = join(publicDir, file);
  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, glbBuffer);
  console.log(`Created: public/${file} (${glbBuffer.length} bytes)`);
}

console.log('\nDone! All placeholder .glb models created.');
