#!/usr/bin/env python3
"""Read original page.tsx from git, apply all fixes, write corrected version."""
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

# Read original file from git
content = subprocess.run(['git', 'show', 'HEAD:app/monitor/page.tsx'],
                       capture_output=True, text=True, encoding='utf-8',
                       cwd='.').stdout

# CHANGE 1: GSC amber message
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

# CHANGE 2: AdsPower warning (Mentions)
content = content.replace(
    """<p style={{ fontSize: 12, color: '#374151', marginTop: 8, padding: '8px 14px', background: 'rgba(59,130,246,0.07)', borderRadius: 8, display: 'inline-block' }}>⚠️ Requires AdsPower browser running on this VPS</p>""",
    """<p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, padding: '8px 14px', background: 'rgba(59,130,246,0.07)', borderRadius: 8, display: 'inline-block' }}>ℹ️ Mentions are scraped from Google News &amp; Reddit using an AdsPower browser on your VPS. Keep AdsPower open with a profile active to enable scraping.</p>"""
)

# CHANGE 3: AdsPower warning (Reviews)
content = content.replace(
    """<p style={{ fontSize: 12, color: '#374151', marginTop: 8, padding: '8px 14px', background: 'rgba(251,191,36,0.07)', borderRadius: 8, display: 'inline-block' }}>⚠️ Requires AdsPower browser running on this VPS</p>""",
    """<p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, padding: '8px 14px', background: 'rgba(251,191,36,0.07)', borderRadius: 8, display: 'inline-block' }}>ℹ️ Reviews are scraped from Google Places &amp; other platforms using an AdsPower browser on your VPS. Keep AdsPower open with a profile running to enable review scraping.</p>"""
)

# CHANGE 4: Add expand state variables
content = content.replace(
    """  // Reviews
  const [reviews, setReviews] = useState<MonitorReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);""",
    """  // Reviews
  const [reviews, setReviews] = useState<MonitorReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  // Keyword row expand — shows Rankings + Mentions + Reviews inline
  const [expandedKwId, setExpandedKwId] = useState<string | null>(null);
  const [kwRankings, setKwRankings] = useState<MonitorRanking[]>([]);
  const [kwMentions, setKwMentions] = useState<MonitorMention[]>([]);
  const [kwReviews, setKwReviews] = useState<MonitorReview[]>([]);"""
)

# CHANGE 5: Add load functions after loadReviews
old_rev_end = """    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setReviewLoading(false); }
  }, [user]);

  // ─── Load Competitors ────────────────────────────────────────────────────"""
new_rev_end = """    } catch (e: any) { setMsg({ type: 'error', text: e.message }); }
    finally { setReviewLoading(false); }
  }, [user]);

  // Load rankings for a specific keyword
  const loadRankingsForKeyword = useCallback(async (kw: string) => {
    try {
      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/monitor/rankings?keyword=${encodeURIComponent(kw)}&limit=50`);
      const data = await res.json();
      setKwRankings(Array.isArray(data) ? data : (data.value || []));
    } catch (_) { setKwRankings([]); }
  }, []);

  // Load mentions filtered by keyword
  const loadMentionsForKeyword = useCallback(async (kw: string) => {
    try {
      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/monitor/mentions?limit=100`);
      const data = await res.json();
      const all = Array.isArray(data) ? data : (data.value || []);
      setKwMentions(all.filter((m: MonitorMention) =>
        m.title?.toLowerCase().includes(kw.toLowerCase()) ||
        m.snippet?.toLowerCase().includes(kw.toLowerCase())
      ));
    } catch (_) { setKwMentions([]); }
  }, []);

  // Load reviews filtered by keyword
  const loadReviewsForKeyword = useCallback(async (kw: string) => {
    try {
      const baseUrl = await getMcUrl();
      const res = await fetch(`${baseUrl}/api/monitor/reviews?limit=100`);
      const data = await res.json();
      const all = Array.isArray(data) ? data : (data.value || []);
      setKwReviews(all.filter((r: MonitorReview) =>
        r.review_text?.toLowerCase().includes(kw.toLowerCase()) ||
        r.platform.toLowerCase().includes(kw.toLowerCase())
      ));
    } catch (_) { setKwReviews([]); }
  }, []);

  // ─── Load Competitors ────────────────────────────────────────────────────"""
content = content.replace(old_rev_end, new_rev_end)

# CHANGE 6: Only Keywords tab
content = content.replace(
    """  const TABS = [
    { key: 'keywords',    label: 'Keywords',      icon: <Search size={14} /> },
    { key: 'rankings',    label: 'Rankings',       icon: <TrendingUp size={14} /> },
    { key: 'mentions',    label: 'Mentions',       icon: <Rss size={14} /> },
    { key: 'reviews',      label: 'Reviews',        icon: <Star size={14} /> },
    { key: 'competitors', label: 'Competitors',    icon: <Users size={14} /> },
  ] as const;""",
    """  const TABS = [
    { key: 'keywords', label: 'Keywords', icon: <Search size={14} /> },
  ] as const;"""
)

# CHANGE 7: Remove extra tab badges
content = content.replace(
    """              {t.key === 'keywords' && keywords.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{keywords.length}</span>
              )}
              {t.key === 'mentions' && mentions.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{mentions.length}</span>
              )}
              {t.key === 'reviews' && reviews.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{reviews.length}</span>
              )}""",
    """              {t.key === 'keywords' && keywords.length > 0 && (
                <span style={{ background: 'rgba(255,255,255,0.2)', borderRadius: 10, padding: '1px 6px', fontSize: 11 }}>{keywords.length}</span>
              )}"""
)

