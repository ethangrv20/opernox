'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Reply } from '@/lib/types';
import { motion } from 'framer-motion';
import { Inbox, AlertTriangle, ArrowRight } from 'lucide-react';

export default function RepliesPage() {
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return;
      supabase
        .from('replies')
        .select('*, campaign:campaigns(name), account:accounts(name)')
        .eq('user_id', data.user.id)
        .order('received_at', { ascending: false })
        .then(({ data }) => {
          setReplies(data || []);
          setLoading(false);
        });
    });
  }, []);

  const statusColor = (s: string) => ({
    new: 'badge-red', replied: 'badge-green', escalated: 'badge-yellow', ignored: 'badge-gray',
  }[s] || 'badge-gray');

  const statusLabel = (s: string) => ({ new: 'New', replied: 'Replied', escalated: 'Escalated', ignored: 'Ignored' }[s] || s);

  return (
    <div>
      <div className="topbar">
        <div className="topbar-left"><h2>Replies</h2></div>
      </div>

      <div className="page-body">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
          </div>
        ) : replies.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon"><Inbox size={24} /></div>
            <h3>No replies yet</h3>
            <p>When prospects reply to your DMs, they&apos;ll show up here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {replies.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <div className="reply-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '5px' }}>
                        <span style={{ fontWeight: 800, fontSize: '15px' }}>@{r.from_username}</span>
                        <span style={{ color: 'var(--text3)', fontSize: '13px' }}>·</span>
                        <span style={{ color: 'var(--text3)', fontSize: '13px' }}>{(r as any).campaign?.name || 'Unknown campaign'}</span>
                        {(r as any).account && <>
                          <span style={{ color: 'var(--text3)', fontSize: '13px' }}>·</span>
                          <span style={{ color: 'var(--text3)', fontSize: '13px' }}>{(r as any).account?.name}</span>
                        </>}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text3)' }}>{new Date(r.received_at).toLocaleString()}</div>
                    </div>
                    <span className={`badge ${statusColor(r.status)}`}>
                      {r.status === 'escalated' && <AlertTriangle size={11} />}
                      {statusLabel(r.status)}
                    </span>
                  </div>

                  <div style={{
                    padding: '14px 16px',
                    background: 'var(--surface2)',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '14px',
                    color: 'var(--text2)',
                    marginBottom: r.ai_response ? '12px' : '0',
                    borderLeft: '3px solid var(--border3)',
                    lineHeight: 1.6,
                  }}>
                    {r.message}
                  </div>

                  {r.ai_response && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <ArrowRight size={14} style={{ color: 'var(--success)', marginTop: '15px', flexShrink: 0 }} />
                      <div style={{
                        padding: '14px 16px',
                        background: 'rgba(16,185,129,0.06)',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: '14px',
                        color: 'var(--text2)',
                        borderLeft: '3px solid rgba(16,185,129,0.25)',
                        flex: 1,
                        lineHeight: 1.6,
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--success)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '6px' }}>
                          AI Response
                        </div>
                        {r.ai_response}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
