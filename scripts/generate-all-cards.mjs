#!/usr/bin/env node
import { writeFile, readFile, mkdir, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const OUT_DIR = join(ROOT, 'public', 'cards');
const MASTER_PATH = join(OUT_DIR, 'king-spades.png');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY.');
  process.exit(1);
}

const STYLE_BASE = `Classic playing card design crossing traditional royal court characters with athletic muscular bodies. Cel-shaded cartoon illustration with thick black outlines, flat saturated coloring, painterly highlights, hybrid Zelda Wind Waker / Age of Empires Online / Hearthstone art style. Aged cream parchment card background, ornate golden art-nouveau filigree border with holographic foil shimmer. Vertical card composition, formal frontal regal pose like a classic playing card character, ultra clean linework, no extra text or numbers other than the corner index letter.`;

const STYLE_LOCK = `Match the EXACT art style, palette, frame, border ornamentation, parchment background, lighting, character framing and corner indices treatment of the reference image. Same cel-shaded cartoon illustration, thick black outlines, flat saturated coloring, ornate golden filigree border with holographic foil shimmer, aged cream parchment center.`;

const CORNERS = (rank, suit) =>
  `Update corner indices: large ${suit} pip and bold '${rank}' letter in top-left corner, mirrored ${suit} pip and '${rank}' rotated 180 degrees in bottom-right corner.`;

// --- Card definitions ---

// Master must be the first generated (no reference yet)
const MASTER = {
  f: 'king-spades',
  prompt: `${STYLE_BASE} The character is the classic King of Spades reimagined: a powerful muscular royal king with broad shoulders, defined athletic chest visible through an open royal mantle, thick muscular arms, traditional regal pose. He wears a tall black-and-gold royal crown with a large black spade jewel at the front, a deep crimson and gold royal mantle draped over his shoulders showing his chiseled torso, golden bracers on his forearms, and a long thin beard. He holds a long ornate two-handed sword vertically across his chest like a barbell. Strong noble face. Background: subtle dark gradient suggesting a regal hall, no specific scenery. ${CORNERS('K', '♠ spade')}`,
};

