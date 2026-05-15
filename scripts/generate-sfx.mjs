#!/usr/bin/env node
// Generate the 4 deck-workout sound effects via ElevenLabs sound-generation.
// Outputs MP3 files in public/sounds/.
// Requires ELEVENLABS_API_KEY in env (e.g. source ~/Dev/.api-keys.sh first).

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

const SOUNDS = [
  {
    name: 'draw',
    duration: 0.6,
    prompt:
      'Single quick crisp playing card flip and swipe on a wooden table, light paper sliding sound, dry and tight, no music, no voice',
  },
  {
    name: 'done',
    duration: 0.7,
    prompt:
      'Short satisfying paper card slap on a wooden table immediately followed by a tiny warm bright chime, fantasy game UI confirm, no music, no voice',
  },
  {
    name: 'start',
    duration: 1.4,
    prompt:
      'Quick playing card deck shuffle and riffle on a wooden table, followed by a single warm soft bell ding, fantasy adventure game UI, no music, no voice',
  },
  {
    name: 'finish',
    duration: 2.5,
    prompt:
      'Short triumphant orchestral fanfare with brass and strings, single victory chime at the end, medieval fantasy adventure game, hopeful and warm, no vocals',
  },
];

async function generate({ name, duration, prompt }) {
  const t0 = Date.now();
  const res = await fetch('https://api.elevenlabs.io/v1/sound-generation', {
    method: 'POST',
    headers: { 'xi-api-key': API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: prompt,
      duration_seconds: duration,
      prompt_influence: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 200)}`);
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(join(OUT_DIR, `${name}.mp3`), buf);
  return { size: buf.length, elapsed: Date.now() - t0 };
}

await mkdir(OUT_DIR, { recursive: true });
console.log(`→ Generating ${SOUNDS.length} sounds in ${OUT_DIR}\n`);

for (let i = 0; i < SOUNDS.length; i++) {
  const s = SOUNDS[i];
  process.stdout.write(`[${i + 1}/${SOUNDS.length}] ${s.name.padEnd(8)} (${s.duration}s) `);
  try {
    const { size, elapsed } = await generate(s);
    console.log(`✓ ${(size / 1024).toFixed(0)} KB / ${(elapsed / 1000).toFixed(1)}s`);
  } catch (e) {
    console.log(`✗ ${e.message}`);
  }
  if (i < SOUNDS.length - 1) await new Promise((r) => setTimeout(r, 1000));
}

console.log('\nDone.');
