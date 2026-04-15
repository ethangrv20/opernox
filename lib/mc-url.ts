/**
 * lib/mc-url.ts
 * Returns the current user's Mission Control URL dynamically.
 * Fetches the VPS tunnel_url from /api/client-vps (per-user, per-VPS).
 */

let cachedMcUrl: string = '';

export async function getMcUrl(): Promise<string> {
  // Return cached value if available
  if (cachedMcUrl) return cachedMcUrl;

  try {
    // Fetch the current user's VPS info
    const res = await fetch('/api/client-vps', {
      credentials: 'include',
      cache: 'no-store',
    });

    if (res.ok) {
      const vps = await res.json();
      if (vps && vps.tunnel_url) {
        cachedMcUrl = vps.tunnel_url;
        return cachedMcUrl;
      }
    }
  } catch {
    // Fall through to fallback
  }

  cachedMcUrl = process.env.NEXT_PUBLIC_MC_URL || 'http://localhost:3337';
  return cachedMcUrl;
}

export function clearMcUrlCache() {
  cachedMcUrl = '';
}
