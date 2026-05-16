import { useCallback, useEffect, useState } from 'react';

const VAPID_PUBLIC =
  'BJAWm6tVVbB02TmAwVpFzhn7iomtdVVE84n54RMcysG395M1nmkKotQpNz_iRnWOJfFkW8hxnKOQXghlXr6KQyg';
const API_BASE = '/api';
const DEVICE_KEY = 'deckworkout:device-id:v1';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64: string): Uint8Array<ArrayBuffer> {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(b64);
  const buf = new ArrayBuffer(raw.length);
  const out = new Uint8Array(buf);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return 'anonymous-' + Math.random().toString(36).slice(2);
  }
}

function isSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

export function usePush() {
  const [permission, setPermission] = useState<PushPermission>(() => {
    if (!isSupported()) return 'unsupported';
    return Notification.permission as PushPermission;
  });
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  // Check current subscription on mount
  useEffect(() => {
    if (!isSupported()) return;
    let cancelled = false;
    (async () => {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (!cancelled) setSubscribed(!!sub);
    })().catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const enable = useCallback(async () => {
    if (!isSupported()) return false;
    setLoading(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result as PushPermission);
      if (result !== 'granted') return false;

      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      if (!sub) {
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
        });
      }

      const res = await fetch(`${API_BASE}/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub.toJSON(), deviceId: getDeviceId() }),
      });
      if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);
      setSubscribed(true);
      return true;
    } catch (e) {
      console.error('[push] enable failed', e);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const disable = useCallback(async () => {
    if (!isSupported()) return;
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) await sub.unsubscribe();
      await fetch(`${API_BASE}/unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: getDeviceId() }),
      }).catch(() => {});
      setSubscribed(false);
    } finally {
      setLoading(false);
    }
  }, []);

  return { permission, subscribed, loading, enable, disable, supported: isSupported() };
}

export function reportWorkoutState(state: 'in-progress' | 'cleared', completed = 0): void {
  if (!isSupported()) return;
  void fetch(`${API_BASE}/workout-state`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ deviceId: getDeviceId(), state, completed }),
    keepalive: true,
  }).catch(() => {});
}
