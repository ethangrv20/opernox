/**
 * PATCH /api/admin/profiles/[id]
 * Update payment_status and/or wire_notes for a user
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const { payment_status, wire_notes } = body;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

  const updates: Record<string, unknown> = {};
  if (payment_status !== undefined) {
    const valid = ['pending_wire', 'paid', 'vps_approved', 'vps_active'];
    if (!valid.includes(payment_status)) {
      return NextResponse.json({ error: 'Invalid payment_status' }, { status: 400 });
    }
    updates.payment_status = payment_status;
  }
  if (wire_notes !== undefined) {
    updates.wire_notes = wire_notes;
  }

  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
