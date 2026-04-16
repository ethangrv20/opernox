import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status'); // 'connected' | 'error'
  const reason = searchParams.get('reason');

  const isError = status === 'error';
  const title = isError ? 'Connection Failed' : 'Connected!';
  const message = isError
    ? `Google Search Console could not be connected: ${reason || 'Unknown error'}`
    : 'Google Search Console has been connected successfully. You can close this window.';

  const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0a0f;
      color: #fff;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .card {
      background: rgba(255,255,255,0.04);
      border: 1px solid ${isError ? 'rgba(248,113,113,0.3)' : 'rgba(16,185,129,0.3)'};
      border-radius: 16px;
      padding: 40px 32px;
      text-align: center;
      max-width: 380px;
      width: 90%;
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${isError ? 'rgba(248,113,113,0.15)' : 'rgba(16,185,129,0.15)'};
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 20px;
      font-size: 28px;
    }
    h1 { font-size: 22px; font-weight: 600; margin-bottom: 12px; color: #fff; }
    p { font-size: 14px; color: #9ca3af; line-height: 1.6; }
    .error-msg { font-size: 13px; color: #f87171; margin-top: 8px; word-break: break-all; }
    .countdown { font-size: 12px; color: #6b7280; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${isError ? '✕' : '✓'}</div>
    <h1>${title}</h1>
    <p>${message}</p>
    ${isError && reason ? `<p class="error-msg">${decodeURIComponent(reason)}</p>` : ''}
    <p class="countdown">This window will close automatically...</p>
  </div>
  <script>
    // Tell the opener window what happened
    window.addEventListener('load', function() {
      var data = { type: 'gsc_oauth_result' };
      data.gsc = ${JSON.stringify(isError ? { success: false, error: reason } : { success: true })};
      if (window.opener) {
        try {
          window.opener.postMessage(data, location.origin);
        } catch(e) {}
      }
      // Auto-close after 3 seconds
      setTimeout(function() {
        window.close();
      }, 3000);
    });
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}
