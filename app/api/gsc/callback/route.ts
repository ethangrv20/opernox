import { NextRequest, NextResponse } from 'next/server';

// Google OAuth callback — Google redirects here after user consents
// Receives: ?code=xxx&state=xxx
// state contains: { clientId, clientSecret, propertyUrl, mcUrl }
//
// Token exchange is done CLIENT-SIDE (in browser) to avoid Vercel serverless
// network restrictions that can block requests to Google's OAuth endpoints.
// After success/failure, uses postMessage to notify the opener window.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');
  const error = searchParams.get('error');

  const errorMsg = error || (!code ? 'missing_code' : !stateStr ? 'missing_state' : null);

  // Build a self-contained HTML page that handles the token exchange and notifies the opener
  const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Google Search Console...</title></head>
<body style="font-family:system-ui;background:#0a0a0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
<div style="text-align:center;max-width:400px;padding:20px">
  <p style="font-size:18px" id="title">Connecting Google Search Console...</p>
  <p id="status" style="color:#6b7280;font-size:14px">Please wait</p>
</div>
<script>
(function() {
  var code = ${code ? `"${code.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : 'null'};
  var state = null;
  try { state = JSON.parse(decodeURIComponent("${stateStr || ''}")); } catch(e) {}

  var result = { success: false, error: 'unknown' };

  if (!code || !state) {
    result = { success: false, error: 'invalid_params' };
  } else {
    var redirectUri = location.origin + '/api/gsc/callback';
    // Step 1: Exchange code for tokens
    fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        client_id: state.clientId,
        client_secret: state.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    }).then(function(r) { return r.json(); }).then(function(tokenJson) {
      if (tokenJson.error) {
        result = { success: false, error: tokenJson.error_description || tokenJson.error };
        return;
      }
      // Step 2: Forward tokens to MC server
      return fetch(state.mcUrl + '/api/gsc/connect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          propertyUrl: state.propertyUrl,
          clientId: state.clientId,
          clientSecret: state.clientSecret,
          refreshToken: tokenJson.refresh_token,
          accessToken: tokenJson.access_token,
          tokenExpiry: Date.now() + (tokenJson.expires_in || 3600) * 1000,
        }),
      }).then(function(r) { return r.ok ? r.json() : r.text().then(function(t) { throw new Error(t || 'mc_server_error'); }); })
        .then(function() {
          result = { success: true };
        });
    })['catch'](function(e) {
      result = { success: false, error: e.message || 'fetch_failed' };
    });
  }

  // Wait for async, then notify opener and close
  function done() {
    if (window.opener) {
      try {
        window.opener.postMessage({ type: 'gsc_oauth_result', gsc: result }, location.origin);
      } catch(e) {}
    }
    var params = result.success ? 'gsc=connected' : 'gsc=error&reason=' + encodeURIComponent(result.error || 'failed');
    var target = location.origin + '/client-config?' + params;
    // Small delay so the message can be received
    setTimeout(function() {
      location.href = target;
    }, 500);
  }

  // Poll until async is done (max 15s)
  var ticks = 0;
  var interval = setInterval(function() {
    ticks++;
    if (result.error !== 'unknown' || ticks > 150) {
      clearInterval(interval);
      done();
    }
  }, 100);
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
