#!/usr/bin/env node
// Generate a loopable old-school boom-bap instrumental beat for deckworkout.
// Outputs public/sounds/beat.mp3.
// Requires ELEVENLABS_API_KEY in env (source ~/Dev/.api-keys.sh first).

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const OUT_DIR = join(ROOT, 'public', 'sounds');

const API_KEY = process.env.ELEVENLABS_API_KEY;
if (!API_KEY) {
  console.error('Missing ELEVENLABS_API_KEY. Run `source ~/Dev/.api-keys.sh` first.');
  process.exit(1);
}

const PROMPT = `Classic 90s old school boom-bap hip hop instrumental beat, 90 BPM, dusty vinyl crackle, warm jazz piano sample chops, gritty boom-bap drums with thick kick and crisp snare, mellow upright bass groove, soulful and hypnotic background loop, no vocals, no rap, purely instrumental, seamless looping background music suitable for a workout session.`;

const LENGTH_MS = 75000; // 75 seconds — loopable, decent file size

await mkdir(OUT_DIR, { recursive: true });

console.log(`→ Generating beat.mp3 (${LENGTH_MS / 1000}s loop)`);
const t0 = Date.now();
const res = await fetch('https://api.elevenlabs.io/v1/music/compose', {
  method: 'POST',
  headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: PROMPT, music_length_ms: LENGTH_MS }),
});

if (!res.ok) {
  console.error(`API ${res.status}: ${(await res.text()).slice(0, 400)}`);
  process.exit(1);
}

const buf = Buffer.from(await res.arrayBuffer());
await writeFile(join(OUT_DIR, 'beat.mp3'), buf);
console.log(`  ✓ ${(buf.length / 1024).toFixed(0)} KB / ${((Date.now() - t0) / 1000).toFixed(1)}s`);
