/**
 * lib/mc-url.ts
 * Returns the current user's Mission Control URL dynamically.
 * Fetches VPS IP from /api/client-vps (runtime, per-user).
 * Caches result for the session to avoid redundant API calls.
 */

let cachedMcUrl: string | null = null;

export async function getMcUrl(): Promise<string> {
  // Skip cache on every call to avoid stale values persisting across page loads
  // Return tunnel URL directly — bypass all DB lookups which fail in production
  return process.env.NEXT_PUBLIC_MC_URL || 'https://exhibition-speaks-lucia-yet.trycloudflare.com';
}

export function clearMcUrlCache() {
  cachedMcUrl = null;
}
