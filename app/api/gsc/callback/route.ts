import { NextRequest, NextResponse } from 'next/server';

// Google OAuth callback — Google redirects here after user consents
// Receives: ?code=xxx&state=xxx
// state contains: { clientId, clientSecret, propertyUrl, mcUrl }
//
// NOTE: Token exchange is done CLIENT-SIDE (in browser) to avoid Vercel serverless
// network restrictions that can block requests to Google's OAuth endpoints.
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
  const baseUrl = getBaseUrl(request);

  // Return an HTML page that does the token exchange in the browser
  const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Google Search Console...</title></head>
<body style="font-family:system-ui;background:#0a0a0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
<div style="text-align:center">
  <p style="font-size:18px">Connecting Google Search Console...</p>
  <p id="status" style="color:#6b7280;font-size:14px">Exchanging authorization code...</p>
</div>
<script>
(async () => {
  const redirectUri = '${baseUrl}/api/gsc/callback';
  try {
    // Exchange auth code for tokens (done in browser — avoids Vercel network restrictions)
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: '${code}',
        client_id: '${clientId}',
        client_secret: '${clientSecret}',
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    const tokenJson = await tokenRes.json();

    if (tokenJson.error) {
      throw new Error(tokenJson.error_description || tokenJson.error);
    }

    document.getElementById('status').textContent = 'Saving credentials...';

    // Forward tokens to the client's MC server to store
    const connectRes = await fetch('${mcUrl}/api/gsc/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyUrl: '${propertyUrl}',
        clientId: '${clientId}',
        clientSecret: '${clientSecret}',
        refreshToken: tokenJson.refresh_token,
        accessToken: tokenJson.access_token,
        tokenExpiry: Date.now() + (tokenJson.expires_in || 3600) * 1000,
      }),
    });

    if (!connectRes.ok) {
      const errData = await connectRes.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(errData.error || 'Failed to save credentials');
    }

    window.location.href = '/client-config?gsc=connected';
  } catch (e) {
    window.location.href = '/client-config?gsc=error&reason=' + encodeURIComponent(e.message || 'token_exchange_failed');
  }
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

function getBaseUrl(request: NextRequest): string {
  const host = request.headers.get('host') || '';
  const proto = host.includes('localhost') ? 'http' : 'https';
  return `${proto}://${host}`;
}
