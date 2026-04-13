/**
 * Stripe Webhook Handler — STUB
 * Stripe is not used for payments. Direct wire transfers only.
 * This endpoint exists as a placeholder and returns 200 OK.
 */
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  return NextResponse.json({ received: true, note: 'Stripe not used — wire transfers only' });
}
