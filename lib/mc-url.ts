/**
 * lib/mc-url.ts
 * Returns the current user's Mission Control URL dynamically.
 * Fetches VPS IP from /api/client-vps (runtime, per-user).
 * Caches result for the session to avoid redundant API calls.
 */

let cachedMcUrl: string | null = null;

export async function getMcUrl(): Promise<string> {
  if (cachedMcUrl) return cachedMcUrl;

  try {
    const res = await fetch('/api/client-vps', { credentials: 'include' });
    if (res.ok) {
      const vps = await res.json();
      if (vps?.ip) {
        cachedMcUrl = `http://${vps.ip}:3337`;
        return cachedMcUrl;
      }
    }
  } catch {
    // VPS fetch failed — fall through to localhost
  }

  // Fallback for local dev or if no VPS yet
  return 'http://127.0.0.1:3337';
}

export function clearMcUrlCache() {
  cachedMcUrl = null;
}
