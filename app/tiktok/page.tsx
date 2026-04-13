'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Video, Clock, CheckCircle, Plug, Upload, Trash2, Calendar } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const ACCENT = '#f43f5e';

type PostStatus = 'scheduled' | 'published' | 'failed' | 'cancelled';

interface ScheduledPost {
  id: string;
  platform: string;
  post_text: string;
  scheduled_for: string;
  status: PostStatus;
  published_at: string | null;
  external_id: string | null;
  created_at: string;
  metadata: { video_path?: string } | null;
}

export default function TikTokPage() {
  const [caption, setCaption] = useState('');
  const [schedulingFor, setSchedulingFor] = useState('');
  const [isPostingNow, setIsPostingNow] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [postMsg, setPostMsg] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);
  const [posts, setPosts] = useState<ScheduledPost[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoName, setVideoName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadPosts = useCallback(async () => {
    setLoadingPosts(true);
    const { data } = await supabase
      .from('scheduled_posts')
      .select('*')
      .eq('platform', 'tiktok')
      .order('scheduled_for', { ascending: true });
    if (data) setPosts(data);
    setLoadingPosts(false);
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedVideo(file);
      setVideoName(file.name);
    }
  };

  const uploadVideo = async (file: File): Promise<string | null> => {
    const formData = new FormData();
    formData.append('video', file);
    try {
      const res = await fetch('/api/upload-video', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.success) return data.videoPath;
      throw new Error(data.error || 'Upload failed');
    } catch(e: any) {
      throw new Error('Video upload failed: ' + e.message);
    }
  };

  const handlePostNow = async () => {
    if (!selectedVideo) {
      setPostMsg({ type: 'error', text: 'Select a video first' });
      setTimeout(() => setPostMsg(null), 3000);
      return;
    }
    if (!caption.trim()) {
      setPostMsg({ type: 'error', text: 'Add a caption' });
      setTimeout(() => setPostMsg(null), 3000);
      return;
    }

    setIsUploading(true);
    setIsPostingNow(true);
    setPostMsg(null);

    try {
      // 1. Upload video to VPS
      setPostMsg({ type: 'ok', text: 'Uploading video...' });
      const videoPath = await uploadVideo(selectedVideo);
      if (!videoPath) throw new Error('Video upload returned no path');

      // 2. Create scheduled post
      const { error } = await supabase.from('scheduled_posts').insert({
        platform: 'tiktok',
        post_text: caption.trim(),
        scheduled_for: new Date().toISOString(),
        status: 'scheduled',
        metadata: { video_path: videoPath },
      });

      if (error) throw new Error(error.message);

      setCaption('');
      setSelectedVideo(null);
      setVideoName('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      setPostMsg({ type: 'ok', text: 'Posted!' });
      loadPosts();
    } catch(e: any) {
      setPostMsg({ type: 'error', text: e.message });
    } finally {
      setIsUploading(false);
      setIsPostingNow(false);
      setTimeout(() => setPostMsg(null), 4000);
    }
  };

  const handleDelete = async (id: string) => {
    await supabase.from('scheduled_posts').delete().eq('id', id);
    loadPosts();
  };

  const fmt = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const isTomorrow = date.toDateString() === tomorrow.toDateString();
    const time = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    if (isToday) return `Today at ${time}`;
    if (isTomorrow) return `Tomorrow at ${time}`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ` at ${time}`;
  };

  const isConnected = true; // AdsPower handles auth via browser

  return (
    <div>
      <div className="topbar">
        <div className="topbar-title">TikTok</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '5px 12px' }}>
            <CheckCircle size={12} style={{ color: '#10b981' }} />
            <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text)' }}>Connected</span>
          </div>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 'var(--radius-sm)', border: '1.5px solid var(--border-2)', background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: 'var(--text-2)', fontFamily: 'inherit' }}>
            <Plug size={12} /> Connect
          </button>
        </div>
      </div>

      <div className="page-content">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: 4 }}>Short-Form Video</div>
          <div style={{ fontSize: '13px', color: 'var(--text-3)' }}>Upload, schedule, and track your TikTok content</div>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 14, alignItems: 'start' }}>
          {/* Left column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Compose + upload box */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '3px 10px 3px 6px', borderRadius: 99, background: ACCENT + '15', border: '1px solid ' + ACCENT + '30' }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: ACCENT + '20', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Video size={11} style={{ color: ACCENT }} />
                  </div>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-2)' }}>TikTok</span>
                </div>
              </div>

              <div style={{ padding: '14px 16px' }}>
                {/* Video drop zone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ minHeight: 120, background: 'var(--surface-2)', borderRadius: 'var(--radius-sm)', border: '2px dashed ' + (selectedVideo ? ACCENT : 'var(--border-2)'), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', marginBottom: 12, padding: '20px', transition: 'border-color 0.15s' }}>
                  {selectedVideo ? (
                    <>
                      <Video size={24} style={{ color: ACCENT, marginBottom: 8 }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{videoName}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Click to change video</div>
                    </>
                  ) : (
                    <>
                      <Upload size={22} style={{ color: 'var(--text-4)', marginBottom: 8 }} />
                      <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Click to select video</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>MP4, MOV, WEB — up to 10 min</div>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/mov,video/webm"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />

                {/* Caption */}
                <textarea
                  value={caption}
                  onChange={e => setCaption(e.target.value)}
                  placeholder="Write a caption... #fyp #viral #trending"
                  rows={3}
                  style={{
                    width: '100%', minHeight: 80, background: 'var(--surface-2)', border: '1px solid var(--border-2)',
                    borderRadius: 'var(--radius-sm)', padding: '10px 12px', fontSize: '13px', color: 'var(--text)',
                    fontFamily: 'inherit', resize: 'vertical', outline: 'none', boxSizing: 'border-box', marginBottom: 10,
                  }}
                />

                {postMsg && (
                  <div style={{ marginBottom: 8, padding: '7px 12px', borderRadius: 'var(--radius-sm)', background: postMsg.type === 'ok' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)', border: '1px solid ' + (postMsg.type === 'ok' ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'), fontSize: '12px', fontWeight: 600, color: postMsg.type === 'ok' ? '#10b981' : '#ef4444' }}>
                    {postMsg.text}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button
                    onClick={handlePostNow}
                    disabled={!isConnected || isPostingNow || isUploading}
                    style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 18px', borderRadius: 'var(--radius-sm)', background: ACCENT, border: 'none', cursor: isConnected ? 'pointer' : 'not-allowed', fontSize: '12px', fontWeight: 700, color: 'white', fontFamily: 'inherit', opacity: (isPostingNow || isUploading) ? 0.6 : 1 }}>
                    <Upload size={12} /> {isUploading ? 'Uploading...' : isPostingNow ? 'Posting...' : 'Post Now'}
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Queue */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Queue</div>
              </div>
              <div style={{ padding: '0' }}>
                {loadingPosts ? (
                  <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-3)', fontSize: '13px' }}>Loading...</div>
                ) : posts.length === 0 ? (
                  <div style={{ padding: '36px 24px', textAlign: 'center' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>No videos yet</div>
                    <div style={{ fontSize: '12px', color: 'var(--text-4)' }}>Your uploaded videos will appear here</div>
                  </div>
                ) : (
                  posts.map(post => (
                    <div key={post.id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '12px', color: 'var(--text)', marginBottom: 4, lineHeight: 1.5 }}>
                          {post.post_text?.substring(0, 80)}{post.post_text?.length > 80 ? '...' : ''}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: post.status === 'published' ? 'rgba(16,185,129,0.1)' : post.status === 'failed' ? 'rgba(239,68,68,0.1)' : 'rgba(234,179,8,0.1)', color: post.status === 'published' ? '#10b981' : post.status === 'failed' ? '#ef4444' : '#eab308' }}>
                            {post.status}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-4)' }}>{fmt(post.scheduled_for)}</span>
                        </div>
                      </div>
                      {post.status === 'scheduled' && (
                        <button onClick={() => handleDelete(post.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', padding: 4 }}>
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>

          {/* Right sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Videos', val: posts.filter(p => p.status === 'published').length || '—', sub: 'Total posted' },
                { label: 'Ready', val: posts.filter(p => p.status === 'scheduled').length || '—', sub: 'In queue' },
                { label: 'Views', val: '—', sub: 'This month' },
                { label: 'Sounds', val: '—', sub: 'Used' },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 + i * 0.05 }}
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '12px' }}>
                  <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 6 }}>{s.label}</div>
                  <div style={{ fontSize: '18px', fontWeight: 900, letterSpacing: '-0.5px' }}>{s.val}</div>
                  <div style={{ fontSize: '10.5px', color: 'var(--text-4)', marginTop: 1 }}>{s.sub}</div>
                </motion.div>
              ))}
            </div>

            {/* Schedule */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Schedule</div>
              </div>
              <div style={{ padding: '24px 16px', textAlign: 'center' }}>
                <div style={{ fontSize: '12px', color: 'var(--text-3)' }}>
                  {posts.filter(p => p.status === 'scheduled').length === 0 ? 'No scheduled videos' : `${posts.filter(p => p.status === 'scheduled').length} scheduled`}
                </div>
              </div>
            </div>

            {/* Settings */}
            <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius)' }}>
              <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.7px' }}>Settings</div>
              </div>
              <div style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-2)' }}>Auto-Post</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-4)' }}>Coming soon</div>
                  </div>
                  <div style={{ width: 36, height: 20, borderRadius: 99, background: 'var(--surface-3)', position: 'relative', cursor: 'not-allowed' }}>
                    <div style={{ position: 'absolute', left: 3, top: 3, width: 14, height: 14, borderRadius: '50%', background: 'var(--text-3)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
