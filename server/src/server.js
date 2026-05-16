import express from 'express';
import webpush from 'web-push';
import { promises as fs } from 'node:fs';
import path from 'node:path';

const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = process.env.DATA_DIR || '/app/data';
const SUBS_FILE = path.join(DATA_DIR, 'subscriptions.json');

const VAPID_PUBLIC = process.env.VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

if (!VAPID_PUBLIC || !VAPID_PRIVATE) {
  console.error('Missing VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY');
  process.exit(1);
}

webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);

// ---------- Storage ----------

async function loadSubs() {
  try {
    return JSON.parse(await fs.readFile(SUBS_FILE, 'utf-8'));
  } catch {
    return {};
  }
}

async function saveSubs(subs) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SUBS_FILE, JSON.stringify(subs, null, 2));
}

// ---------- App ----------

const app = express();
app.use(express.json({ limit: '32kb' }));

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/vapid-public-key', (_req, res) => res.json({ key: VAPID_PUBLIC }));

app.post('/subscribe', async (req, res) => {
  const { subscription, deviceId } = req.body || {};
  if (!subscription?.endpoint) {
    return res.status(400).json({ error: 'invalid subscription' });
  }
  const key = deviceId || subscription.endpoint;
  const subs = await loadSubs();
  subs[key] = {
    subscription,
    state: subs[key]?.state ?? 'idle',
    completed: subs[key]?.completed ?? 0,
    stateUpdatedAt: subs[key]?.stateUpdatedAt ?? Date.now(),
    pingedFor: subs[key]?.pingedFor,
    subscribedAt: subs[key]?.subscribedAt ?? Date.now(),
  };
  await saveSubs(subs);
  res.json({ ok: true });
});

app.post('/unsubscribe', async (req, res) => {
  const { deviceId, endpoint } = req.body || {};
  const key = deviceId || endpoint;
  if (!key) return res.status(400).json({ error: 'no key' });
  const subs = await loadSubs();
  delete subs[key];
  await saveSubs(subs);
  res.json({ ok: true });
});

app.post('/workout-state', async (req, res) => {
  const { deviceId, state, completed } = req.body || {};
  if (!deviceId || !state) return res.status(400).json({ error: 'missing fields' });
  const subs = await loadSubs();
  const entry = subs[deviceId];
  if (entry) {
    entry.state = state; // 'in-progress' | 'cleared'
    entry.completed = Number.isFinite(completed) ? completed : entry.completed;
    entry.stateUpdatedAt = Date.now();
    if (state !== 'in-progress') entry.pingedFor = undefined;
    await saveSubs(subs);
  }
  res.json({ ok: true });
});

// ---------- Push sender ----------

async function sendTo(subscription, payload) {
  try {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
    return 'ok';
  } catch (e) {
    const code = e.statusCode;
    if (code === 404 || code === 410) return 'gone';
    console.error('push error', code, String(e.body || '').slice(0, 120));
    return 'error';
  }
}

async function sendDailyReminder() {
  const subs = await loadSubs();
  const payload = {
    title: 'Deck Workout 🃏',
    body: 'Time to shuffle the deck and crush 52 cards.',
    url: '/?action=start',
    tag: 'daily-reminder',
  };
  let removed = 0;
  let sent = 0;
  for (const [key, entry] of Object.entries(subs)) {
    const r = await sendTo(entry.subscription, payload);
    if (r === 'gone') {
      delete subs[key];
      removed++;
    } else if (r === 'ok') {
      sent++;
    }
  }
  if (removed > 0) await saveSubs(subs);
  console.log(`[daily] sent=${sent} removed=${removed} total=${Object.keys(subs).length}`);
}

async function checkInProgress() {
  const subs = await loadSubs();
  const now = Date.now();
  const cutoff = 2 * 60 * 60 * 1000; // 2h
  let pinged = 0;
  for (const entry of Object.values(subs)) {
    if (entry.state !== 'in-progress') continue;
    if (now - entry.stateUpdatedAt < cutoff) continue;
    // Only ping once per in-progress session
    if (entry.pingedFor === entry.stateUpdatedAt) continue;
    const left = 52 - (entry.completed || 0);
    const r = await sendTo(entry.subscription, {
      title: 'Finish your workout 💪',
      body: `You have ${left} card${left === 1 ? '' : 's'} left.`,
      url: '/?action=resume',
      tag: 'in-progress-reminder',
    });
    if (r === 'ok') {
      entry.pingedFor = entry.stateUpdatedAt;
      pinged++;
    }
  }
  if (pinged > 0) await saveSubs(subs);
  if (pinged > 0) console.log(`[in-progress] pinged=${pinged}`);
}

// ---------- Schedulers ----------

function scheduleDaily(hour, minute, fn) {
  function next() {
    const now = new Date();
    const target = new Date();
    target.setUTCHours(hour, minute, 0, 0);
    if (target.getTime() <= now.getTime()) target.setUTCDate(target.getUTCDate() + 1);
    const delay = target.getTime() - now.getTime();
    console.log(`[daily] next reminder in ${Math.round(delay / 60000)} min`);
    setTimeout(async () => {
      try { await fn(); } catch (e) { console.error('[daily] error', e); }
      next();
    }, delay);
  }
  next();
}

scheduleDaily(18, 0, sendDailyReminder); // 18:00 UTC
setInterval(() => {
  checkInProgress().catch((e) => console.error('[in-progress] error', e));
}, 30 * 60 * 1000); // every 30 min

app.listen(PORT, () => {
  console.log(`Deckworkout API listening on :${PORT}, data=${DATA_DIR}`);
});
