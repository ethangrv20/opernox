'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

type PaymentStatus = 'pending_wire' | 'paid' | 'vps_approved' | 'vps_active';
type VPSStatus = 'provisioning' | 'booting' | 'installing' | 'ready' | 'stopped' | 'terminated';

interface VPS {
  id: string;
  user_id: string;
  hostname: string;
  ip: string | null;
  status: VPSStatus | null;
  location_name: string;
  os: string;
  slices: number;
  ready_at: string | null;
  created_at: string;
}

interface Profile {
  id: string;
  email: string;
  business_name: string | null;
  payment_status: PaymentStatus;
  wire_notes: string | null;
  created_at: string;
}

type CombinedUser = Profile & { vps?: VPS | null };

// ── Status Config ────────────────────────────────────────────────────────────

const STATUS_META: Record<PaymentStatus, { label: string; cls: string }> = {
  pending_wire: { label: 'Pending Wire',  cls: 'status-amber' },
  paid:         { label: 'Wire Received', cls: 'status-green' },
  vps_approved: { label: 'Provisioning',  cls: 'status-blue' },
  vps_active:   { label: 'VPS Active',    cls: 'status-live' },
};

const VPS_META: Record<string, { label: string; cls: string }> = {
  provisioning: { label: 'Provisioning…', cls: 'vps-pending' },
  booting:      { label: 'Booting…',     cls: 'vps-pending' },
  installing:   { label: 'Installing…',  cls: 'vps-pending' },
  ready:        { label: 'Live',         cls: 'vps-live' },
  stopped:      { label: 'Stopped',      cls: 'vps-stopped' },
  terminated:   { label: 'Terminated',   cls: 'vps-dead' },
};

// ── Card Component ───────────────────────────────────────────────────────────

