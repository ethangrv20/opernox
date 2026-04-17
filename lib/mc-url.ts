/**
 * lib/mc-url.ts
 * Returns the current user's Mission Control URL dynamically.
 * Fetches the VPS tunnel_url from /api/client-vps (per-user, per-VPS).
 * Uses Authorization header with Supabase token from localStorage.
 * NO caching — always fetches fresh to avoid stale URL after auth state changes.
 */

import { getSupabaseToken } from './supabase';

export async function getMcUrl(): Promise<string> {
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
        return vps.tunnel_url;
      }
    }
  } catch {
    // Fall through to fallback
  }

  return process.env.NEXT_PUBLIC_MC_URL || 'http://localhost:3337';
}
