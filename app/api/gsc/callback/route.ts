import { NextRequest, NextResponse } from 'next/server';

// Google OAuth callback — Google redirects here after user consents
// Receives: ?code=xxx&state=xxx
// state contains: { clientId, clientSecret, propertyUrl, mcUrl }
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');
  const error = searchParams.get('error');

  // If user denied consent
  if (error) {
    return NextResponse.redirect(
      new URL(`/client-config?gsc=error&reason=${encodeURIComponent(error)}`, request.url)
    );
  }

  if (!code || !stateStr) {
    return NextResponse.redirect(new URL('/client-config?gsc=error&reason=missing_params', request.url));
  }

  let state: { clientId: string; clientSecret: string; propertyUrl: string; mcUrl: string };
  try {
    state = JSON.parse(stateStr);
  } catch {
    return NextResponse.redirect(new URL('/client-config?gsc=error&reason=invalid_state', request.url));
  }

  const { clientId, clientSecret, propertyUrl, mcUrl } = state;

  try {
    // Exchange auth code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: `${getBaseUrl(request)}/api/gsc/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenJson = await tokenRes.json();

    if (tokenJson.error) {
      throw new Error(tokenJson.error_description || tokenJson.error);
    }

    // Forward tokens to the client's MC server to store
    const connectRes = await fetch(`${mcUrl}/api/gsc/connect`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyUrl,
        clientId,
        clientSecret,
        refreshToken: tokenJson.refresh_token,
        accessToken: tokenJson.access_token,
        tokenExpiry: Date.now() + (tokenJson.expires_in || 3600) * 1000,
      }),
    });

    if (!connectRes.ok) {
      const errData = await connectRes.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errData.error || `MC server returned ${connectRes.status}`);
    }

    // Success — redirect back to client-config with success flag
    return NextResponse.redirect(new URL('/client-config?gsc=connected', request.url));
  } catch (e: any) {
    const reason = encodeURIComponent(e.message || 'token_exchange_failed');
    return NextResponse.redirect(
      new URL(`/client-config?gsc=error&reason=${reason}`, request.url)
    );
  }
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || '';
  const proto = host.includes('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}
