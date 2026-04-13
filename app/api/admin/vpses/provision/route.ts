/**
 * POST /api/admin/vpses/provision
 * Provision a VPS for a user (called after Ethan clicks "Approve & Provision")
 *
 * ⚠️ This places a real $40 charge on Interserver — only call after wire confirmed
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import https from 'https';

const INTERSERVER_CREDS = {
  username: 'ethangrv@gmail.com',
  password: '2dcebtqS!',
};
const SOAP_URL = 'https://my.interserver.net/api.php?wsdl';
const DEFAULT_CONFIG = {
  os: 'windowsr2',
  slices: 8,
  platform: 'kvm',
  location: 1,
  version: 1,
  period: 1,
  coupon: '',
  ipv6only: false,
};

// ── SOAP Helpers ──────────────────────────────────────────────────────────────

function soapRequest(method: string, params: Record<string, string | number | boolean>) {
  const paramLines = Object.entries(params)
    .map(([k, v]) => `<${k}>${String(v)}</${k}>`)
    .join('\n');

  const xml = `<?xml version="1.0" encoding="ISO-8859-1"?>
<SOAP-ENV:Envelope SOAP-ENV:encodingStyle="http://schemas.xmlsoap.org/soap/encoding/"
  xmlns:SOAP-ENV="http://schemas.xmlsoap.org/soap/envelope/"
  xmlns:xsd="http://www.w3.org/2001/XMLSchema"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xmlns:SOAP-ENC="http://schemas.xmlsoap.org/soap/encoding/">
  <SOAP-ENV:Body><ns1:${method} xmlns:ns1="urn:myapi">\n${paramLines}\n</ns1:${method}></SOAP-ENV:Body>
</SOAP-ENV:Envelope>`;

  return new Promise<string>((resolve, reject) => {
    const url = new URL(SOAP_URL);
    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=ISO-8859-1',
        'Content-Length': Buffer.byteLength(xml),
        'SOAPAction': `urn:myapi#${method}`,
      },
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', c => data += c);
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
    req.write(xml);
    req.end();
  });
}

function extractValue(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<${tag}[^>]*>([^<]*)</${tag}>`));
  return m ? m[1] : null;
}

async function interServerLogin(): Promise<string> {
  const res = await soapRequest('api_login', {
    username: INTERSERVER_CREDS.username,
    password: INTERSERVER_CREDS.password,
  });
  const sid = extractValue(res, 'return');
  if (!sid) throw new Error('Interserver login failed');
  return sid;
}

async function validateOrder(sid: string, config: Record<string, unknown>): Promise<string | null> {
  const res = await soapRequest('api_api_validate_buy_vps', {
    sid,
    os: config.os as string,
    slices: config.slices as number,
    platform: config.platform as string,
    controlpanel: '',
    period: config.period as number,
    location: config.location as number,
    version: config.version as number,
    hostname: config.hostname as string,
    coupon: '',
    ipv6only: config.ipv6only ? 1 : 0,
  });
  return extractValue(res, 'return');
}

async function placeOrder(sid: string, config: Record<string, unknown>): Promise<string> {
  const res = await soapRequest('api_api_buy_vps', {
    sid,
    os: config.os as string,
    slices: config.slices as number,
    platform: config.platform as string,
    controlpanel: '',
    period: config.period as number,
    location: config.location as number,
    version: config.version as number,
    hostname: config.hostname as string,
    coupon: '',
    ipv6only: config.ipv6only ? 1 : 0,
    rootpass: config.rootpass as string,
  });
  const orderId = extractValue(res, 'return');
  if (!orderId) throw new Error('No order ID returned from Interserver');
  return orderId;
}

function genPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  return Array.from({ length: 16 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

// ── Main Handler ───────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  const { user_id } = await request.json();

  if (!user_id) {
    return NextResponse.json({ error: 'user_id required' }, { status: 400 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
  );

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
    return NextResponse.json({ error: 'Wire not yet received.' }, { status: 400 });
  }

  if (profile.payment_status === 'vps_active' || profile.payment_status === 'vps_approved') {
    return NextResponse.json({ error: 'User already has an active or pending VPS.' }, { status: 400 });
  }

  // 2. Check for existing VPS
  const { data: existingVPS } = await supabase
    .from('vpses')
    .select('id')
    .eq('user_id', user_id)
    .not('status', 'eq', 'terminated')
    .single();

  if (existingVPS) {
    return NextResponse.json({ error: 'User already has a VPS record.' }, { status: 400 });
  }

  // 3. Update payment_status → vps_approved
  await supabase
    .from('profiles')
    .update({ payment_status: 'vps_approved' })
    .eq('id', user_id);

  // 4. Provision via Interserver
  try {
    const sid = await interServerLogin();
    const hostname = `client-vps-${user_id.replace(/-/g, '').slice(0, 8)}`;
    const rootpass = genPassword();

    const config = { ...DEFAULT_CONFIG, hostname, rootpass };

    console.log(`[Provision] Validating order for ${hostname}...`);
    const validation = await validateOrder(sid, config);
    if (validation && validation.toLowerCase().includes('error')) {
      throw new Error(`Validation failed: ${validation}`);
    }

    console.log(`[Provision] ⚠️ Placing order for ${hostname}...`);
    const orderId = await placeOrder(sid, config);
    console.log(`[Provision] Order placed! Order ID: ${orderId}`);

    // 5. Insert vpses record
    const { data: vpsRecord, error: vpsError } = await supabase
      .from('vpses')
      .insert({
        user_id,
        interserver_order_id: orderId,
        hostname,
        status: 'provisioning',
        platform: 'kvm',
        os: 'windowsr2',
        slices: 8,
        location: 1,
        location_name: 'Secaucus NJ',
        rootpass_encrypted: Buffer.from(rootpass).toString('base64'),
        provisioned_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (vpsError) throw new Error(`DB insert failed: ${vpsError.message}`);

    return NextResponse.json({
      success: true,
      vpsId: vpsRecord.id,
      orderId,
      hostname,
      message: 'VPS order placed. Boot in ~10-15 min. Bootstrap runs automatically once online.',
    });

  } catch (err: any) {
    // Rollback
    await supabase.from('profiles').update({ payment_status: 'paid' }).eq('id', user_id);
    console.error('[Provision] Error:', err);
    return NextResponse.json({ error: `Provisioning failed: ${err.message}` }, { status: 500 });
  }
}
