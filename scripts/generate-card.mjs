#!/usr/bin/env node
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const OUT_DIR = join(ROOT, 'public', 'cards');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY.');
  console.error('Run with: node --env-file=.env.local scripts/generate-card.mjs <filename> "<prompt>" [reference-image]');
  process.exit(1);
}

const [, , filename, prompt, refPath] = process.argv;
if (!filename || !prompt) {
  console.error('Usage: node --env-file=.env.local scripts/generate-card.mjs <filename> "<prompt>" [reference-image]');
  console.error('Example: node --env-file=.env.local scripts/generate-card.mjs king-spades "Heroic Greek warrior king..."');
  console.error('Example with ref: node --env-file=.env.local scripts/generate-card.mjs queen-hearts "Same style, queen of hearts..." public/cards/king-spades.png');
  process.exit(1);
}

const MIME_BY_EXT = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
};

const parts = [];

if (refPath) {
  const ext = extname(refPath).toLowerCase();
  const mime = MIME_BY_EXT[ext] ?? 'image/png';
  const data = await readFile(refPath);
  parts.push({ inlineData: { mimeType: mime, data: data.toString('base64') } });
  console.log(`→ Using reference: ${refPath} (${mime}, ${(data.length / 1024).toFixed(1)} KB)`);
}

parts.push({ text: prompt });

const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';

console.log(`→ Calling Nano Banana for "${filename}"...`);
const t0 = Date.now();

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'x-goog-api-key': API_KEY,
  },
  body: JSON.stringify({
    contents: [{ parts }],
    generationConfig: {
      imageConfig: { aspectRatio: '3:4' },
    },
  }),
});

if (!res.ok) {
  const errText = await res.text();
  console.error(`✗ API error ${res.status}:`, errText);
  process.exit(1);
}

const data = await res.json();
const imagePart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);

if (!imagePart) {
  console.error('✗ No image in response. Full response:');
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

const buffer = Buffer.from(imagePart.inlineData.data, 'base64');
await mkdir(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, `${filename}.png`);
await writeFile(outPath, buffer);

const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
console.log(`✓ Saved ${outPath} (${(buffer.length / 1024).toFixed(1)} KB in ${elapsed}s)`);
