import re

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Fix GSC amber warning for connected-but-no-data state
content = content.replace(
    """{/* GSC connected but no keywords yet (property still processing) */}
            {gscData?.connected && !gscData.keywords?.length && !gscLoading && (
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: 18, marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 6 }}>Google Search Console is connected but no keyword data yet</div>
                <div style={{ fontSize: 12, color: '#4b5563' }}>Google usually takes 1-3 days to process a new property. Check back soon.</div>
              </div>
            )}""",
    """{/* GSC connected but Google hasn't indexed it yet — amber warning */}
            {gscData?.connected && (!gscData.keywords || gscData.keywords.length === 0) && !gscLoading && (
              <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: 18, marginBottom: 24, textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#f59e0b', marginBottom: 6 }}>Google Search Console connected — no keyword data yet</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>Google takes 1–3 days to index a new property. Your keywords will appear here once Google has data.</div>
              </div>
            )}"""
)

# 2. AdsPower warning in Mentions tab
content = content.replace(
    """<p style={{ fontSize: 12, color: '#374151', marginTop: 8, padding: '8px 14px', background: 'rgba(59,130,246,0.07)', borderRadius: 8, display: 'inline-block' }}>⚠️ Requires AdsPower browser running on this VPS</p>""",
    """<p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, padding: '8px 14px', background: 'rgba(59,130,246,0.07)', borderRadius: 8, display: 'inline-block' }}>ℹ️ Mentions are scraped from Google News &amp; Reddit using an AdsPower browser running on your VPS. Keep AdsPower open with a profile active to enable scraping.</p>"""
)

# 3. AdsPower warning in Reviews tab
content = content.replace(
    """<p style={{ fontSize: 12, color: '#374151', marginTop: 8, padding: '8px 14px', background: 'rgba(251,191,36,0.07)', borderRadius: 8, display: 'inline-block' }}>⚠️ Requires AdsPower browser running on this VPS</p>""",
    """<p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, padding: '8px 14px', background: 'rgba(251,191,36,0.07)', borderRadius: 8, display: 'inline-block' }}>ℹ️ Reviews are scraped from Google Places &amp; other platforms using an AdsPower browser running on your VPS. Keep AdsPower open with a profile running to enable review scraping.</p>"""
)

with open('app/monitor/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patches applied")