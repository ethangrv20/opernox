/**
 * lib/mc-url.ts
 * Returns the current user's Mission Control URL dynamically.
 * Fetches the VPS tunnel_url from /api/client-vps (per-user, per-VPS).
 * Uses Authorization header with Supabase token instead of cookies.
 */

import { getSupabaseToken } from './supabase';

let cachedMcUrl: string = '';

export async function getMcUrl(): Promise<string> {
  // Return cached value if available
  if (cachedMcUrl) return cachedMcUrl;

  try {
    // Get Supabase token from localStorage (frontend session)
    const token = await getSupabaseToken();
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    // Fetch the current user's VPS info
    const res = await fetch('/api/client-vps', {
      credentials: 'include',
      headers,
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
