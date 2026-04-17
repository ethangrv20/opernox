/**
 * GET /api/client-vps
 * Returns the current user's VPS from the vpses table
 * Auth: reads Bearer token from Authorization header (set by frontend via getSupabaseToken)
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  // Get token from Authorization header (set by frontend)
  const authHeader = request.headers.get('Authorization');
  const accessToken = authHeader?.replace('Bearer ', '');

  if (!accessToken) {
    return NextResponse.json({ error: 'Unauthorized — no token provided' }, { status: 401 });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(accessToken);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized — invalid token' }, { status: 401 });
  }

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
