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

const STYLE_BASE = `Classic playing card design crossing traditional royal court characters with athletic muscular bodies actively performing a workout exercise. Cel-shaded cartoon illustration with thick black outlines, flat saturated coloring, painterly highlights, hybrid Zelda Wind Waker / Age of Empires Online / Hearthstone art style. Aged cream parchment card background, ornate golden art-nouveau filigree border with holographic foil shimmer. Vertical 5:7 card composition, the character fully visible inside the frame mid-exercise, ultra clean linework, no extra text or numbers other than the corner index letter.`;

const STYLE_LOCK = `Match the EXACT art style, palette, frame, border ornamentation, parchment background, lighting, character rendering and corner indices treatment of the reference image. Same cel-shaded cartoon illustration, thick black outlines, flat saturated coloring, ornate golden filigree border with holographic foil shimmer, aged cream parchment center. The figure is fully inside the card frame, mid-exercise.`;

const CORNERS = (rank, suit) =>
  `Update corner indices: large ${suit} pip and bold '${rank}' letter in top-left corner, mirrored ${suit} pip and '${rank}' rotated 180 degrees in bottom-right corner.`;

// Suit → exercise mapping (must match src/lib/deck.ts)
//   ♠ Spades   → Push-ups
//   ♥ Hearts   → Sit-ups
//   ♦ Diamonds → Squats
//   ♣ Clubs    → Burpees

// --- Card definitions ---

// Master must be the first generated (no reference yet)
// King of Spades doing a push-up — sets the style for everyone else.
const MASTER = {
  f: 'king-spades',
  prompt: `${STYLE_BASE} The character is the classic King of Spades reimagined as a muscular royal king performing a PUSH-UP. He is in a clean push-up position seen from a 3/4 side angle: body straight as a plank, arms bent at 90 degrees with biceps and triceps flexed, chest hovering just above the ground, gaze forward and determined. He is shirtless showing a chiseled muscular torso with defined chest and abs, wears a tall black-and-gold royal crown with a large polished black spade ♠ jewel at the front (crown firmly on his head, NOT falling), short black-and-gold royal shorts/loincloth with gold trim, golden bracers on his forearms, and a short trimmed dark beard. A short crimson royal cape is laid behind him on the ground. Background: subtle warm cream gradient suggesting a regal training hall, no specific scenery. ${CORNERS('K', '♠ spade')}`,
};

