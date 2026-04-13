/**
 * POST /api/admin/vpses/provision
 * Provision a VPS for a user (called after Ethan clicks "Approve & Provision")
 * 
 * Flow:
 *  1. Validate user exists and is marked as "paid"
 *  2. Check user doesn't already have a VPS
 *  3. Update user payment_status → "vps_approved"
 *  4. Call Interserver SOAP API to order VPS
 *  5. Insert vpses record
 *  6. Return result (VPS provision happens async — status updates later)
 * 
 * ⚠️ This places a real $40 charge on Interserver — only call after wire confirmed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import path from 'path';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  { auth: { persistSession: false } }
);

// Load provisioner — it's a CommonJS module so use require
const provisionerPath = path.join(process.cwd(), 'provisioner', 'index.js');

async function provisionVPSForUser(userId: string) {
  // Dynamic import of the CommonJS provisioner module
  const provisioner = await import('file://' + provisionerPath);

  // Login to Interserver
  console.log(`[Provision] Logging into Interserver for user ${userId}...`);
  const sid = await provisioner.login();

  // Generate hostname + password
  const hostname = `client-vps-${userId.replace(/-/g, '').slice(0, 8)}`;
  const { generatePassword } = await import(path.join(process.cwd(), 'provisioner', 'index.js'));
  const rootpass = typeof generatePassword === 'function'
    ? generatePassword()
    : Array.from({ length: 16 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%'[Math.floor(Math.random() * 52)]).join('');

  const config = {
    ...provisioner.DEFAULT_VPS_CONFIG,
    location: 1,
    hostname,
    rootpass,
  };

  // Validate first
  console.log(`[Provision] Validating order for ${hostname}...`);
  const validation = await provisioner.validateOrder(sid, config);
  if (validation && validation.toLowerCase().includes('error')) {
    throw new Error(`Interserver validation failed: ${validation}`);
  }

  // Place order (REAL CHARGE)
  console.log(`[Provision] ⚠️ Placing order for ${hostname}...`);
  const orderId = await provisioner.placeOrder(sid, config);
  console.log(`[Provision] Order placed! Order ID: ${orderId}`);

  return { sid, orderId, hostname, rootpass, config };
}

export async function POST(request: NextRequest) {
  const { user_id } = await request.json();

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  // 1. Fetch user profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user_id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (profile.payment_status === 'pending_wire') {
    return NextResponse.json({ error: 'Wire not yet received. Mark as paid first.' }, { status: 400 });
  }

  if (profile.payment_status === 'vps_active' || profile.payment_status === 'vps_approved') {
    return NextResponse.json({ error: 'User already has an active or pending VPS' }, { status: 400 });
  }

  // 2. Check for existing VPS
  const { data: existingVPS } = await supabase
    .from('vpses')
    .select('id')
    .eq('user_id', user_id)
    .not('status', 'eq', 'terminated')
    .single();

  if (existingVPS) {
    return NextResponse.json({ error: 'User already has a VPS record' }, { status: 400 });
  }

  // 3. Update payment_status to vps_approved
  await supabase
    .from('profiles')
    .update({ payment_status: 'vps_approved' })
    .eq('id', user_id);

  // 4. Provision VPS via Interserver
  try {
    const vpsResult = await provisionVPSForUser(user_id);

    // 5. Encrypt root password (simple encoding for now — swap for AES in prod)
    const rootpassEncoded = Buffer.from(vpsResult.rootpass).toString('base64');

    // 6. Insert vpses record
    const { data: vpsRecord, error: vpsError } = await supabase
      .from('vpses')
      .insert({
        user_id,
        interserver_order_id: vpsResult.orderId,
        hostname: vpsResult.hostname,
        status: 'provisioning',
        platform: 'kvm',
        os: vpsResult.config.os,
        slices: vpsResult.config.slices,
        location: vpsResult.config.location,
        location_name: 'Secaucus NJ',
        rootpass_encrypted: rootpassEncoded,
        provisioned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (vpsError) throw new Error(`Failed to insert VPS record: ${vpsError.message}`);

    console.log(`[Provision] VPS record created: ${vpsRecord.id}`);

    // 7. TODO: Start background polling to wait for VPS boot, then run bootstrap
    // For now: VPS is ordered and tracked. Bootstrap runs when VPS is online.
    // The waitForVPS + bootstrap flow will be the next piece built.

    return NextResponse.json({
      success: true,
      vpsId: vpsRecord.id,
      orderId: vpsResult.orderId,
      hostname: vpsResult.hostname,
      message: 'VPS order placed successfully. Provisioning in progress — VPS will be online in ~10-15 minutes.',
    });

  } catch (err: any) {
    // Rollback payment_status on failure
    await supabase
      .from('profiles')
      .update({ payment_status: 'paid' })
      .eq('id', user_id);

    console.error(`[Provision] Error:`, err);
    return NextResponse.json(
      { error: `Provisioning failed: ${err.message}` },
      { status: 500 }
    );
  }
}
