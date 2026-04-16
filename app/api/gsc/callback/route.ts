import { NextRequest, NextResponse } from 'next/server';

// Google OAuth callback — receives redirect from Google after user consent
// Location: ${origin}/api/gsc/callback?code=xxx&state=xxx
//
// Token exchange is done on the MC SERVER, not here (Vercel serverless can't
// reliably reach oauth2.googleapis.com). This handler just redirects the request
// to the MC server which does the actual token exchange.
//
// Flow: Google → /api/gsc/callback (here) → MC server /api/gsc/callback → token exchange → save → redirect to /client-config
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Determine MC server URL — use X_MC_URL env var or construct from host
  const mcBase = process.env.X_MC_URL || 'https://mc.opernox.com';

  if (error) {
    // User denied consent in Google's popup — redirect back with error
    const base = process.env.X_BASE_URL || 'https://opernox.com';
    return NextResponse.redirect(`${base}/client-config?gsc=error&reason=${encodeURIComponent(error)}`);
  }

  if (!code || !state) {
    const base = process.env.X_BASE_URL || 'https://opernox.com';
    return NextResponse.redirect(`${base}/client-config?gsc=error&reason=missing_params`);
  }

  // Forward to MC server's callback handler — it does token exchange and saves credentials
  const mcCallbackUrl = `${mcBase}/api/gsc/callback?code=${encodeURIComponent(code)}&state=${encodeURIComponent(state)}`;

  return NextResponse.redirect(mcCallbackUrl);
}
