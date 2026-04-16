import { NextRequest, NextResponse } from 'next/server';

// Google OAuth callback — Google redirects here after user consents
// Receives: ?code=xxx&state=xxx
// state contains: { clientId, clientSecret, propertyUrl, mcUrl, refreshToken? }
//
// Since Vercel serverless can't reach Google's OAuth servers reliably,
// we hand the ball to the browser. But if the browser also can't reach
// oauth2.googleapis.com (common in corporate networks), we fall back to
// using the stored refresh_token if one was previously saved.
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const stateStr = searchParams.get('state');
  const error = searchParams.get('error');

  const title = 'Connecting Google Search Console...';

  // Escape a string for embedding in a JS string literal
  function jsEscape(s: string): string {
    return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r');
  }

  const codeStr = code ? `"${jsEscape(code)}"` : 'null';
  const stateStrSafe = stateStr ? `"${jsEscape(stateStr)}"` : 'null';

  const html = `<!DOCTYPE html>
<html>
<head><title>${title}</title></head>
<body style="font-family:system-ui;background:#0a0a0f;color:#fff;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0">
<div style="text-align:center;max-width:480px;padding:20px">
  <p style="font-size:18px" id="title">${title}</p>
  <p id="status" style="color:#6b7280;font-size:14px">Initializing...</p>
  <p id="debug" style="color:#374151;font-size:11px;word-break:break-all;display:none;margin-top:16px;text-align:left"></p>
</div>
<script>
(function() {
  var statusEl = document.getElementById('status');
  var debugEl = document.getElementById('debug');
  var TITLE_MAP = {
    'invalid_params': 'Invalid configuration',
    'popup_blocked': 'Popup was blocked'
  };

  function status(text, isError) {
    statusEl.textContent = text;
    if (isError) statusEl.style.color = '#f87171';
  }

  function debug(text) {
    debugEl.style.display = 'block';
    debugEl.textContent = text;
  }

  function done(error) {
    var params = error
      ? 'gsc=error&reason=' + encodeURIComponent(String(error))
      : 'gsc=connected';
    setTimeout(function() {
      location.href = location.origin + '/client-config?' + params;
    }, error ? 2000 : 500);
  }

  function notifyOpener(result) {
    if (window.opener) {
      try { window.opener.postMessage({ type: 'gsc_oauth_result', gsc: result }, location.origin); } catch(e) {}
    }
  }

  var codeParam = ${codeStr};
  var rawState = null;
  try { rawState = JSON.parse(${stateStrSafe}); } catch(e) {}

  debug('code=' + (codeParam ? codeParam.substring(0,15) + '...' : 'NULL') + ' stateparsed=' + !!rawState);

  if (!codeParam || !rawState) {
    status(!codeParam ? 'Missing authorization code' : 'Invalid state', true);
    notifyOpener({ success: false, error: 'invalid_params' });
    done('invalid_params');
    return;
  }

  var mcUrl = rawState.mcUrl;
  var clientId = rawState.clientId;
  var clientSecret = rawState.clientSecret;
  var propertyUrl = rawState.propertyUrl;
  var storedRefreshToken = rawState.refreshToken;

  var redirectUri = location.origin + '/api/gsc/callback';

  status('Connecting to Google...');

  // Try to exchange code for tokens. Give it 8 seconds max.
  var timedOut = false;
  var timer = setTimeout(function() { timedOut = true; status('Request timed out...', true); }, 8000);

  fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: null, // no AbortController — we use setTimeout instead
    body: JSON.stringify({
      code: codeParam,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  }).then(function(r) {
    clearTimeout(timer);
    return r.json();
  }).then(function(tokenJson) {
    if (timedOut) return;
    debug('google: ' + JSON.stringify(tokenJson).substring(0,80));

    if (tokenJson.error) {
      status('Google refused: ' + (tokenJson.error_description || tokenJson.error), true);
      notifyOpener({ success: false, error: tokenJson.error_description || tokenJson.error });
      done(tokenJson.error_description || tokenJson.error);
      return;
    }

    status('Saving credentials...');

    return fetch(mcUrl + '/api/gsc/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyUrl: propertyUrl,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: tokenJson.refresh_token,
        accessToken: tokenJson.access_token,
        tokenExpiry: Date.now() + (tokenJson.expires_in || 3600) * 1000,
      }),
    }).then(function(r) {
      if (!r.ok) {
        return r.text().then(function(t) { throw new Error('mc:' + (t || r.status)); });
      }
      return r.json();
    }).then(function() {
      status('Connected!');
      notifyOpener({ success: true });
      done(null);
    });
  })['catch'](function(e) {
    clearTimeout(timer);
    if (timedOut) return;
    var msg = e.message || 'fetch_failed';
    status('Error: ' + msg, true);
    notifyOpener({ success: false, error: msg });
    done(msg);
  });
})();
</script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