function UserCard({
  user,
  isSelected,
  onSelect,
  onAction,
  actionLoading,
  confirmingId,
  onConfirmYes,
  onConfirmNo,
}: {
  user: CombinedUser;
  isSelected: boolean;
  onSelect: () => void;
  onAction: (action: string) => void;
  actionLoading: string | null;
  confirmingId: string | null;
  onConfirmYes: () => void;
  onConfirmNo: () => void;
}) {
  const meta = STATUS_META[user.payment_status];
  const vpsMeta = user.vps ? (VPS_META[user.vps.status || ''] || { label: user.vps.status, cls: 'vps-unknown' }) : null;

  return (
    <div
      onClick={onSelect}
      className={`vps-card ${isSelected ? 'vps-card--selected' : ''}`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="vps-card__name">{user.business_name || '—'}</div>
          <div className="vps-card__email">{user.email}</div>
        </div>
        <span className={`status-pill ${meta.cls}`}>{meta.label}</span>
      </div>

      {/* VPS info */}
      <div className="mt-3 flex items-center gap-3">
        {user.vps ? (
          <>
            <span className={`vps-badge ${vpsMeta?.cls}`}>{vpsMeta?.label}</span>
            {user.vps.ip && <span className="vps-ip">{user.vps.ip}</span>}
          </>
        ) : (
          <span className="vps-none">No VPS</span>
        )}
      </div>

      {/* Expanded actions */}
      {isSelected && (
        <div className="vps-card__actions" onClick={e => e.stopPropagation()}>
          <div className="vps-card__divider" />

          {user.payment_status === 'pending_wire' && (
            <button
              className="btn-primary"
              disabled={!!actionLoading}
              onClick={() => onAction('paid')}
            >
              {actionLoading === user.id ? '…' : '✓ Mark Wire Received'}
            </button>
          )}

          {user.payment_status === 'paid' && (
            <>
              <button
                className="btn-primary"
                disabled={!!actionLoading}
                onClick={() => onAction('provision')}
              >
                {actionLoading === user.id ? '…' : '🔧 Provision VPS — $40/mo'}
              </button>
              {confirmingId === user.id && (
                <div className="confirm-box">
                  <span className="confirm-text">Order real VPS on Interserver?</span>
                  <div className="confirm-btns">
                    <button className="btn-danger" onClick={onConfirmYes}>YES — Order</button>
                    <button className="btn-ghost" onClick={onConfirmNo}>Cancel</button>
                  </div>
                </div>
              )}
            </>
          )}

          {user.payment_status === 'vps_approved' && (
            <div className="vps-status-msg">⏳ Provisioning in progress…</div>
          )}

          {user.vps?.status === 'ready' && (
            <button
              className="btn-danger-ghost"
              disabled={!!actionLoading}
              onClick={() => onAction('terminate')}
            >
              ⛔ Terminate VPS
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AdminVPSPage() {
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const refreshKey = useRef(0);

  const fetchData = useCallback(async (attempt = 1) => {
    try {
      const [profilesRes, vpsesRes] = await Promise.all([
        fetch('/api/admin/profiles', { credentials: 'include' }),
        fetch('/api/admin/vpses', { credentials: 'include' }),
      ]);

      const profiles: Profile[] = profilesRes.ok ? await profilesRes.json() : [];
      const vpses: VPS[] = vpsesRes.ok ? await vpsesRes.json() : [];

      const vpsMap: Record<string, VPS> = {};
      vpses.forEach(v => { vpsMap[v.user_id] = v; });

      const order: PaymentStatus[] = ['pending_wire', 'paid', 'vps_approved', 'vps_active'];
      const combined: CombinedUser[] = profiles
        .map(p => ({ ...p, vps: vpsMap[p.id] || null }))
        .sort((a, b) => order.indexOf(a.payment_status) - order.indexOf(b.payment_status));

      setUsers(combined);
      setError(null);
    } catch (err) {
      if (attempt < 3) {
        await new Promise(r => setTimeout(r, 1000));
        return fetchData(attempt + 1);
      }
      setError('Failed to load data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 20s when VPSes are provisioning
  useEffect(() => {
    const pending = users.some(u => u.vps && ['provisioning','booting','installing'].includes(u.vps.status!));
    if (!pending) return;
    const t = setInterval(() => { refreshKey.current++; fetchData(); }, 20000);
    return () => clearInterval(t);
  }, [users, fetchData]);

  async function handleAction(userId: string, action: string) {
    setErrorMsg(null);
    if (action === 'paid') {
      setActionLoading(userId);
      try {
        const res = await fetch(`/api/admin/profiles/${userId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_status: 'paid' }),
        });
        if (!res.ok) throw new Error((await res.json()).error);
        setSelectedId(null);
        fetchData();
      } catch (e: any) {
        setErrorMsg(e.message);
      } finally {
        setActionLoading(null);
      }
      return;
    }

    if (action === 'provision') {
      setConfirmingId(userId);
      return;
    }

    if (action === 'terminate') {
      if (!confirm('Terminate this VPS? This cannot be undone.')) return;
      setActionLoading(userId + '-t');
      try {
        await fetch(`/api/admin/vpses/${users.find(u => u.id === userId)!.vps!.id}`, {
          method: 'DELETE',
          credentials: 'include',
        });
        setSelectedId(null);
        fetchData();
      } finally {
        setActionLoading(null);
      }
    }
  }

  async function handleConfirmProvision(userId: string) {
    setConfirmingId(null);
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/vpses/provision`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Provisioning failed');
      setSelectedId(null);
      fetchData();
    } catch (e: any) {
      setErrorMsg(e.message);
    } finally {
      setActionLoading(null);
    }
  }

  // Stats
  const pending = users.filter(u => u.payment_status === 'pending_wire').length;
  const paid = users.filter(u => u.payment_status === 'paid').length;
  const provisioning = users.filter(u => u.payment_status === 'vps_approved').length;
  const live = users.filter(u => u.vps?.status === 'ready').length;

  return (
    <div className="vps-admin">

      {/* Header */}
      <div className="vps-admin__header">
        <div>
          <h1 className="vps-admin__title">VPS Management</h1>
          <p className="vps-admin__sub">
            {users.length} users · {live} active · refreshes every 20s during provisioning
          </p>
        </div>
        <div className="flex items-center gap-3">
          {errorMsg && <span className="text-xs text-red-400">{errorMsg}</span>}
          <button
            className="btn-ghost"
            onClick={() => fetchData()}
            disabled={loading}
          >
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="vps-stats">
        <div className="vps-stat vps-stat--amber">
          <span className="vps-stat__num">{pending}</span>
          <span className="vps-stat__label">Pending Wire</span>
        </div>
        <div className="vps-stat vps-stat--green">
          <span className="vps-stat__num">{paid}</span>
          <span className="vps-stat__label">Wire Received</span>
        </div>
        <div className="vps-stat vps-stat--blue">
          <span className="vps-stat__num">{provisioning}</span>
          <span className="vps-stat__label">Provisioning</span>
        </div>
        <div className="vps-stat vps-stat--live">
          <span className="vps-stat__num">{live}</span>
          <span className="vps-stat__label">VPS Live</span>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="vps-loading">
          <div className="spinner-lg" />
        </div>
      ) : error ? (
        <div className="vps-error">{error} <button className="btn-ghost text-xs" onClick={() => fetchData()}>Retry</button></div>
      ) : users.length === 0 ? (
        <div className="vps-empty">
          <div className="vps-empty__icon">📦</div>
          <div className="vps-empty__title">No users yet</div>
          <div className="vps-empty__sub">Users will appear here once they sign up</div>
        </div>
      ) : (
        <div className="vps-grid">
          {users.map(user => (
            <UserCard
              key={user.id}
              user={user}
              isSelected={selectedId === user.id}
              onSelect={() => setSelectedId(selectedId === user.id ? null : user.id)}
              onAction={(a) => handleAction(user.id, a)}
              actionLoading={actionLoading}
              confirmingId={confirmingId}
              onConfirmYes={() => handleConfirmProvision(user.id)}
              onConfirmNo={() => setConfirmingId(null)}
            />
          ))}
        </div>
      )}

      <style>{`
        .vps-admin { padding: 28px 32px; max-width: 1200px; }
        .vps-admin__header { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 24px; gap: 16px; }
        .vps-admin__title { font-size: 22px; font-weight: 700; color: #f3f4f6; margin: 0; }
        .vps-admin__sub { font-size: 13px; color: #6b7280; margin: 4px 0 0; }

        .vps-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 28px; }
        .vps-stat { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.07); border-radius: 12px; padding: 16px 20px; }
        .vps-stat__num { display: block; font-size: 28px; font-weight: 700; line-height: 1; }
        .vps-stat__label { display: block; font-size: 12px; color: #6b7280; margin-top: 4px; }
        .vps-stat--amber .vps-stat__num { color: #fbbf24; }
        .vps-stat--green .vps-stat__num { color: #34d399; }
        .vps-stat--blue .vps-stat__num { color: #60a5fa; }
        .vps-stat--live .vps-stat__num { color: #4ade80; }

        .vps-loading { display: flex; align-items: center; justify-content: center; height: 200px; }
        .spinner-lg { width: 36px; height: 36px; border: 3px solid rgba(255,255,255,0.1); border-top-color: #22d3ee; border-radius: 50%; animation: spin 0.7s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }

        .vps-error { text-align: center; padding: 48px; color: #f87171; font-size: 14px; }

        .vps-empty { text-align: center; padding: 64px 32px; }
        .vps-empty__icon { font-size: 40px; margin-bottom: 12px; }
        .vps-empty__title { font-size: 16px; font-weight: 600; color: #d1d5db; }
        .vps-empty__sub { font-size: 13px; color: #6b7280; margin-top: 4px; }

        .vps-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 14px; }

        .vps-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 14px; padding: 18px 20px; cursor: pointer; transition: all 0.15s; position: relative; overflow: hidden; }
        .vps-card:hover { border-color: rgba(255,255,255,0.14); background: rgba(255,255,255,0.06); }
        .vps-card--selected { border-color: rgba(34,211,238,0.4); background: rgba(34,211,238,0.05); }

        .vps-card__name { font-size: 14px; font-weight: 600; color: #f3f4f6; }
        .vps-card__email { font-size: 12px; color: #6b7280; margin-top: 2px; font-family: monospace; }

        .status-pill { display: inline-block; font-size: 11px; font-weight: 600; padding: 3px 10px; border-radius: 20px; white-space: nowrap; }
        .status-amber { background: rgba(251,191,36,0.12); color: #fbbf24; border: 1px solid rgba(251,191,36,0.25); }
        .status-green { background: rgba(52,211,153,0.12); color: #34d399; border: 1px solid rgba(52,211,153,0.25); }
        .status-blue { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.25); }
        .status-live { background: rgba(74,222,128,0.12); color: #4ade80; border: 1px solid rgba(74,222,128,0.25); }

        .vps-badge { display: inline-block; font-size: 11px; font-weight: 600; padding: 2px 8px; border-radius: 6px; }
        .vps-pending { background: rgba(251,191,36,0.1); color: #fbbf24; }
        .vps-live { background: rgba(74,222,128,0.1); color: #4ade80; }
        .vps-stopped { background: rgba(107,114,128,0.15); color: #9ca3af; }
        .vps-dead { background: rgba(248,113,113,0.1); color: #f87171; }
        .vps-unknown { background: rgba(107,114,128,0.15); color: #9ca3af; }
        .vps-ip { font-size: 11px; color: #22d3ee; font-family: monospace; }
        .vps-none { font-size: 12px; color: #4b5563; }

        .vps-card__divider { height: 1px; background: rgba(255,255,255,0.06); margin: 14px 0; }
        .vps-card__actions { }
        .vps-card__actions .btn-primary { width: 100%; }
        .vps-status-msg { text-align: center; font-size: 13px; color: #60a5fa; padding: 4px 0; }

        .confirm-box { margin-top: 10px; background: rgba(234,179,8,0.08); border: 1px solid rgba(234,179,8,0.2); border-radius: 10px; padding: 12px 14px; }
        .confirm-text { font-size: 12px; color: #fbbf24; display: block; margin-bottom: 10px; }
        .confirm-btns { display: flex; gap: 8px; }
        .confirm-btns .btn-danger { flex: 1; padding: 7px 0; font-size: 12px; }

        .btn-primary { background: #22d3ee; color: #000; font-weight: 700; font-size: 13px; padding: 9px 18px; border-radius: 9px; border: none; cursor: pointer; transition: background 0.15s; }
        .btn-primary:hover:not(:disabled) { background: #67e8f9; }
        .btn-primary:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-danger { background: #dc2626; color: #fff; font-weight: 700; font-size: 13px; padding: 9px 18px; border-radius: 9px; border: none; cursor: pointer; transition: background 0.15s; }
        .btn-danger:hover:not(:disabled) { background: #ef4444; }
        .btn-danger:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-danger-ghost { background: rgba(220,38,38,0.1); color: #f87171; font-weight: 600; font-size: 13px; padding: 9px 18px; border-radius: 9px; border: 1px solid rgba(220,38,38,0.2); cursor: pointer; width: 100%; transition: all 0.15s; }
        .btn-danger-ghost:hover:not(:disabled) { background: rgba(220,38,38,0.2); }
        .btn-danger-ghost:disabled { opacity: 0.45; cursor: not-allowed; }
        .btn-ghost { background: rgba(255,255,255,0.06); color: #9ca3af; font-weight: 500; font-size: 13px; padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); cursor: pointer; transition: all 0.15s; }
        .btn-ghost:hover:not(:disabled) { background: rgba(255,255,255,0.1); color: #d1d5db; }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
      `}</style>
    </div>
  );
}