# CHANGE 8: Add Details button + expanded panel inside keyword row div
# ORIGINAL end of keyword row:
#   <button onClick={deleteKeyword}>  <- at 22 spaces (inside flex wrapper at 22 spaces)
#   </button>                        <- at 22 spaces
#   </div>                           <- at 22 spaces (closes flex wrapper)
# </div>                             <- at 18 spaces (closes keyword row div)
# ));                                <- at 16 spaces
# </div>                             <- at 14 spaces (closes grid)
#
# NEW end: Add Details button (as sibling to delete button) + expanded panel INSIDE keyword row div
old_kw_end = """                    <button onClick={() => deleteKeyword(kw.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}"""
new_kw_end = """                    <button onClick={() => deleteKeyword(kw.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        if (expandedKwId === kw.id) { setExpandedKwId(null); return; }
                        setExpandedKwId(kw.id);
                        loadRankingsForKeyword(kw.keyword);
                        loadMentionsForKeyword(kw.keyword);
                        loadReviewsForKeyword(kw.keyword);
                      }}
                      style={{
                        background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: 8, padding: '7px 10px', color: '#9ca3af', cursor: 'pointer',
                        fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,
                      }}
                    >
                      <ChevronDown size={13} style={{ transform: expandedKwId === kw.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                      {expandedKwId === kw.id ? 'Hide' : 'Details'}
                    </button>
                  </div>
                  {expandedKwId === kw.id && (
                    <div style={{ marginTop: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '16px 20px' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div>
                          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, fontWeight: 600 }}>Rankings for "{kw.keyword}"</div>
                          {kwRankings.length === 0 ? (
                            <div style={{ fontSize: 11, color: '#4b5563' }}>No ranking history. Click "Check" on this keyword to fetch.</div>
                          ) : (
                            <div style={{ display: 'grid', gap: 4 }}>
                              {kwRankings.slice(0, 10).map((r, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 5 }}>
                                  <span style={{ fontSize: 10, color: '#6b7280', minWidth: 60 }}>{timeAgo(r.searched_at)}</span>
                                  {r.position ? (
                                    r.position <= 3 ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>#{r.position}</span>
                                    : r.position <= 10 ? <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>#{r.position}</span>
                                    : <span style={{ background: 'rgba(107,114,128,0.15)', color: '#9ca3af', borderRadius: 3, padding: '1px 6px', fontSize: 10 }}>#{r.position}</span>
                                  ) : <span style={{ color: '#4b5563', fontSize: 10 }}>--</span>}
                                  <span style={{ fontSize: 10, color: '#6b7280' }}>{r.search_engine}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, fontWeight: 600 }}>Mentions for "{kw.keyword}"</div>
                          {kwMentions.length === 0 ? (
                            <div style={{ fontSize: 11, color: '#4b5563' }}>No mentions yet. Run "Find Mentions" from Monitor nav.</div>
                          ) : (
                            <div style={{ display: 'grid', gap: 4 }}>
                              {kwMentions.slice(0, 5).map((m, i) => (
                                <div key={i} style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 5, fontSize: 11 }}>
                                  <div style={{ color: '#6b7280', textTransform: 'capitalize', marginBottom: 2 }}>{m.source.replace('_',' ')}</div>
                                  {m.title && <div style={{ color: '#e5e7eb', fontSize: 11 }}>{m.title}</div>}
                                  {m.snippet && <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 2 }}>{m.snippet}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, fontWeight: 600 }}>Reviews for "{kw.keyword}"</div>
                          {kwReviews.length === 0 ? (
                            <div style={{ fontSize: 11, color: '#4b5563' }}>No reviews yet. Run "Check Reviews" from Monitor nav.</div>
                          ) : (
                            <div style={{ display: 'grid', gap: 4 }}>
                              {kwReviews.slice(0, 5).map((r, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 5 }}>
                                  <Star size={10} style={{ color: '#f59e0b' }} />
                                  <span style={{ fontSize: 11, color: '#e5e7eb' }}>{r.rating ?? '?'}/5</span>
                                  <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'capitalize' }}>{r.platform}</span>
                                  {r.reviewer_name && <span style={{ fontSize: 10, color: '#4b5563' }}> by {r.reviewer_name}</span>}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                ))}
              </div>
            )}"""

if old_kw_end in content:
    content = content.replace(old_kw_end, new_kw_end, 1)
    print("Keyword row replacement succeeded")
else:
    print("ERROR: old_kw_end pattern not found!")
    # Debug: show what's at the delete button area
    idx = content.find('deleteKeyword(kw.id)')
    print(f"deleteKeyword at index: {idx}")
    print("Context:")
    print(repr(content[idx:idx+400]))

# CHANGE 9: Disable old Rankings/Mentions/Reviews/Competitors tab sections
content = content.replace(
    """{/* ── RANKINGS ──────────────────────────────────────────────────────── */}
        {tab === 'rankings' && (""",
    """{/* ── RANKINGS (now inline in keyword Details) ────────────────────── */}
        {false && ("""
)
content = content.replace(
    """{/* ── MENTIONS ─────────────────────────────────────────────────────── */}
        {tab === 'mentions' && (""",
    """{/* ── MENTIONS (now inline in keyword Details) ──────────────────── */}
        {false && ("""
)
content = content.replace(
    """{/* ── REVIEWS ──────────────────────────────────────────────────────── */}
        {tab === 'reviews' && (""",
    """{/* ── REVIEWS (now inline in keyword Details) ────────────────────── */}
        {false && ("""
)
content = content.replace(
    """{/* ── COMPETITORS ───────────────────────────────────────────────────── */}
        {tab === 'competitors' && (""",
    """{/* ── COMPETITORS (now accessible via Keywords) ───────────────────── */}
        {false && ("""
)

with open('app/monitor/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print(f"Written: {len(content)} chars")