const CARDS = [
  // SPADES (black) — regal dark warriors
  {
    f: 'queen-spades',
    char: `the classic Queen of Spades reimagined as a powerful muscular warrior queen with toned arms and a strong athletic figure, long dark hair flowing past her shoulders, a tall black-and-gold royal crown with a black spade jewel, a sleeveless deep purple and gold royal gown showing her sculpted shoulders and biceps, holding a single black rose in one hand and a slender ornate scepter in the other, fierce calm regal expression`,
    rank: 'Q', suit: '♠ spade',
  },
  {
    f: 'jack-spades',
    char: `the classic Jack of Spades reimagined as a young muscular royal page-knight with athletic lean physique, dark short hair, a black-and-silver fitted page tunic open at the chest revealing his chiseled torso, a small feathered black cap, holding a single short ornate sword pointing up, smirk on a handsome young face, daring confident pose`,
    rank: 'J', suit: '♠ spade',
  },
  {
    f: 'ace-spades',
    char: `a single massive ornate black-and-silver SPADE symbol filling the center of the card, intricately decorated with engraved gold filigree and royal flourishes, glowing softly. NO HUMAN CHARACTER. The spade is the entire focal point, ornamental, like a classic Ace of Spades`,
    rank: 'A', suit: '♠ spade',
  },

  // HEARTS (red) — noble warm rulers
  {
    f: 'king-hearts',
    char: `the classic King of Hearts reimagined as a powerful muscular royal king with broad muscular shoulders and a defined chest visible through an open red mantle, well-groomed full white beard, a tall red-and-gold royal crown with a heart-shaped ruby jewel, a flowing crimson and gold royal mantle, a golden necklace with a heart pendant on his bare muscular chest, holding a golden two-handed sword pointing down. Warm noble expression`,
    rank: 'K', suit: '♥ heart',
  },
  {
    f: 'queen-hearts',
    char: `the classic Queen of Hearts reimagined as a beautiful muscular royal queen with toned sculpted arms, long flowing red-orange hair, a tall red-and-gold royal crown with a heart-shaped ruby, an elegant sleeveless crimson and gold royal gown showing her toned shoulders and arms, holding a single red rose, kind regal smile`,
    rank: 'Q', suit: '♥ heart',
  },
  {
    f: 'jack-hearts',
    char: `the classic Jack of Hearts reimagined as a young muscular royal page-knight with athletic lean chiseled physique, chestnut wavy hair, a red-and-gold fitted page tunic open at the chest revealing his sculpted torso, a small red feathered cap, holding a single short ornate sword pointing up, charming confident smile`,
    rank: 'J', suit: '♥ heart',
  },
  {
    f: 'ace-hearts',
    char: `a single massive ornate red-and-gold HEART symbol filling the center of the card, intricately decorated with engraved gold filigree, radiating warm golden light. NO HUMAN CHARACTER. The heart is the entire focal point, ornamental, like a classic Ace of Hearts`,
    rank: 'A', suit: '♥ heart',
  },

  // DIAMONDS (red) — opulent prestige
  {
    f: 'king-diamonds',
    char: `the classic King of Diamonds reimagined as a powerful muscular merchant king with broad shoulders and defined chest, well-trimmed dark beard, a tall purple-and-gold royal crown encrusted with diamonds, a rich purple and gold royal mantle showing his muscular torso, golden bracers, holding a large faceted diamond gemstone in one hand and an ornate axe over his shoulder in the other. Sharp regal expression`,
    rank: 'K', suit: '♦ diamond',
  },
  {
    f: 'queen-diamonds',
    char: `the classic Queen of Diamonds reimagined as an elegant muscular royal queen with toned sculpted arms, platinum-blonde hair styled high, a tall jeweled diamond tiara, a sparkling sleeveless silver and purple gown showing her toned shoulders, holding a faceted diamond scepter, refined poised expression`,
    rank: 'Q', suit: '♦ diamond',
  },
  {
    f: 'jack-diamonds',
    char: `the classic Jack of Diamonds reimagined as a young muscular royal page-knight with athletic lean chiseled physique, blond wavy hair, a purple-and-gold fitted page tunic open at the chest revealing his sculpted torso, a small purple feathered cap, holding a single short ornate sword pointing up, mischievous confident smile`,
    rank: 'J', suit: '♦ diamond',
  },
  {
    f: 'ace-diamonds',
    char: `a single massive ornate red-and-gold DIAMOND gemstone symbol filling the center of the card, multi-faceted, sparkling brilliantly with intricate gold filigree around it. NO HUMAN CHARACTER. The diamond is the entire focal point, ornamental, like a classic Ace of Diamonds`,
    rank: 'A', suit: '♦ diamond',
  },

  // CLUBS (black) — earth, vigorous
  {
    f: 'king-clubs',
    char: `the classic King of Clubs reimagined as a powerful muscular royal king with broad shoulders and a defined chest, full thick brown beard, a tall green-and-gold royal crown with a black trefoil clover jewel, a forest-green and gold royal mantle showing his muscular torso, golden bracers with leaf motifs, holding a thick ornate gnarled wooden battle staff topped with a glowing green crystal. Strong wise regal expression`,
    rank: 'K', suit: '♣ club',
  },
  {
    f: 'queen-clubs',
    char: `the classic Queen of Clubs reimagined as a powerful muscular royal queen with toned sculpted arms, long dark green-tinted braided hair, a tall green-and-gold royal crown with a black clover jewel, a sleeveless forest-green and gold royal gown with leaf-shaped golden trim showing her toned shoulders, holding a wooden wand sprouting tiny golden leaves, calm regal expression`,
    rank: 'Q', suit: '♣ club',
  },
  {
    f: 'jack-clubs',
    char: `the classic Jack of Clubs reimagined as a young muscular royal page-knight with athletic lean chiseled physique, shaggy brown hair, a green-and-gold fitted page tunic open at the chest revealing his sculpted torso, a small green feathered cap, holding a single short ornate sword pointing up, alert focused expression`,
    rank: 'J', suit: '♣ club',
  },
  {
    f: 'ace-clubs',
    char: `a single massive ornate black-and-gold CLUB clover-trefoil symbol filling the center of the card, decorated with intricate vine and leaf gold filigree. NO HUMAN CHARACTER. The clover is the entire focal point, ornamental, like a classic Ace of Clubs`,
    rank: 'A', suit: '♣ club',
  },

  // BACK
  {
    f: 'back',
    char: null,
    isBack: true,
  },
];

