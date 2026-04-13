'use client';

import { useState, useEffect, useCallback } from 'react';

type PaymentStatus = 'pending_wire' | 'paid' | 'vps_approved' | 'vps_active';
type VPSStatus = 'provisioning' | 'booting' | 'installing' | 'ready' | 'stopped' | 'terminated' | null;

interface Profile {
  id: string;
  email: string;
  business_name: string | null;
  payment_status: PaymentStatus;
  wire_notes: string | null;
  created_at: string;
}

interface VPS {
  id: string;
  user_id: string;
  hostname: string;
  ip: string | null;
  status: VPSStatus;
  location_name: string;
  os: string;
  slices: number;
  ready_at: string | null;
  created_at: string;
}

type CombinedUser = Profile & { vps?: VPS | null };

// ── Config ───────────────────────────────────────────────────────────────────

const PAYMENT_CONFIG: Record<PaymentStatus, { label: string; color: string; bg: string; dot: string }> = {
  pending_wire: { label: 'Pending Wire', color: 'text-amber-400', bg: 'bg-amber-400/10', dot: 'bg-amber-400' },
  paid:         { label: 'Wire Received', color: 'text-emerald-400', bg: 'bg-emerald-400/10', dot: 'bg-emerald-400' },
  vps_approved: { label: 'Provisioning', color: 'text-blue-400', bg: 'bg-blue-400/10', dot: 'bg-blue-400 animate-pulse' },
  vps_active:   { label: 'VPS Active',  color: 'text-green-400', bg: 'bg-green-400/10', dot: 'bg-green-400' },
};

const VPS_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  provisioning: { label: '⏳ Provisioning', color: 'text-yellow-400' },
  booting:      { label: '🔧 Booting',      color: 'text-blue-400' },
  installing:   { label: '⚙️ Installing',   color: 'text-purple-400' },
  ready:        { label: '✅ Live',          color: 'text-green-400' },
  stopped:      { label: '⏸ Stopped',        color: 'text-gray-400' },
  terminated:   { label: '❌ Terminated',   color: 'text-red-400' },
};

// ── Components ────────────────────────────────────────────────────────────────

function StatusPill({ status }: { status: PaymentStatus }) {
  const c = PAYMENT_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${c.bg} ${c.color}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
}

function VPSTag({ vps }: { vps: VPS }) {
  const s = VPS_STATUS_CONFIG[vps.status || ''] || { label: vps.status, color: 'text-gray-400' };
  return (
    <div className="flex flex-col gap-0.5">
      <span className={`text-xs font-medium ${s.color}`}>{s.label}</span>
      {vps.ip && <span className="text-xs font-mono text-cyan-400/70">{vps.ip}</span>}
    </div>
  );
}

// ── Main ─────────────────────────────────────────────────────────────────────

