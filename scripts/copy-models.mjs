import { existsSync, mkdirSync, cpSync, copyFileSync, readdirSync, statSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const root = join(__dirname, '..');
const dest = join(root, 'public', 'models');

if (!existsSync(dest)) {
  mkdirSync(dest, { recursive: true });
}

const gitkeep = join(dest, '.gitkeep');
if (!existsSync(gitkeep)) writeFileSync(gitkeep, '');

// Step 1: Copy ISNet model chunk files from @imgly/background-removal-data
const dataDir = join(root, 'node_modules', '@imgly', 'background-removal-data', 'dist');
if (existsSync(dataDir)) {
  cpSync(dataDir, dest, { recursive: true });
  console.log('✓ Copied @imgly/background-removal-data → public/models/');
}

// Step 2: Copy WASM + MJS runtime files from onnxruntime-web
const ortDir = join(root, 'node_modules', 'onnxruntime-web', 'dist');
const ortFiles = [
  'ort-wasm-simd-threaded.wasm',
  'ort-wasm-simd-threaded.jsep.wasm',
  'ort-wasm-simd-threaded.mjs',
  'ort-wasm-simd-threaded.jsep.mjs',
];
for (const f of ortFiles) {
  const src = join(ortDir, f);
  if (existsSync(src)) {
    copyFileSync(src, join(dest, f));
    console.log(`✓ Copied onnxruntime-web/${f}`);
  } else {
    console.warn(`⚠ Missing: onnxruntime-web/dist/${f}`);
  }
}

// Step 3: Generate a v1.7.0-compatible resources.json
// The library (v1.7.0+) expects:
//   - Model keys: "isnet", "isnet_fp16", "isnet_quint8"
//   - Chunk objects with a "name" field (not "hash")
//   - WASM/MJS entries as single-chunk complete files
//
// The data package (v1.4.5) uses:
//   - Model keys: "/models/medium" (isnet_fp16, 88MB), "/models/small" (isnet_quint8, 44MB)
//   - Chunk objects with a "hash" field
//   - WASM entries as multi-chunk hashed files
//
// This function bridges the gap so we can self-host all files on Vercel.

const oldResPath = join(dest, 'resources.json');
let oldRes = {};
try {
  oldRes = JSON.parse(readFileSync(oldResPath, 'utf8'));
} catch {
  console.warn('⚠ Could not read existing resources.json — building from scratch');
}

function convertChunks(chunks) {
  return chunks.map(c => ({
    name: c.name ?? c.hash,
    offsets: c.offsets,
  }));
}

function singleChunkEntry(filename, mime) {
  const filePath = join(dest, filename);
  if (!existsSync(filePath)) {
    console.warn(`⚠ Missing file for resources.json: ${filename}`);
    return null;
  }
  const size = statSync(filePath).size;
  return {
    chunks: [{ name: filename, offsets: [0, size] }],
    size,
    mime,
  };
}

const newRes = {};

// Model entries: rename old keys to new key names, convert hash→name
const modelKeyMap = {
  '/models/medium': 'isnet_fp16',
  '/models/small':  'isnet_quint8',
  '/models/large':  'isnet',
};
for (const [oldKey, newKey] of Object.entries(modelKeyMap)) {
  if (oldRes[oldKey]) {
    newRes[newKey] = {
      chunks: convertChunks(oldRes[oldKey].chunks),
      size:   oldRes[oldKey].size,
      mime:   'application/octet-stream',
    };
    console.log(`✓ Mapped ${oldKey} → ${newKey} (${(oldRes[oldKey].size / 1024 / 1024).toFixed(1)} MB)`);
  }
}

// WASM runtime files — use the complete files from onnxruntime-web
// These are served as single chunks (no chunked reassembly needed)
const wasmEntries = {
  '/onnxruntime-web/ort-wasm-simd-threaded.wasm':      { file: 'ort-wasm-simd-threaded.wasm',      mime: 'application/wasm' },
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.wasm': { file: 'ort-wasm-simd-threaded.jsep.wasm', mime: 'application/wasm' },
  '/onnxruntime-web/ort-wasm-simd-threaded.mjs':       { file: 'ort-wasm-simd-threaded.mjs',       mime: 'text/javascript' },
  '/onnxruntime-web/ort-wasm-simd-threaded.jsep.mjs':  { file: 'ort-wasm-simd-threaded.jsep.mjs',  mime: 'text/javascript' },
};
for (const [key, { file, mime }] of Object.entries(wasmEntries)) {
  const entry = singleChunkEntry(file, mime);
  if (entry) {
    newRes[key] = entry;
    console.log(`✓ Added runtime entry ${key} (${(entry.size / 1024).toFixed(0)} KB)`);
  }
}

writeFileSync(oldResPath, JSON.stringify(newRes, null, 2));
console.log('✓ Generated v1.7.0-compatible resources.json');

// Summary
const allFiles = readdirSync(dest).filter(f => f !== '.gitkeep');
const totalBytes = allFiles.reduce((sum, f) => {
  try { return sum + statSync(join(dest, f)).size; } catch { return sum; }
}, 0);
console.log(`✓ public/models/ ready: ${allFiles.length} files, ${(totalBytes / (1024 * 1024)).toFixed(1)} MB total`);
