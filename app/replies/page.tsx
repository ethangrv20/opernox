'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Reply } from '@/lib/types';
import { motion } from 'framer-motion';
import { Inbox, AlertTriangle, ArrowRight } from 'lucide-react';

const STATUS_BADGE: Record<string, string> = {
  new: 'badge-r', replied: 'badge-g', escalated: 'badge-y', ignored: 'badge-n',
};
const STATUS_LABEL: Record<string, string> = {
  new: 'New', replied: 'Replied', escalated: 'Escalated', ignored: 'Ignored',
};

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

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">Replies</div>
      </div>

      <div className="page-content">
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '80px' }}>
            <div className="spinner" style={{ width: 26, height: 26 }} />
          </div>
        ) : replies.length === 0 ? (
          <div className="empty">
            <div className="empty-icon"><Inbox size={22} /></div>
            <h3>No replies yet</h3>
            <p>When prospects reply to your DMs, they&apos;ll show up here so you can follow up.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {replies.map((r, i) => (
              <motion.div key={r.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <div className="reply-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 800, fontSize: '14.5px', color: 'var(--text)' }}>@{r.from_username}</span>
                        {(r as any).campaign && <>
                          <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>·</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{(r as any).campaign?.name}</span>
                        </>}
                        {(r as any).account && <>
                          <span style={{ color: 'var(--text-3)', fontSize: '12px' }}>·</span>
                          <span style={{ fontSize: '12px', color: 'var(--text-3)' }}>{(r as any).account?.name}</span>
                        </>}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-3)' }}>{new Date(r.received_at).toLocaleString()}</div>
                    </div>
                    <span className={`badge ${STATUS_BADGE[r.status] || 'badge-n'}`}>
                      {r.status === 'escalated' && <AlertTriangle size={11} />}
                      {STATUS_LABEL[r.status] || r.status}
                    </span>
                  </div>

                  {/* Their reply */}
                  <div style={{
                    padding: '13px 15px',
                    background: 'var(--surface-2)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: '3px solid var(--border-3)',
                    fontSize: '13.5px',
                    color: 'var(--text-2)',
                    marginBottom: r.ai_response ? '10px' : '0',
                    lineHeight: 1.65,
                  }}>
                    {r.message}
                  </div>

                  {/* AI response */}
                  {r.ai_response && (
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                      <ArrowRight size={13} style={{ color: 'var(--green)', marginTop: '14px', flexShrink: 0 }} />
                      <div style={{
                        flex: 1,
                        padding: '13px 15px',
                        background: 'rgba(52,211,153,0.05)',
                        borderRadius: 'var(--radius-sm)',
                        borderLeft: '3px solid rgba(52,211,153,0.25)',
                        fontSize: '13.5px',
                        color: 'var(--text-2)',
                        lineHeight: 1.65,
                      }}>
                        <div style={{ fontSize: '10px', fontWeight: 800, color: 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.7px', marginBottom: '5px' }}>
                          AI Response Sent
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
