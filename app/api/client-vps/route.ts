/**
 * GET /api/client-vps
 * Returns the current user's VPS from the vpses table
 * Requires authentication (session cookie)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Service role client for server-side use (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
  { auth: { persistSession: false } }
);

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get('sb-access-token')?.value;

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Get the user from the access token
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Fetch the user's VPS (should be only one per user)
  const { data: vps, error: vpsError } = await supabaseAdmin
    .from('vpses')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (vpsError || !vps) {
    return NextResponse.json({ error: 'No VPS found for this user' }, { status: 404 });
  }

  return NextResponse.json(vps);
}
