#!/usr/bin/env node
// Generate Deck Workout brand assets via Nano Banana:
//   - logo-master.png  (1024x1024-ish, gold crown on cream)
//   - og-master.png    (16:9 hero banner for social sharing)

import { writeFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const OUT_DIR = join(ROOT, 'public', 'brand');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY.');
  process.exit(1);
}

const LOGO_PROMPT = `App icon design for "Deck Workout", a card-deck workout app. Centered ornate golden royal crown emblem, viewed from the front, intricate gold filigree details in cel-shaded cartoon style with thick black outlines, flat saturated gold/amber palette with darker gold shadows and bright cream highlights. The crown has a single black spade ♠ jewel set at the front-center and is rendered with the same baroque art-nouveau flourishes used in classic playing card designs. Behind the crown is a subtle radial halo of warm gold glow. Aged cream parchment background (#fdf6e3) filling the entire square frame, with subtle ornamental corner flourishes in soft gold filigree (NOT a card frame, just decorative corners). NO text, NO letters, NO numbers, NO suit pip outside of the crown jewel. Hybrid Zelda Wind Waker / Hearthstone card art style. Ultra clean linework, vibrant but warm palette. Square 1:1 composition, the crown occupies the central 60% leaving safe padding for app icon cropping.`;

const OG_PROMPT = `Promotional banner for "Deck Workout" app. Centered composition on aged cream parchment background (#fdf6e3). Left side: a stacked deck of playing cards seen at 3/4 angle, the top card showing a muscular royal king mid push-up in cel-shaded cartoon style with thick black outlines (Zelda Wind Waker / Hearthstone art). Right side: bold display title "DECK WORKOUT" in baroque dark-brown serif lettering (color #2b1d10), with the subtitle "ONE DECK · 52 CHALLENGES" in small uppercase letters below. Ornate golden filigree corner flourishes framing the banner. The four suits ♠ ♥ ♦ ♣ arranged subtly as small icons. Warm fantasy palette: gold filigree, crimson accents, deep brown ink. Wide 16:9 landscape composition, balanced composition, ultra clean linework.`;

async function callApi(prompt, aspectRatio) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { imageConfig: { aspectRatio } },
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imgPart) throw new Error('No image in response');
  return Buffer.from(imgPart.inlineData.data, 'base64');
}

await mkdir(OUT_DIR, { recursive: true });

console.log('→ Generating logo-master (1:1)...');
const t0 = Date.now();
const logoBuf = await callApi(LOGO_PROMPT, '1:1');
await writeFile(join(OUT_DIR, 'logo-master.png'), logoBuf);
console.log(`  ✓ ${(logoBuf.length / 1024).toFixed(0)} KB / ${((Date.now() - t0) / 1000).toFixed(1)}s`);

console.log('→ Generating og-master (16:9)...');
const t1 = Date.now();
const ogBuf = await callApi(OG_PROMPT, '16:9');
await writeFile(join(OUT_DIR, 'og-master.png'), ogBuf);
console.log(`  ✓ ${(ogBuf.length / 1024).toFixed(0)} KB / ${((Date.now() - t1) / 1000).toFixed(1)}s`);

console.log('\nDone. Files in public/brand/');
