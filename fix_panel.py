#!/usr/bin/env python3
import sys
sys.stdout.reconfigure(encoding='utf-8')

with open('app/monitor/page.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# The keyword row div closes at </div> at 18 spaces (keyword wrapper).
# We need to add the Details button and expanded panel INSIDE the wrapper div.
# Details button should be at 20 spaces (inside wrapper at 18 spaces).
# Expanded panel: { at 20 spaces, <div> at 22 spaces (inside conditional at 20 spaces).
# The conditional </div> at 20 spaces closes the panel outer div.
# The keyword wrapper </div> at 18 spaces closes AFTER the expanded panel ends.
old_kw_row_end = """                    <button onClick={() => deleteKeyword(kw.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#ef4444', cursor: 'pointer' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}"""

# New structure: Details button + expanded panel both INSIDE the keyword row wrapper div.
# - Details button: at 20 spaces (child of wrapper at 18 spaces)
# - Expanded panel conditional: at 20 spaces (child of wrapper at 18 spaces)
# - Panel outer div: at 22 spaces (child of conditional at 20 spaces)
# - Panel inner grid div: at 24 spaces
# - Panel column divs: at 26 spaces
# - Panel column divs close: at 24 spaces
# - Panel outer div closes: at 20 spaces (same level as opening)
# - Keyword wrapper </div>: at 18 spaces (AFTER panel closes)
new_kw_row_end = """                    <button onClick={() => deleteKeyword(kw.id)} style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: 8, padding: 8, color: '#ef4444', cursor: 'pointer' }}>
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
                  </div>
                ))}
              </div>
            )}"""

if old_kw_row_end in content:
    content = content.replace(old_kw_row_end, new_kw_row_end, 1)
    print("Replacement succeeded")
else:
    print("Pattern not found")
    # Find the closest match
    idx = content.find('deleteKeyword(kw.id)')
    print(f"deleteKeyword found at: {idx}")
    print("Context around that area:")
    print(repr(content[idx:idx+300]))

with open('app/monitor/page.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
