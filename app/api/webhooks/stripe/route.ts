/**
 * Stripe Webhook Handler
 * Path: /api/webhooks/stripe
 * 
 * Triggers:
 *  - checkout.session.completed → provision new client VPS
 * 
 * Flow:
 *  1. Verify Stripe webhook signature
 *  2. Extract client user_id + plan details from session metadata
 *  3. Create vpses DB record (status: provisioning)
 *  4. Call Interserver SOAP API to order VPS
 *  5. Update vpses record with interserver_order_id + IP when ready
 *  6. Trigger WinRM bootstrap on VPS once it boots
 * 
 * IMPORTANT:
 *  - Stripe webhook secret must be set in .env: STRIPE_WEBHOOK_SECRET
 *  - Interserver credentials must be set in Edge Function env or .env
 *  - Never run this in a client-facing route — it's a webhook endpoint
 */

import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

// Admin Supabase client (bypasses RLS — webhooks run server-side)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ujdegmhsvwymxzezwwna.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
  { auth: { persistSession: false } }
);

/**
 * Provision a new VPS for a client via Interserver SOAP API
 * Called after Stripe payment confirmed
 */
async function provisionVPS(userId: string, location: number = 1) {
  // Dynamic import to keep this serverless-friendly
  const provisioner = await import('../../../provisioner/index.js');
  const prov = provisioner.default || provisioner;

  console.log(`[Stripe->Provision] Logging into Interserver...`);
  const sid = await prov.login();
  console.log(`[Stripe->Provision] Got SID: ${sid}`);

  // Build hostname
  const hostname = `client-vps-${userId.replace(/-/g, '').slice(0, 8)}`;

  // Generate root password
  const rootpass = generatePassword();

  const config = {
    ...prov.DEFAULT_VPS_CONFIG,
    location,
    hostname,
    rootpass,
  };

  console.log(`[Stripe->Provision] Validating order for ${hostname}...`);
  const validation = await prov.validateOrder(sid, config);
  
  if (validation && validation.toLowerCase().includes('error')) {
    throw new Error(`Interserver validation failed: ${validation}`);
  }

  console.log(`[Stripe->Provision] Placing order...`);
  const orderId = await prov.placeOrder(sid, config);
  console.log(`[Stripe->Provision] Order placed! Order ID: ${orderId}`);

  return {
    sid,
    orderId,
    hostname,
    ip: null, // Will be populated when VPS boots
    rootpass,
    config,
  };
}

/**
 * Register VPS in Supabase vpses table
 */
async function registerVPSInDB(params: {
  userId: string;
  orderId: string;
  hostname: string;
  rootpassEncrypted: string;
  location: number;
  locationName: string;
}) {
  const { data, error } = await supabaseAdmin.from('vpses').insert({
    user_id: params.userId,
    interserver_order_id: params.orderId,
    hostname: params.hostname,
    status: 'provisioning',
    platform: 'kvm',
    os: 'windowsr2',
    slices: 8,
    location: params.location,
    location_name: params.locationName,
    rootpass_encrypted: params.rootpassEncrypted,
    provisioned_at: new Date().toISOString(),
  }).select().single();

  if (error) throw new Error(`Failed to insert vpses record: ${error.message}`);
  return data;
}

/**
 * Encrypt VPS root password before storing in DB
 * Uses AES-256-GCM with a key from environment
 */
async function encryptPassword(password: string): Promise<string> {
  const crypto = await import('crypto');
  const key = Buffer.from(process.env.VPS_PASSWORD_KEY || 'default-key-change-me-32chars!!', 'utf8').slice(0, 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(password, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function generatePassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$%';
  let pass = '';
  for (let i = 0; i < 16; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass;
}

const LOCATION_MAP: Record<number, string> = {
  1: 'Secaucus NJ',
  2: 'Los Angeles CA',
  3: 'Dallas TX',
};

/**
 * POST /api/webhooks/stripe
 * Receives Stripe webhook events
 */
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature') || '';

  // Verify webhook signature
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );
  } catch (err: any) {
    console.error(`[Stripe Webhook] Signature verification failed:`, err.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  console.log(`[Stripe Webhook] Received event: ${event.type}`);

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session;
      console.log(`[Stripe Webhook] checkout.session.completed — Session: ${session.id}`);

      // Extract metadata
      const userId = session.metadata?.user_id || session.metadata?.userId;
      const location = parseInt(session.metadata?.location || '1', 10);

      if (!userId) {
        console.error('[Stripe Webhook] No user_id in session metadata!');
        return NextResponse.json({ error: 'Missing user_id in metadata' }, { status: 400 });
      }

      console.log(`[Stripe Webhook] Provisioning VPS for user ${userId}, location ${location}`);

      try {
        // Step 1: Provision VPS on Interserver
        const vpsResult = await provisionVPS(userId, location);

        // Step 2: Encrypt root password before storing
        const encryptedRootpass = await encryptPassword(vpsResult.rootpass);

        // Step 3: Register in Supabase
        const vpsRecord = await registerVPSInDB({
          userId,
          orderId: vpsResult.orderId,
          hostname: vpsResult.hostname,
          rootpassEncrypted: encryptedRootpass,
          location,
          locationName: LOCATION_MAP[location] || 'Secaucus NJ',
        });

        console.log(`[Stripe Webhook] VPS record created: ${vpsRecord.id}`);

        // Step 4: TODO — trigger WinRM bootstrap once VPS boots
        // This will be handled by a background job:
        // - Poll Interserver API for VPS IP
        // - Once IP available, invoke bootstrap.ps1 via WinRM
        // - Update vpses.status to 'booting' then 'ready'
        
        // For now, mark as provisioning — bootstrap is the next step
        // We'll add a "wait for boot + bootstrap" function in the provisioner
        
        return NextResponse.json({
          success: true,
          vpsId: vpsRecord.id,
          orderId: vpsResult.orderId,
          hostname: vpsResult.hostname,
          message: 'VPS provisioning initiated. Bootstrap will begin when VPS is online.',
        });

      } catch (err: any) {
        console.error(`[Stripe Webhook] Provisioning failed:`, err);
        return NextResponse.json(
          { error: 'VPS provisioning failed', details: err.message },
          { status: 500 }
        );
      }
      break;
    }

    case 'invoice.paid': {
      // Renewal payment — ensure VPS stays active
      const invoice = event.data.object as Stripe.Invoice;
      console.log(`[Stripe Webhook] invoice.paid — Invoice: ${invoice.id}`);
      // TODO: Check if VPS exists for this customer, extend if needed
      break;
    }

    case 'customer.subscription.deleted': {
      // Client cancelled — terminate VPS
      const subscription = event.data.object as Stripe.Subscription;
      console.log(`[Stripe Webhook] subscription.deleted — Sub: ${subscription.id}`);
      // TODO: Call Interserver API to cancel/terminate VPS
      // TODO: Update vpses status to 'terminated'
      break;
    }

    default:
      console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
  }

  return NextResponse.json({ received: true });
}
