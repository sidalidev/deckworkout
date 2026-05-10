export const TIPS: string[] = [
  // From the user
  "Half reps in the bottom range fatigue the target muscle directly — they isolate it instead of letting other muscles take over.",
  "Muscle burns calories at rest. The more muscle you carry, the less you have to diet.",

  // Classics
  "The eccentric phase — the way down — causes most of the muscle damage that triggers growth. Slow the descent.",
  "Muscle grows during sleep, not during training. Skipping rest is skipping gains.",
  "Form beats weight. A clean push-up always wins over a sloppy one.",
  "Volume — total reps over the week — is the primary driver of hypertrophy.",
  "Compound moves like push-ups, squats and burpees hit more muscles per minute than any isolation exercise.",
  "Mind-muscle connection is real: focusing on the working muscle can boost activation by up to 22%.",
  "Bodyweight is enough for hypertrophy — as long as you keep progressing: more reps, slower tempo, harder variations.",
  "48 hours minimum rest per muscle group. Hit legs Monday, don't squat again until Wednesday.",
];

export function randomTip(): string {
  return TIPS[Math.floor(Math.random() * TIPS.length)];
}