export default function AdminVPSPage() {
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmingUserId, setConfirmingUserId] = useState<string | null>(null);
  const [notesEditing, setNotesEditing] = useState<string | null>(null);
  const [notesDraft, setNotesDraft] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedUser, setSelectedUser] = useState<CombinedUser | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const [profilesRes, vpsesRes] = await Promise.all([
        fetch('/api/admin/profiles', { credentials: 'include' }),
        fetch('/api/admin/vpses', { credentials: 'include' }),
      ]);
      if (!profilesRes.ok) throw new Error('Failed to load');
      const profiles: Profile[] = await profilesRes.json();
      const vpses: VPS[] = vpsesRes.ok ? await vpsesRes.json() : [];
      const vpsMap: Record<string, VPS> = {};
      vpses.forEach(v => { vpsMap[v.user_id] = v; });
      const order: PaymentStatus[] = ['pending_wire', 'paid', 'vps_approved', 'vps_active'];
      const combined: CombinedUser[] = profiles
        .map(p => ({ ...p, vps: vpsMap[p.id] || null }))
        .sort((a, b) => order.indexOf(a.payment_status) - order.indexOf(b.payment_status));
      setUsers(combined);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  useEffect(() => {
    const pending = users.some(u => u.vps && ['provisioning','booting','installing'].includes(u.vps.status!));
    if (!pending) return;
    const t = setInterval(() => setRefreshKey(k => k + 1), 20000);
    return () => clearInterval(t);
  }, [users]);

  // ── Actions ────────────────────────────────────────────────────────────────

  async function handleMarkPaid(userId: string) {
    setActionLoading(userId);
    try {
      await fetch(`/api/admin/profiles/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ payment_status: 'paid' }),
      });
      setRefreshKey(k => k + 1);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleApproveVPS(user: CombinedUser) {
    setConfirmingUserId(null);
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/vpses/provision`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Provisioning failed');
      setSelectedUser(null);
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTerminateVPS(user: CombinedUser) {
    if (!confirm(`Terminate VPS for ${user.email}? This cannot be undone.`)) return;
    setActionLoading(user.id + '-t');
    try {
      await fetch(`/api/admin/vpses/${user.vps!.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setSelectedUser(null);
      setRefreshKey(k => k + 1);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleSaveNotes(user: CombinedUser) {
    await fetch(`/api/admin/profiles/${user.id}`, {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ wire_notes: notesDraft }),
    });
    setNotesEditing(null);
    setRefreshKey(k => k + 1);
  }

  // ── Stats ───────────────────────────────────────────────────────────────────

  const stats = {
    total: users.length,
    pendingWire: users.filter(u => u.payment_status === 'pending_wire').length,
    paid: users.filter(u => u.payment_status === 'paid').length,
    vpsActive: users.filter(u => u.vps?.status === 'ready').length,
    vpsProvisioning: users.filter(u => u.payment_status === 'vps_approved').length,
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">VPS Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {stats.total} users · {stats.vpsActive} VPS active · {stats.pendingWire} pending wire
          </p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Pending Wire', value: stats.pendingWire, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
          { label: 'Wire Received', value: stats.paid, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Provisioning', value: stats.vpsProvisioning, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
          { label: 'VPS Live', value: stats.vpsActive, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Two-column layout: table + detail panel */}
      <div className="flex gap-5" style={{ alignItems: 'flex-start' }}>

        {/* User table */}
        <div className="flex-1 bg-white/5 rounded-xl border border-white/10 overflow-hidden min-w-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/5 text-left">
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Client</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">VPS</th>
                <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Signed Up</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && (
                <tr><td colSpan={4} className="px-4 py-12 text-center text-gray-600">No users yet.</td></tr>
              )}
              {users.map(user => {
                const isSelected = selectedUser?.id === user.id;
                return (
                  <tr
                    key={user.id}
                    onClick={() => setSelectedUser(isSelected ? null : user)}
                    className={`border-b border-white/5 cursor-pointer transition-colors ${isSelected ? 'bg-cyan-500/10' : 'hover:bg-white/[0.02]'}`}
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-white text-sm">{user.business_name || '—'}</div>
                      <div className="text-xs text-gray-500 truncate max-w-32">{user.email}</div>
                    </td>
                    <td className="px-4 py-3"><StatusPill status={user.payment_status} /></td>
                    <td className="px-4 py-3">
                      {user.vps ? (
                        <VPSTag vps={user.vps} />
                      ) : (
                        <span className="text-xs text-gray-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {selectedUser && (
          <div className="w-80 shrink-0 bg-white/5 rounded-xl border border-cyan-500/30 overflow-hidden" style={{ position: 'sticky', top: 0 }}>
            <div className="px-4 py-3 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-white">Client Details</h2>
              <button onClick={() => setSelectedUser(null)} className="text-gray-500 hover:text-white text-lg">×</button>
            </div>
            <div className="p-4 space-y-4">

              {/* Info */}
              <div className="space-y-1.5">
                <div>
                  <div className="text-xs text-gray-500">Business</div>
                  <div className="text-sm text-white font-medium">{selectedUser.business_name || '—'}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Email</div>
                  <div className="text-sm text-white">{selectedUser.email}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Status</div>
                  <div className="mt-1"><StatusPill status={selectedUser.payment_status} /></div>
                </div>
                {selectedUser.vps && (
                  <div>
                    <div className="text-xs text-gray-500">VPS</div>
                    <div className="text-sm text-white font-mono">{selectedUser.vps.hostname}</div>
                    {selectedUser.vps.ip && <div className="text-xs text-cyan-400 font-mono">{selectedUser.vps.ip}</div>}
                    <div className="text-xs text-gray-500 mt-0.5">{selectedUser.vps.location_name} · {selectedUser.vps.os} · {selectedUser.vps.slices} slices</div>
                  </div>
                )}
              </div>

              {/* Wire notes */}
              <div>
                <div className="text-xs text-gray-500 mb-1">Wire Notes</div>
                {notesEditing === selectedUser.id ? (
                  <div className="space-y-2">
                    <textarea
                      value={notesDraft}
                      onChange={e => setNotesDraft(e.target.value)}
                      rows={3}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 resize-none focus:outline-none focus:border-cyan-500/50"
                      placeholder="e.g. $347 received Apr 13, Chase ref #..."
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleSaveNotes(selectedUser)} className="flex-1 py-1.5 text-xs bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg">Save</button>
                      <button onClick={() => setNotesEditing(null)} className="flex-1 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => { setNotesEditing(selectedUser.id); setNotesDraft(selectedUser.wire_notes || ''); }}
                    className="text-xs text-gray-400 bg-black/20 border border-dashed border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:border-white/20 min-h-[40px] flex items-center"
                  >
                    {selectedUser.wire_notes || 'Click to add notes...'}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="space-y-2 pt-2 border-t border-white/5">
                {selectedUser.payment_status === 'pending_wire' && (
                  <button
                    onClick={() => handleMarkPaid(selectedUser.id)}
                    disabled={!!actionLoading}
                    className="w-full py-2.5 text-sm font-semibold bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === selectedUser.id ? '...' : '✓ Mark Wire Received'}
                  </button>
                )}
                {selectedUser.payment_status === 'paid' && (
                  <>
                    <button
                      onClick={() => setConfirmingUserId(selectedUser.id)}
                      disabled={!!actionLoading}
                      className="w-full py-2.5 text-sm font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 rounded-lg transition-colors disabled:opacity-50"
                    >
                      {actionLoading === selectedUser.id ? '...' : '🔧 Provision VPS — $40/mo'}
                    </button>
                    {confirmingUserId === selectedUser.id && (
                      <div className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-3 space-y-2">
                        <p className="text-xs text-yellow-300">This will order a real VPS on Interserver. Confirm?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleApproveVPS(selectedUser)}
                            className="flex-1 py-1.5 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded-lg"
                          >
                            YES — Order
                          </button>
                          <button
                            onClick={() => setConfirmingUserId(null)}
                            className="flex-1 py-1.5 text-xs bg-white/10 hover:bg-white/20 text-white rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}
                {selectedUser.payment_status === 'vps_approved' && (
                  <div className="py-2.5 text-sm text-blue-400 text-center">
                    ⏳ Provisioning in progress...
                  </div>
                )}
                {selectedUser.vps?.status === 'ready' && (
                  <button
                    onClick={() => handleTerminateVPS(selectedUser)}
                    disabled={!!actionLoading}
                    className="w-full py-2.5 text-sm font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {actionLoading === selectedUser.id + '-t' ? '...' : '⛔ Terminate VPS'}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
