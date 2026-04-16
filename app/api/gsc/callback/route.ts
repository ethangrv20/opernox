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

  // Build a self-contained HTML page that handles the token exchange and notifies the opener
  const html = `<!DOCTYPE html>
<html>
<head><title>Connecting Google Search Console...</title></head>
<body style="font-family:system-ui;background:#0a0a0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
<div style="text-align:center;max-width:400px;padding:20px">
  <p style="font-size:18px" id="title">Connecting Google Search Console...</p>
  <p id="status" style="color:#6b7280;font-size:14px">Please wait</p>
  <p id="debug" style="color:#374151;font-size:11px;word-break:break-all;display:none"></p>
</div>
<script>
(function() {
  var statusEl = document.getElementById('status');
  var debugEl = document.getElementById('debug');
  var TITLE_MAP = {
    'invalid_params': 'Invalid configuration',
    'token_exchange_failed': 'Token exchange failed',
    'mc_server_error': 'Could not save credentials',
    'popup_blocked': 'Popup was blocked'
  };

  function updateStatus(text, isError) {
    statusEl.textContent = text;
    if (isError) statusEl.style.color = '#f87171';
  }

  function showDebug(text) {
    debugEl.style.display = 'block';
    debugEl.textContent = text;
  }

  function redirect(error) {
    var params = error
      ? 'gsc=error&reason=' + encodeURIComponent(String(error))
      : 'gsc=connected';
    setTimeout(function() {
      location.href = location.origin + '/client-config?' + params;
    }, error ? 2000 : 500);
  }

  var codeParam = ${code ? `"${code.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : 'null'};
  var stateStr = ${stateStr ? `"${stateStr.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"` : 'null'};

  showDebug('code=' + (codeParam ? codeParam.substring(0, 20) + '...' : 'null') + ' state=' + (stateStr ? stateStr.substring(0, 50) + '...' : 'null'));

  if (!codeParam || !stateStr) {
    updateStatus(!codeParam ? 'Missing authorization code' : 'Missing state parameter', true);
    showDebug('FAIL: codeParam=' + !!codeParam + ' stateStr=' + !!stateStr);
    redirect('invalid_params');
    return;
  }

  var state = null;
  try {
    state = JSON.parse(stateStr);
    showDebug('state parsed OK: mcUrl=' + (state && state.mcUrl ? state.mcUrl : 'MISSING'));
  } catch(e) {
    updateStatus('Invalid state data', true);
    showDebug('state parse error: ' + e.message + ' | raw: ' + stateStr);
    redirect('invalid_params');
    return;
  }

  if (!state || !state.clientId || !state.clientSecret || !state.mcUrl) {
    updateStatus('Incomplete configuration in state', true);
    showDebug('state missing fields: ' + JSON.stringify(state));
    redirect('invalid_params');
    return;
  }

  var redirectUri = location.origin + '/api/gsc/callback';

  updateStatus('Exchanging authorization code...');

  // Step 1: Exchange code for tokens
  fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      code: codeParam,
      client_id: state.clientId,
      client_secret: state.clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  }).then(function(r) { return r.json(); }).then(function(tokenJson) {
    showDebug('google token response: ' + JSON.stringify(tokenJson).substring(0, 100));
    if (tokenJson.error) {
      updateStatus('Google refused: ' + (tokenJson.error_description || tokenJson.error), true);
      redirect('google_' + (tokenJson.error_description || tokenJson.error));
      return;
    }

    updateStatus('Saving credentials...');

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
    }).then(function(r) {
      showDebug('mc connect response status: ' + r.status);
      if (!r.ok) {
        return r.text().then(function(t) { throw new Error('mc_error:' + (t || r.status)); });
      }
      return r.json();
    }).then(function() {
      updateStatus('Connected!');
      if (window.opener) {
        try { window.opener.postMessage({ type: 'gsc_oauth_result', gsc: { success: true } }, location.origin); } catch(e) {}
      }
      redirect(null);
    });
  })['catch'](function(e) {
    var errMsg = e.message || 'unknown';
    showDebug('catch error: ' + errMsg);
    updateStatus('Connection failed: ' + errMsg, true);
    if (window.opener) {
      try { window.opener.postMessage({ type: 'gsc_oauth_result', gsc: { success: false, error: errMsg } }, location.origin); } catch(e2) {}
    }
    redirect(errMsg);
  });
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
