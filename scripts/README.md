# Card generation

## Setup (once)

Create `.env.local` at the project root with your Gemini API key:

```
GEMINI_API_KEY=your_key_here
```

The file is gitignored.

## Generate a card

```bash
npm run card -- <filename> "<prompt>"
```

Example:

```bash
npm run card -- king-spades "Heroic Greek warrior king inspired by Achilles..."
```

Output goes to `public/cards/<filename>.png`.

## Generate with style reference

To keep the same art style across all 17 cards, generate one master first, then pass it as reference:

```bash
npm run card -- queen-hearts "Same exact style and frame. Replace with Queen of Hearts holding a heart-shaped shield, golden flowing hair." public/cards/king-spades.png
```

## Naming convention

Faces (16):
- `ace-spades`, `ace-hearts`, `ace-diamonds`, `ace-clubs`
- `jack-*`, `queen-*`, `king-*` for each suit

Back (1):
- `back`

That's it — 17 images total.
