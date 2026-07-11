/*
 * optimize-images.mjs — convert raster images to WebP (in place) to shrink
 * storefront asset weight. Originals are deleted only after a successful
 * conversion. `sharp` is a devDependency.
 *
 *   node scripts/optimize-images.mjs                 # default: app static assets
 *   node scripts/optimize-images.mjs backend/uploads # or any other image dir
 *
 * Adapted from the NEOMATTEN pipeline for Mobile Market. Note: runtime
 * product-image uploads live under backend/uploads (served at /api/uploads);
 * pass that dir as the argument to optimize an existing upload set.
 */
import { readdir, stat, unlink } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, extname, join } from 'node:path';

import sharp from 'sharp';

const INPUT_DIR = process.argv[2] ?? 'projects/mobile-market-app/src/assets/images';
const QUALITY = 85;
const EXCLUDE_DIRS = ['icons'];
const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.tiff'];

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.includes(entry.name)) continue;
      files.push(...(await walk(fullPath)));
    } else if (IMAGE_EXTS.includes(extname(entry.name).toLowerCase())) {
      files.push(fullPath);
    }
  }
  return files;
}

async function optimise(filePath) {
  const webpPath = filePath.replace(/\.(png|jpg|jpeg|gif|tiff)$/i, '.webp');
  try {
    const original = await stat(filePath);
    const info = await sharp(filePath).webp({ quality: QUALITY }).toFile(webpPath);
    await unlink(filePath); // delete original only after a successful conversion

    const saved = original.size - info.size;
    const pct = ((saved / original.size) * 100).toFixed(1);
    console.log(
      `✅ ${basename(filePath)} → ${basename(webpPath)} | ${(original.size / 1024).toFixed(0)}KB → ${(info.size / 1024).toFixed(0)}KB (-${pct}%) 🗑`,
    );
  } catch (err) {
    console.error(`❌ ${filePath}:`, err.message);
  }
}

if (!existsSync(INPUT_DIR)) {
  console.log(`No image directory at "${INPUT_DIR}" — nothing to optimise.`);
  process.exit(0);
}

const files = await walk(INPUT_DIR);
console.log(
  `Found ${files.length} image(s) to optimise in ${INPUT_DIR} (excluding: ${EXCLUDE_DIRS.join(', ')})\n`,
);
await Promise.all(files.map(optimise));
console.log('\nDone.');
