#!/usr/bin/env python3
"""Build corrected page.tsx by reading from git and making targeted changes."""
import subprocess, sys
sys.stdout.reconfigure(encoding='utf-8')

# Read original from git
orig = subprocess.run(['git', 'show', 'HEAD:app/monitor/page.tsx'],
                     capture_output=True, text=True, encoding='utf-8').stdout
lines = orig.split('\n')
total = len(lines)
print(f"Original: {total} lines")

new_lines = []
i = 0
while i < total:
    # CHANGE 1: GSC amber message (at original line ~728)
    if i < total-6 and 'GSC connected but no keywords yet' in lines[i] and 'property still processing' in lines[i]:
        # Replace with amber version
        new_lines.extend([
            """            {/* GSC connected but Google hasn't indexed it yet — amber warning */}""",
            """            {gscData?.connected && (!gscData.keywords || gscData.keywords.length === 0) && !gscLoading && (""",
            """              <div style={{ background: 'rgba(251,191,36,0.07)', border: '1px solid rgba(251,191,36,0.2)', borderRadius: 14, padding: 18, marginBottom: 24, textAlign: 'center' }}>""",
            """                <div style={{ fontSize: 13, color: '#f59e0b', marginBottom: 6 }}>Google Search Console connected — no keyword data yet</div>""",
            """                <div style={{ fontSize: 12, color: '#6b7280' }}>Google takes 1–3 days to index a new property. Your keywords will appear here once Google has data.</div>""",
            """              </div>""",
            """            )}""",
        ])
        i += 8  # skip old block (7 lines + 1 for next)
        continue

    # CHANGE 2: AdsPower Mentions warning
    if i < total-1 and '⚠️ Requires AdsPower browser running on this VPS</p>' in lines[i] and 'rgba(59,130,246' in lines[i]:
        new_lines.append("""            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, padding: '8px 14px', background: 'rgba(59,130,246,0.07)', borderRadius: 8, display: 'inline-block' }}>ℹ️ Mentions are scraped from Google News &amp; Reddit using an AdsPower browser on your VPS. Keep AdsPower open with a profile active to enable scraping.</p>""")
        i += 1
        continue

    # CHANGE 3: AdsPower Reviews warning
    if i < total-1 and '⚠️ Requires AdsPower browser running on this VPS</p>' in lines[i] and 'rgba(251,191,36' in lines[i]:
        new_lines.append("""            <p style={{ fontSize: 12, color: '#6b7280', marginTop: 8, padding: '8px 14px', background: 'rgba(251,191,36,0.07)', borderRadius: 8, display: 'inline-block' }}>ℹ️ Reviews are scraped from Google Places &amp; other platforms using an AdsPower browser on your VPS. Keep AdsPower open with a profile running to enable review scraping.</p>""")
        i += 1
        continue

    # CHANGE 4: Add expand state after reviews state (at "// Reviews" block)
    if i < total-2 and lines[i].strip() == '// Reviews' and 'const [reviews, setReviews]' in lines[i+1]:
        new_lines.append(lines[i])   # // Reviews
        new_lines.append(lines[i+1])  # const [reviews...
        new_lines.append(lines[i+2])  # const [reviewLoading...
        # Add expand state
        new_lines.extend([
            """  // Keyword row expand — shows Rankings + Mentions + Reviews inline""",
            """  const [expandedKwId, setExpandedKwId] = useState<string | null>(null);""",
            """  const [kwRankings, setKwRankings] = useState<MonitorRanking[]>([]);""",
            """  const [kwMentions, setKwMentions] = useState<MonitorMention[]>([]);""",
            """  const [kwReviews, setKwReviews] = useState<MonitorReview[]>([]);""",
        ])
        i += 3
        continue

    # CHANGE 5: After loadReviews, add load functions
    if i < total-3 and 'finally { setReviewLoading(false); }' in lines[i] and '} catch (e: any)' in lines[i-1]:
        # Add load functions here
        new_lines.append(lines[i])  # finally setReviewLoading
        new_lines.append(lines[i+1])  # }, [user]);
        new_lines.append("")
        new_lines.extend([
            """  // Load rankings for a specific keyword (inline panel)""",
            """  const loadRankingsForKeyword = useCallback(async (kw: string) => {""",
            """    try {""",
            """      const baseUrl = await getMcUrl();""",
            """      const res = await fetch(`${baseUrl}/api/monitor/rankings?keyword=${encodeURIComponent(kw)}&limit=50`);""",
            """      const data = await res.json();""",
            """      setKwRankings(Array.isArray(data) ? data : (data.value || []));""",
            """    } catch (_) { setKwRankings([]); }""",
            """  }, []);""",
            """",
            """  // Load mentions filtered by keyword""",
            """  const loadMentionsForKeyword = useCallback(async (kw: string) => {""",
            """    try {""",
            """      const baseUrl = await getMcUrl();""",
            """      const res = await fetch(`${baseUrl}/api/monitor/mentions?limit=100`);""",
            """      const data = await res.json();""",
            """      const all = Array.isArray(data) ? data : (data.value || []);""",
            """      setKwMentions(all.filter((m: MonitorMention) =>""",
            """        m.title?.toLowerCase().includes(kw.toLowerCase()) ||""",
            """        m.snippet?.toLowerCase().includes(kw.toLowerCase())""",
            """      ));""",
            """    } catch (_) { setKwMentions([]); }""",
            """  }, []);""",
            """",
            """  // Load reviews filtered by keyword""",
            """  const loadReviewsForKeyword = useCallback(async (kw: string) => {""",
            """    try {""",
            """      const baseUrl = await getMcUrl();""",
            """      const res = await fetch(`${baseUrl}/api/monitor/reviews?limit=100`);""",
            """      const data = await res.json();""",
            """      const all = Array.isArray(data) ? data : (data.value || []);""",
            """      setKwReviews(all.filter((r: MonitorReview) =>""",
            """        r.review_text?.toLowerCase().includes(kw.toLowerCase()) ||""",
            """        r.platform.toLowerCase().includes(kw.toLowerCase())""",
            """      ));""",
            """    } catch (_) { setKwReviews([]); }""",
            """  }, []);""",
            """""",
        ])
        i += 2  # skip the original }, [user]); and whitespace
        continue

    # CHANGE 6: TABS — only Keywords tab
    if i < total-6 and '{ key: \'keywords\'' in lines[i] and '{ key: \'rankings\'' in lines[i+1]:
        new_lines.append("""  const TABS = [""")
        new_lines.append("""    { key: 'keywords', label: 'Keywords', icon: <Search size={14} /> },""")
        new_lines.append("""  ] as const;""")
        i += 6
        continue

    # CHANGE 7: Remove extra tab badges (mentions/reviews badges)
    if i < total-3 and 't.key === \'mentions\'' in lines[i] and 'mentions.length' in lines[i]:
        # Skip the mentions and reviews badge lines
        if 't.key === \'reviews\'' in lines[i] or 't.key === \'mentions\'' in lines[i]:
            i += 1
            continue
        new_lines.append(lines[i])
        i += 1
        continue

    # CHANGE 8: Keyword row — add Details button before wrapper </div>
    # Pattern: <button onClick={() => deleteKeyword...> at 22sp
    #           <Trash2.../> at 22sp
    #           </button> at 22sp
    #           </div> at 18sp <- this is the keyword wrapper close
    #           ))} at 16sp
    if (i < total-4 and 'onClick={() => deleteKeyword(kw.id)}' in lines[i] and
        '<Trash2 size={13} />' in lines[i+1] and
        lines[i+2].strip() == '</button>' and
        lines[i+3].strip() == '</div>'):
        # Get current indent
        sp = len(lines[i]) - len(lines[i].lstrip())
        indent = ' ' * sp
        sp2 = len(lines[i+3]) - len(lines[i+3].lstrip())
        indent2 = ' ' * sp2

        # Add delete button, Details button, then expanded panel, then close wrapper
        new_lines.append(f"{indent}<button onClick={{() => deleteKeyword(kw.id)}} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#ef4444', cursor: 'pointer' }}>")
        new_lines.append(f"{indent}  <Trash2 size={{13}} />")
        new_lines.append(f"{indent}</button>")
        new_lines.append(f"{indent}<button")
        new_lines.append(f"{indent}  onClick={{() => {{")
        new_lines.append(f"{indent}    if (expandedKwId === kw.id) {{ setExpandedKwId(null); return; }}")
        new_lines.append(f"{indent}    setExpandedKwId(kw.id);")
        new_lines.append(f"{indent}    loadRankingsForKeyword(kw.keyword);")
        new_lines.append(f"{indent}    loadMentionsForKeyword(kw.keyword);")
        new_lines.append(f"{indent}    loadReviewsForKeyword(kw.keyword);")
        new_lines.append(f"{indent}  }}}}")
        new_lines.append(f"{indent}  style={{")
        new_lines.append(f"{indent}    background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',")
        new_lines.append(f"{indent}    borderRadius: 8, padding: '7px 10px', color: '#9ca3af', cursor: 'pointer',")
        new_lines.append(f"{indent}    fontSize: 12, display: 'flex', alignItems: 'center', gap: 4,")
        new_lines.append(f"{indent}  }}")
        new_lines.append(f"{indent}>")
        new_lines.append(f"{indent}  <ChevronDown size={{13}} style={{ transform: expandedKwId === kw.id ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />")
        new_lines.append(f"{indent}  {{expandedKwId === kw.id ? 'Hide' : 'Details'}}")
        new_lines.append(f"{indent}</button>")
        # Close keyword wrapper div
        new_lines.append(f"{indent2}</div>")
        # Expanded panel
        new_lines.append(f"{indent2}{{expandedKwId === kw.id && (")
        new_lines.append(f"{indent2}  <div style={{ marginTop: 8, background: 'rgba(0,0,0,0.2)', borderRadius: 10, padding: '16px 20px' }}>")
        new_lines.append(f"{indent2}    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>")
        new_lines.append(f"{indent2}      <div>")
        new_lines.append(f"{indent2}        <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, fontWeight: 600 }}>Rankings for \"{{kw.keyword}}\"</div>")
        new_lines.append(f"{indent2}        {{kwRankings.length === 0 ? (")
        new_lines.append(f"{indent2}          <div style={{ fontSize: 11, color: '#4b5563' }}>No ranking history. Click \"Check\" on this keyword to fetch.</div>")
        new_lines.append(f"{indent2}        ) : (")
        new_lines.append(f"{indent2}          <div style={{ display: 'grid', gap: 4 }}>")
        new_lines.append(f"{indent2}            {{kwRankings.slice(0, 10).map((r, i) => (")
        new_lines.append(f"{indent2}              <div key={{i}} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 5 }}>")
        new_lines.append(f"{indent2}                <span style={{ fontSize: 10, color: '#6b7280', minWidth: 60 }}>{{timeAgo(r.searched_at)}}</span>")
        new_lines.append(f"{indent2}                {{r.position ? (")
        new_lines.append(f"{indent2}                  r.position <= 3 ? <span style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 700 }}>#{{r.position}}</span>")
        new_lines.append(f"{indent2}                  : r.position <= 10 ? <span style={{ background: 'rgba(59,130,246,0.15)', color: '#3b82f6', borderRadius: 3, padding: '1px 6px', fontSize: 10, fontWeight: 600 }}>#{{r.position}}</span>")
        new_lines.append(f"{indent2}                  : <span style={{ background: 'rgba(107,114,128,0.15)', color: '#9ca3af', borderRadius: 3, padding: '1px 6px', fontSize: 10 }}>#{{r.position}}</span>")
        new_lines.append(f"{indent2}                ) : <span style={{ color: '#4b5563', fontSize: 10 }}>--</span>}}")
        new_lines.append(f"{indent2}                <span style={{ fontSize: 10, color: '#6b7280' }}>{{r.search_engine}}</span>")
        new_lines.append(f"{indent2}              </div>")
        new_lines.append(f"{indent2}            ))}}")
        new_lines.append(f"{indent2}          </div>")
        new_lines.append(f"{indent2}        )}}")
        new_lines.append(f"{indent2}      </div>")
        new_lines.append(f"{indent2}      <div>")
        new_lines.append(f"{indent2}        <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, fontWeight: 600 }}>Mentions for \"{{kw.keyword}}\"</div>")
        new_lines.append(f"{indent2}        {{kwMentions.length === 0 ? (")
        new_lines.append(f"{indent2}          <div style={{ fontSize: 11, color: '#4b5563' }}>No mentions yet. Run \"Find Mentions\" from Monitor nav.</div>")
        new_lines.append(f"{indent2}        ) : (")
        new_lines.append(f"{indent2}          <div style={{ display: 'grid', gap: 4 }}>")
        new_lines.append(f"{indent2}            {{kwMentions.slice(0, 5).map((m, i) => (")
        new_lines.append(f"{indent2}              <div key={{i}} style={{ padding: '6px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 5, fontSize: 11 }}>")
        new_lines.append(f"{indent2}                <div style={{ color: '#6b7280', textTransform: 'capitalize', marginBottom: 2 }}>{{m.source.replace('_',' ')}}</div>")
        new_lines.append(f"{indent2}                {{m.title && <div style={{ color: '#e5e7eb', fontSize: 11 }}>{{m.title}}</div>}}")
        new_lines.append(f"{indent2}                {{m.snippet && <div style={{ color: '#9ca3af', fontSize: 10, marginTop: 2 }}>{{m.snippet}}</div>}}")
        new_lines.append(f"{indent2}              </div>")
        new_lines.append(f"{indent2}            ))}}")
        new_lines.append(f"{indent2}          </div>")
        new_lines.append(f"{indent2}        )}}")
        new_lines.append(f"{indent2}      </div>")
        new_lines.append(f"{indent2}      <div>")
        new_lines.append(f"{indent2}        <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, fontWeight: 600 }}>Reviews for \"{{kw.keyword}}\"</div>")
        new_lines.append(f"{indent2}        {{kwReviews.length === 0 ? (")
        new_lines.append(f"{indent2}          <div style={{ fontSize: 11, color: '#4b5563' }}>No reviews yet. Run \"Check Reviews\" from Monitor nav.</div>")
        new_lines.append(f"{indent2}        ) : (")
        new_lines.append(f"{indent2}          <div style={{ display: 'grid', gap: 4 }}>")
        new_lines.append(f"{indent2}            {{kwReviews.slice(0, 5).map((r, i) => (")
        new_lines.append(f"{indent2}              <div key={{i}} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', background: 'rgba(255,255,255,0.04)', borderRadius: 5 }}>")
        new_lines.append(f"{indent2}                <Star size={{10}} style={{ color: '#f59e0b' }} />")
        new_lines.append(f"{indent2}                <span style={{ fontSize: 11, color: '#e5e7eb' }}>{{r.rating ?? '?'}}/5</span>")
        new_lines.append(f"{indent2}                <span style={{ fontSize: 10, color: '#6b7280', textTransform: 'capitalize' }}>{{r.platform}}</span>")
        new_lines.append(f"{indent2}                {{r.reviewer_name && <span style={{ fontSize: 10, color: '#4b5563' }}> by {{r.reviewer_name}}</span>}}")
        new_lines.append(f"{indent2}              </div>")
        new_lines.append(f"{indent2}            ))}}")
        new_lines.append(f"{indent2}          </div>")
        new_lines.append(f"{indent2}        )}}")
        new_lines.append(f"{indent2}      </div>")
        new_lines.append(f"{indent2}    </div>")
        new_lines.append(f"{indent2}  </div>")
        new_lines.append(f"{indent2})}}")

        i += 4  # skip original delete button block
        continue

    # CHANGE 9: Disable Rankings/Mentions/Reviews/Competitors tabs
    if i < total-1 and "{tab === 'rankings' && (" in lines[i]:
        new_lines.append("""        {/* ── RANKINGS (now inline in keyword Details) ────────────────────── */}
        {false && (""")
        i += 1
        continue
    if i < total-1 and "{tab === 'mentions' && (" in lines[i]:
        new_lines.append("""        {/* ── MENTIONS (now inline in keyword Details) ──────────────────── */}
        {false && (""")
        i += 1
        continue
    if i < total-1 and "{tab === 'reviews' && (" in lines[i]:
        new_lines.append("""        {/* ── REVIEWS (now inline in keyword Details) ────────────────────── */}
        {false && (""")
        i += 1
        continue
    if i < total-1 and "{tab === 'competitors' && (" in lines[i]:
        new_lines.append("""        {/* ── COMPETITORS (now accessible via Keywords) ───────────────────── */}
        {false && (""")
        i += 1
        continue

    new_lines.append(lines[i])
    i += 1

result = '\n'.join(new_lines)
with open('app/monitor/page.tsx', 'w', encoding='utf-8') as f:
    f.write(result)
print(f"Written: {len(result)} chars, {len(new_lines)} lines (was {total})")