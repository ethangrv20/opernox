/**
 * GET /api/admin/vpses/[id]
 * Get VPS status including bootstrap log tail
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  const { data: vps, error } = await supabase
    .from('vpses')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !vps) {
    return NextResponse.json({ error: 'VPS not found' }, { status: 404 });
  }

  // Read bootstrap log if it exists
  let bootstrapLog = null;
  try {
    const fs = await import('fs');
    const logPath = `C:\\temp\\bootstrap-log-${id}.txt`;
    if (fs.existsSync(logPath)) {
      const content = fs.readFileSync(logPath, 'utf8');
      // Return last 50 lines
      const lines = content.split('\n').filter(Boolean).slice(-50);
      bootstrapLog = lines.join('\n');
    }
  } catch { /* log not accessible */ }

  return NextResponse.json({
    ...vps,
    bootstrapLog,
  });
}
