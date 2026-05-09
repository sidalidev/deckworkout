#!/usr/bin/env node
// One-off: re-generate the 3 spades figures with a stronger push-up framing.
// Uses an existing "good exercise" card (queen-diamonds = clean squat) as style
// reference so the new spades match the suit-based-exercise family stylistically.

import { writeFile, readFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = dirname(__dirname);
const OUT_DIR = join(ROOT, 'public', 'cards');
const STYLE_REF_PATH = join(OUT_DIR, 'queen-diamonds.png');

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error('Missing GEMINI_API_KEY.');
  process.exit(1);
}

const STYLE_LOCK = `Match the EXACT art style, palette, frame, border ornamentation, parchment background, lighting and corner indices treatment of the reference image. Same cel-shaded cartoon illustration, thick black outlines, flat saturated coloring, ornate golden filigree border with holographic foil shimmer, aged cream parchment center.`;

// New push-up framing strategy: low-angle close-up of the upper body
// performing the down-phase. This avoids the horizontal-body-in-vertical-frame
// problem that produced lunge/sprinter poses on the previous attempt.
const PUSHUP_FRAMING = `IMPORTANT POSE: the character is performing a PUSH-UP, viewed from a LOW SIDE-ANGLE, very close-up. The body is fully horizontal in plank position, arms bent at 90 degrees with biceps and triceps visibly flexed and pumped, chest hovering just inches above the ground. The composition shows the upper body and arms prominently filling the card vertically: head and shoulders in the upper third, arms bent and chest in the middle, hands flat on the ground at the bottom. This is NOT a lunge, NOT a sprinter pose, NOT a kneeling pose — it is unmistakably a horizontal plank-position push-up viewed from the side. Background: subtle warm cream gradient.`;

const CARDS = [
  {
    f: 'king-spades',
    rank: 'K',
    char: `the King of Spades performing a PUSH-UP at the bottom phase. He is a muscular royal king with a short trimmed dark beard, wears a tall black-and-gold royal crown with a polished black spade ♠ jewel firmly on his head (slightly tilted forward from the push-up motion but NOT falling off), shirtless showing his chiseled muscular chest pressed forward and tense biceps, short black-and-gold royal shorts with gold trim, golden bracers on his forearms. A short crimson royal cape is laid behind him on the ground. Strong determined expression looking forward.`,
  },
  {
    f: 'queen-spades',
    rank: 'Q',
    char: `the Queen of Spades performing a PUSH-UP at the bottom phase. Athletic muscular queen with long dark hair tied in a high ponytail flowing back, a tall black-and-gold royal crown with a polished black spade ♠ jewel firmly on her head, sleeveless black-and-purple royal athletic top showing her sculpted toned shoulders and biceps flexing under the push-up, dark royal shorts with gold trim, golden bracers. Strong toned arms bent at 90 degrees. Fierce focused expression looking forward.`,
  },
  {
    f: 'jack-spades',
    rank: 'J',
    char: `the Jack of Spades performing a PUSH-UP at the bottom phase. Young athletic muscular royal page with short dark hair, a small black-and-silver feathered cap with a tiny ♠ spade insignia, shirtless showing a chiseled lean torso pressed forward, a black-and-silver royal sash crossing his chest, dark page shorts with silver trim, leather bracers. Lean arms bent at 90 degrees with visible muscle definition. Confident smirk on his young face.`,
  },
];

const CORNERS = (rank) =>
  `Update corner indices: large ♠ spade pip and bold '${rank}' letter in top-left corner, mirrored ♠ spade pip and '${rank}' rotated 180 degrees in bottom-right corner.`;

async function callApi({ prompt, refData }) {
  const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': API_KEY },
    body: JSON.stringify({
      contents: [{
        parts: [
          { inlineData: { mimeType: 'image/png', data: refData.toString('base64') } },
          { text: prompt },
        ],
      }],
      generationConfig: { imageConfig: { aspectRatio: '3:4' } },
    }),
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const imgPart = data.candidates?.[0]?.content?.parts?.find((p) => p.inlineData?.data);
  if (!imgPart) throw new Error('No image in response');
  return Buffer.from(imgPart.inlineData.data, 'base64');
}

await mkdir(OUT_DIR, { recursive: true });
const refData = await readFile(STYLE_REF_PATH);
console.log(`→ Re-generating 3 spades cards using ${STYLE_REF_PATH} as style reference\n`);

for (let i = 0; i < CARDS.length; i++) {
  const card = CARDS[i];
  const prompt = `${STYLE_LOCK} Replace the character with: ${card.char}. ${PUSHUP_FRAMING} ${CORNERS(card.rank)}`;
  process.stdout.write(`[${i + 1}/3] ${card.f.padEnd(14)} `);
  const t0 = Date.now();
  try {
    const buf = await callApi({ prompt, refData });
    await writeFile(join(OUT_DIR, `${card.f}.png`), buf);
    console.log(`✓ ${(buf.length / 1024).toFixed(0)} KB / ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  } catch (e) {
    console.log(`✗ ${e.message.split('\n')[0]}`);
  }
  if (i < CARDS.length - 1) await new Promise((r) => setTimeout(r, 1200));
}
console.log('\nDone.');