const CARDS = [
  // ============================================================
  // ♠ SPADES → PUSH-UPS (push-up / plank position)
  // ============================================================
  {
    f: 'queen-spades',
    char: `the Queen of Spades performing a PUSH-UP, in a clean push-up position seen from a 3/4 side angle, body straight as a plank, arms bent with toned biceps flexed, chest hovering above the ground, head up with a fierce focused expression. She has long dark hair tied back in a high ponytail, wears a tall black-and-gold royal crown with a polished black spade ♠ jewel firmly on her head, a sleeveless black-and-purple royal athletic top showing her sculpted shoulders and arms, dark royal shorts with gold trim, golden bracers. Strong toned figure`,
    rank: 'Q', suit: '♠ spade',
  },
  {
    f: 'jack-spades',
    char: `the Jack of Spades performing a PUSH-UP, in a dynamic mid push-up position seen from a 3/4 side angle, arms bent at 90 degrees, lean athletic body straight as a plank, chest just above the ground, smirking confidently. Young muscular royal page with short dark hair, a small black-and-silver feathered cap with a tiny ♠ spade insignia, shirtless showing a chiseled lean torso, a black-and-silver royal sash crossing his chest, dark page shorts with silver trim, leather bracers`,
    rank: 'J', suit: '♠ spade',
  },
  {
    f: 'ace-spades',
    char: `a single massive ornate black-and-silver SPADE ♠ symbol filling the center of the card, intricately decorated with engraved gold filigree and royal flourishes, glowing softly. NO HUMAN CHARACTER. The spade is the entire focal point, ornamental, like a classic Ace of Spades`,
    rank: 'A', suit: '♠ spade',
  },

  // ============================================================
  // ♥ HEARTS → SIT-UPS (mid-crunch on the back, knees bent)
  // ============================================================
  {
    f: 'king-hearts',
    char: `the King of Hearts performing a SIT-UP, lying on his back on the ground with knees bent and feet flat, torso lifted up at 45 degrees in a mid-crunch motion, abs visibly contracted, hands behind his head with elbows wide, looking forward with a determined warm expression. Muscular royal king with full white beard, a tall red-and-gold royal crown with a heart-shaped ruby ♥ jewel firmly on his head (NOT falling), shirtless showing a defined muscular chest and abs with a golden necklace bearing a heart pendant, red-and-gold royal shorts with gold trim, golden bracers. A crimson royal cape is laid on the ground beneath him. Side view 3/4 angle showing the full sit-up position`,
    rank: 'K', suit: '♥ heart',
  },
  {
    f: 'queen-hearts',
    char: `the Queen of Hearts performing a SIT-UP, lying on her back on the ground with knees bent and feet flat, torso lifted up at 45 degrees in a mid-crunch motion, toned abs contracted, hands crossed over her chest, kind focused smile. Beautiful muscular royal queen with long flowing red-orange hair, a tall red-and-gold royal crown with a heart-shaped ruby ♥ jewel firmly on her head, an elegant sleeveless crimson-and-gold royal athletic top showing her toned shoulders and arms, red royal shorts with gold trim. Side view 3/4 angle showing the full sit-up position`,
    rank: 'Q', suit: '♥ heart',
  },
  {
    f: 'jack-hearts',
    char: `the Jack of Hearts performing a SIT-UP, lying on his back with knees bent and feet flat, torso lifted up at 45 degrees in a mid-crunch motion, lean athletic abs visible, hands behind his head, charming confident smile. Young muscular royal page with chestnut wavy hair, a small red-and-gold feathered cap with a tiny ♥ heart insignia, shirtless showing a chiseled lean torso, a red-and-gold royal sash crossing his chest, red page shorts with gold trim. Side view 3/4 angle showing the full sit-up position`,
    rank: 'J', suit: '♥ heart',
  },
  {
    f: 'ace-hearts',
    char: `a single massive ornate red-and-gold HEART ♥ symbol filling the center of the card, intricately decorated with engraved gold filigree, radiating warm golden light. NO HUMAN CHARACTER. The heart is the entire focal point, ornamental, like a classic Ace of Hearts`,
    rank: 'A', suit: '♥ heart',
  },

  // ============================================================
  // ♦ DIAMONDS → SQUATS (deep squat, thighs parallel)
  // ============================================================
  {
    f: 'king-diamonds',
    char: `the King of Diamonds performing a SQUAT, in a deep squat position with thighs parallel to the ground, knees bent, arms extended forward at shoulder height for balance, back straight, looking forward with a sharp regal expression. Muscular royal king with well-trimmed dark beard, a tall purple-and-gold royal crown with a large faceted red diamond ♦ jewel at the front firmly on his head, shirtless showing a defined muscular chest and abs, rich purple-and-gold royal shorts with diamond pattern trim, golden bracers. A short purple cape is draped behind. Frontal view showing the full squat position`,
    rank: 'K', suit: '♦ diamond',
  },
  {
    f: 'queen-diamonds',
    char: `the Queen of Diamonds performing a SQUAT, in a deep squat position with thighs parallel to the ground, knees bent, arms extended forward at shoulder height for balance, refined poised expression. Elegant muscular royal queen with platinum-blonde hair styled high, a tall purple-and-gold royal crown with a large faceted red diamond ♦ jewel firmly on her head, a sleeveless silver-and-purple royal athletic top showing her toned shoulders, sparkling silver royal shorts with diamond-pattern trim revealing toned thighs and calves. Frontal view showing the full squat position`,
    rank: 'Q', suit: '♦ diamond',
  },
  {
    f: 'jack-diamonds',
    char: `the Jack of Diamonds performing a SQUAT, in a deep squat position with thighs parallel to the ground, knees bent, arms forward for balance, mischievous confident smile. Young muscular royal page with blond wavy hair, a small purple-and-gold feathered cap with a tiny ♦ diamond insignia, shirtless showing a chiseled lean torso, a purple-and-gold royal sash crossing his chest, purple page shorts with gold trim. Frontal view showing the full squat position`,
    rank: 'J', suit: '♦ diamond',
  },
  {
    f: 'ace-diamonds',
    char: `a single massive ornate red-and-gold DIAMOND ♦ gemstone symbol filling the center of the card, multi-faceted, sparkling brilliantly with intricate gold filigree around it. NO HUMAN CHARACTER. The diamond is the entire focal point, ornamental, like a classic Ace of Diamonds`,
    rank: 'A', suit: '♦ diamond',
  },

  // ============================================================
  // ♣ CLUBS → BURPEES (explosive jump phase, arms up)
  // ============================================================
  {
    f: 'king-clubs',
    char: `the King of Clubs performing a BURPEE in the explosive JUMP UP phase, both feet just lifted off the ground, knees slightly bent, arms raised straight overhead with hands together in a powerful upward stretch, body fully extended, intense focused expression. Muscular royal king with full thick brown beard, a tall green-and-gold royal crown with a black trefoil clover ♣ jewel at the front firmly on his head, shirtless showing a defined muscular chest and abs, forest-green-and-gold royal shorts with leaf-pattern trim, golden bracers with leaf motifs. A short green cape flutters behind from the jump motion. Frontal 3/4 view`,
    rank: 'K', suit: '♣ club',
  },
  {
    f: 'queen-clubs',
    char: `the Queen of Clubs performing a BURPEE in the explosive JUMP UP phase, both feet lifted off the ground, knees slightly bent, arms raised overhead with hands together, body extended, calm focused expression. Powerful muscular royal queen with long dark-green-tinted braided hair flowing in the air, a tall green-and-gold royal crown with a black clover ♣ jewel firmly on her head, a sleeveless forest-green-and-gold royal athletic top with leaf-shaped golden trim showing her toned shoulders and arms, green royal shorts with gold leaf trim. Frontal 3/4 view`,
    rank: 'Q', suit: '♣ club',
  },
  {
    f: 'jack-clubs',
    char: `the Jack of Clubs performing a BURPEE in the explosive JUMP UP phase, both feet just lifted off the ground, arms raised overhead with hands together, lean athletic body extended, alert focused expression. Young muscular royal page with shaggy brown hair tossed by the jump, a small green-and-gold feathered cap with a tiny ♣ clover insignia, shirtless showing a chiseled lean torso, a green-and-gold royal sash crossing his chest, green page shorts with gold leaf trim. Frontal 3/4 view`,
    rank: 'J', suit: '♣ club',
  },
  {
    f: 'ace-clubs',
    char: `a single massive ornate black-and-gold CLUB ♣ clover-trefoil symbol filling the center of the card, decorated with intricate vine and leaf gold filigree. NO HUMAN CHARACTER. The clover is the entire focal point, ornamental, like a classic Ace of Clubs`,
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