async function callApi({ prompt, refData }) {
  const parts = [];
  if (refData) {
    parts.push({ inlineData: { mimeType: 'image/png', data: refData.toString('base64') } });
  }
  parts.push({ text: prompt });

  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      contents: [{ parts }],
      generationConfig: { imageConfig: { aspectRatio: '3:4' } },
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API ${res.status}: ${err.slice(0, 300)}`);
  }

  const data = await res.json();
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imgPart) throw new Error('No image in response');

  return Buffer.from(imgPart.inlineData.data, 'base64');
}

async function generateMaster() {
  console.log('[master] king-spades (no reference, defines style)');
  const t0 = Date.now();
  const buf = await callApi({ prompt: MASTER.prompt });
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(MASTER_PATH, buf);
  console.log(`  ✓ ${(buf.length / 1024).toFixed(0)} KB / ${((Date.now() - t0) / 1000).toFixed(1)}s\n`);
}

async function generateCard(card, refData) {
  const prompt = card.isBack
    ? `${STYLE_LOCK} Generate the BACK of this playing card (NOT a front face, NO character, NO letter, NO number, NO suit symbol). Symmetric ornate design with a large central golden royal crown emblem on aged cream parchment, surrounded by intricate golden art-nouveau filigree pattern, holographic gold foil shimmer, decorative corner flourishes mirrored on all four corners, fully symmetric design that looks the same when rotated 180 degrees.`
    : `${STYLE_LOCK} Replace the character with: ${card.char}. ${CORNERS(card.rank, card.suit)}`;

  const t0 = Date.now();
  const buf = await callApi({ prompt, refData });
  const outPath = join(OUT_DIR, `${card.f}.png`);
  await writeFile(outPath, buf);
  return { size: buf.length, elapsed: Date.now() - t0 };
}

// --- Run ---

async function exists(p) {
  try { await access(p); return true; } catch { return false; }
}

const onlyMaster = process.argv.includes('--master-only');

if (!(await exists(MASTER_PATH)) || process.argv.includes('--regen-master')) {
  await generateMaster();
}

if (onlyMaster) {
  console.log('Master generated. Re-run without --master-only to generate the rest.');
  process.exit(0);
}

const refData = await readFile(MASTER_PATH);
console.log(`→ Generating ${CARDS.length} cards using ${MASTER_PATH} as style reference\n`);

let success = 0;
const failed = [];

for (let i = 0; i < CARDS.length; i++) {
  const card = CARDS[i];
  process.stdout.write(`[${i + 1}/${CARDS.length}] ${card.f.padEnd(18)} `);
  try {
    const { size, elapsed } = await generateCard(card, refData);
    console.log(`✓ ${(size / 1024).toFixed(0)} KB / ${(elapsed / 1000).toFixed(1)}s`);
    success++;
  } catch (e) {
    console.log(`✗ ${e.message.split('\n')[0]}`);
    failed.push(card.f);
  }
  if (i < CARDS.length - 1) {
    await new Promise((r) => setTimeout(r, 1200));
  }
}

console.log(`\n=== ${success}/${CARDS.length} succeeded ===`);
if (failed.length) {
  console.log(`Failed: ${failed.join(', ')}`);
  process.exit(1);
}
