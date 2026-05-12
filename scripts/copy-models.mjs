import { existsSync, mkdirSync, cpSync, readdirSync, statSync, writeFileSync } from 'fs';
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

// Copy ISNet model data files (kept for potential future local inference)
const dataDir = join(root, 'node_modules', '@imgly', 'background-removal-data', 'dist');
if (existsSync(dataDir)) {
  cpSync(dataDir, dest, { recursive: true });
  console.log('✓ Copied @imgly/background-removal-data → public/models/');
}

const allFiles = readdirSync(dest).filter(f => f !== '.gitkeep');
const totalBytes = allFiles.reduce((sum, f) => {
  try { return sum + statSync(join(dest, f)).size; } catch { return sum; }
}, 0);
console.log(`✓ public/models/ ready: ${allFiles.length} files, ${(totalBytes / (1024 * 1024)).toFixed(1)} MB total`);
