#!/usr/bin/env node
import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const OUT_DIR = join(ROOT, 'public', 'cards');
const REFERENCE_PATH = join(OUT_DIR, 'king-spades.png');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY.');
  process.exit(1);
}

const STYLE_LOCK = `Match the EXACT art style, palette, frame, border ornamentation, parchment background, lighting and corner indices treatment of the reference image. Same cel-shaded cartoon illustration, thick black outlines, flat saturated coloring, warm mediterranean fantasy palette, ornate golden art-nouveau filigree border with holographic foil shimmer, aged cream parchment center.`;

const COMMON = `Vertical card composition, ultra clean linework, no extra text or numbers other than the corner index letter.`;

const CARDS = [
  // Spades (black) — warriors, dark/regal
  { f: 'queen-spades', rank: 'Q', suit: '♠ spade', char: 'a fierce warrior queen with long dark hair, raven-black armor with silver inlays, deep purple cape, holding a slim ornate spear vertically, sharp cheekbones, intense calm gaze, fierce confident stance' },
  { f: 'jack-spades', rank: 'J', suit: '♠ spade', char: 'a young dark-haired knight, athletic lean physique, dark slate armor with silver edges, dual short swords crossed on his chest, smirk on a handsome young face, daring stance' },
  { f: 'ace-spades', rank: 'A', suit: '♠ spade', char: 'a single massive ornate black-and-silver SPADE symbol filling the center of the card, intricately decorated with engraved gold filigree, glowing softly, no human character, surrounded by faint mystical aura' },

  // Hearts (red) — noble, warm
  { f: 'king-hearts', rank: 'K', suit: '♥ heart', char: 'a noble king with golden blond hair and beard, wearing a royal red and gold robe, glowing golden heart pendant on his chest, kind regal face, holding a golden scepter, warm benevolent expression' },
  { f: 'queen-hearts', rank: 'Q', suit: '♥ heart', char: 'a beautiful red-haired queen with long flowing hair, elegant crimson and gold flowing dress, golden heart-shaped tiara, holding a single red rose, soft loving smile, graceful pose' },
  { f: 'jack-hearts', rank: 'J', suit: '♥ heart', char: 'a charming young bard with chestnut hair, lean athletic build, open red and gold tunic showing chest, holding a golden lyre, playful confident smile, romantic adventurer vibe' },
  { f: 'ace-hearts', rank: 'A', suit: '♥ heart', char: 'a single massive ornate red-and-gold HEART symbol filling the center of the card, intricately decorated with engraved gold filigree, radiating warm golden light, no human character' },

  // Diamonds (red) — wealth, prestige
  { f: 'king-diamonds', rank: 'K', suit: '♦ diamond', char: 'an opulent merchant king with a gem-encrusted golden crown, rich purple velvet robe trimmed with gold, holding a large diamond gemstone, sharp clever face with trimmed beard, regal proud stance' },
  { f: 'queen-diamonds', rank: 'Q', suit: '♦ diamond', char: 'an elegant queen with platinum-blonde hair styled high, jeweled diamond tiara, sparkling silver and gold gown, holding a faceted diamond scepter, refined sophisticated face, poised stance' },
  { f: 'jack-diamonds', rank: 'J', suit: '♦ diamond', char: 'a nimble young thief with golden blond hair, light leather armor with golden trim, holding two ornate daggers, mischievous grin, athletic agile pose' },
  { f: 'ace-diamonds', rank: 'A', suit: '♦ diamond', char: 'a single massive ornate red-and-gold DIAMOND gemstone symbol filling the center of the card, multi-faceted, sparkling brilliantly with golden filigree around it, no human character' },

  // Clubs (black) — nature, druidic
  { f: 'king-clubs', rank: 'K', suit: '♣ club', char: 'a wise druid king with long greying beard and brown hair, weathered face full of wisdom, brown and forest-green robes with gold leaf-shaped clasps, holding an ornate gnarled wooden staff topped with a glowing green crystal, calm grounded stance' },
  { f: 'queen-clubs', rank: 'Q', suit: '♣ club', char: 'an elven sorceress queen with long emerald-green hair, pointed ears, leaf-patterned green and gold dress, holding a wooden wand sprouting tiny leaves, mystical wise face, graceful pose' },
  { f: 'jack-clubs', rank: 'J', suit: '♣ club', char: 'a young forest ranger with shaggy brown hair, green and brown leather armor with leaf details, holding a wooden longbow, alert focused face, ready hunting stance' },
  { f: 'ace-clubs', rank: 'A', suit: '♣ club', char: 'a single massive ornate black-and-gold CLUB clover-trefoil symbol filling the center of the card, decorated with intricate vine and leaf gold filigree, no human character' },

  // Back
  { f: 'back', rank: null, suit: null, char: null, isBack: true },
];

async function generateOne({ f, rank, suit, char, isBack }) {
  const refData = await readFile(REFERENCE_PATH);

  const prompt = isBack
    ? `Match the EXACT art style, palette, frame, border ornamentation, and golden filigree of the reference image. Generate the BACK of this playing card (NOT a front face). Symmetric ornate design with a large central golden royal crown emblem on aged cream parchment, surrounded by intricate golden art-nouveau filigree pattern, holographic gold foil shimmer, decorative corner flourishes mirrored on all four corners, no character, no number, no letter, no suit symbol, fully symmetric design that looks the same when rotated 180 degrees. ${COMMON}`
    : `${STYLE_LOCK} Replace the character with: ${char}. Update corner indices: large ${suit} pip and bold '${rank}' letter in top-left corner, mirrored ${suit} pip and '${rank}' rotated 180 degrees in bottom-right corner. ${COMMON}`;

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
  const body = {
    contents: [{
      parts: [
        { inlineData: { mimeType: 'image/png', data: refData.toString('base64') } },
        { text: prompt },
      ],
    }],
    generationConfig: { imageConfig: { aspectRatio: '3:4' } },
  };

  const t0 = Date.now();
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imgPart) throw new Error('No image in response');

  const buf = Buffer.from(imgPart.inlineData.data, 'base64');
  await mkdir(OUT_DIR, { recursive: true });
  const outPath = join(OUT_DIR, `${f}.png`);
  await writeFile(outPath, buf);

  return { path: outPath, size: buf.length, elapsed: Date.now() - t0 };
}

console.log(`→ Generating ${CARDS.length} cards using ${REFERENCE_PATH} as style reference\n`);

let success = 0;
let failed = [];

for (let i = 0; i < CARDS.length; i++) {
  const card = CARDS[i];
  process.stdout.write(`[${i + 1}/${CARDS.length}] ${card.f.padEnd(18)} `);
  try {
    const { size, elapsed } = await generateOne(card);
    console.log(`✓ ${(size / 1024).toFixed(0)} KB / ${(elapsed / 1000).toFixed(1)}s`);
    success++;
  } catch (e) {
    console.log(`✗ ${e.message.split('\n')[0]}`);
    failed.push(card.f);
  }
  if (i < CARDS.length - 1) {
    await new Promise((r) => setTimeout(r, 1500));
  }
}

console.log(`\n=== ${success}/${CARDS.length} succeeded ===`);
if (failed.length) {
  console.log(`Failed: ${failed.join(', ')}`);
  process.exit(1);
}
