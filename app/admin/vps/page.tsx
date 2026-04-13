'use client';

import { useState, useEffect, useCallback } from 'react';

type PaymentStatus = 'pending_wire' | 'paid' | 'vps_approved' | 'vps_active';
type VPSStatus = 'provisioning' | 'booting' | 'installing' | 'ready' | 'stopped' | 'terminated' | null;

interface Profile {
  id: string;
  email: string;
  business_name: string | null;
  payment_status: PaymentStatus;
  created_at: string;
}

interface VPS {
  id: string;
  user_id: string;
  hostname: string;
  ip: string | null;
  status: VPSStatus;
  location_name: string;
  slices: number;
  ready_at: string | null;
  created_at: string;
}

type CombinedUser = Profile & { vps?: VPS | null };

const PAYMENT_LABEL: Record<PaymentStatus, { label: string; color: string; bg: string }> = {
  pending_wire: { label: '⏳ Pending Wire', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  paid: { label: '✅ Paid (Wire Received)', color: 'text-green-400', bg: 'bg-green-400/10' },
  vps_approved: { label: '🔄 VPS Provisioning', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  vps_active: { label: '🟢 VPS Active', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
};

const VPS_STATUS_LABEL: Record<string, { label: string; color: string }> = {
  provisioning: { label: '⏳ Provisioning', color: 'text-yellow-400' },
  booting: { label: '🔧 Booting', color: 'text-blue-400' },
  installing: { label: '⚙️ Installing', color: 'text-purple-400' },
  ready: { label: '✅ Ready', color: 'text-green-400' },
  stopped: { label: '⏸ Stopped', color: 'text-gray-400' },
  terminated: { label: '❌ Terminated', color: 'text-red-400' },
};

export default function AdminVPSPage() {
  const [users, setUsers] = useState<CombinedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [confirmingUser, setConfirmingUser] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      // Fetch all profiles + their VPSes
      const [profilesRes, vpsesRes] = await Promise.all([
        fetch('/api/admin/profiles', { credentials: 'include' }),
        fetch('/api/admin/vpses', { credentials: 'include' }),
      ]);

      if (!profilesRes.ok) throw new Error('Failed to load profiles');

      const profiles: Profile[] = await profilesRes.json();
      const vpses: VPS[] = vpsesRes.ok ? await vpsesRes.json() : [];

      const vpsMap: Record<string, VPS> = {};
      vpses.forEach(v => { vpsMap[v.user_id] = v; });

      const combined: CombinedUser[] = profiles.map(p => ({
        ...p,
        vps: vpsMap[p.id] || null,
      }));

      // Sort: pending_wire first, then paid, then vps_approved, then vps_active
      const order: PaymentStatus[] = ['pending_wire', 'paid', 'vps_approved', 'vps_active'];
      combined.sort((a, b) => order.indexOf(a.payment_status) - order.indexOf(b.payment_status));

      setUsers(combined);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [refreshKey]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Poll when any VPS is in provisioning/booting/installing state
  useEffect(() => {
    const hasPending = users.some(u => u.vps && ['provisioning', 'booting', 'installing'].includes(u.vps.status!));
    if (!hasPending) return;
    const interval = setInterval(() => setRefreshKey(k => k + 1), 15000);
    return () => clearInterval(interval);
  }, [users]);

  async function handleMarkPaid(userId: string) {
    if (!confirm('Mark this user as paid (wire received)?')) return;
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
    if (!confirm(`⚠️ This will order a $40/mo VPS on Interserver for ${user.email}.\n\nAre you sure?`)) return;
    setConfirmingUser(null);
    setActionLoading(user.id);
    try {
      const res = await fetch(`/api/admin/vps/provision`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Provisioning failed');
      setRefreshKey(k => k + 1);
    } catch (err: any) {
      alert(`Provisioning failed: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  }

  async function handleTerminateVPS(user: CombinedUser) {
    if (!confirm(`❌ Terminate VPS for ${user.email}? This is IRREVERSIBLE.`)) return;
    setActionLoading(user.id + '-term');
    try {
      await fetch(`/api/admin/vps/${user.vps!.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      setRefreshKey(k => k + 1);
    } finally {
      setActionLoading(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">VPS Management</h1>
          <p className="text-sm text-gray-400 mt-0.5">{users.length} users · {
            users.filter(u => u.vps?.status === 'ready').length
          } VPS active · {
            users.filter(u => u.payment_status === 'paid').length
          } paid pending provisioning</p>
        </div>
        <button
          onClick={() => setRefreshKey(k => k + 1)}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors"
        >
          ↻ Refresh
        </button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs">
        {Object.entries(PAYMENT_LABEL).map(([key, val]) => (
          <span key={key} className={`px-2.5 py-1 rounded-full ${val.bg} ${val.color} font-medium`}>
            {val.label}
          </span>
        ))}
      </div>

      {/* User Table */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/5 text-left">
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">VPS Status</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">VPS IP</th>
              <th className="px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-500">No users yet. Users appear here when they sign up.</td>
              </tr>
            )}
            {users.map(user => {
              const payment = PAYMENT_LABEL[user.payment_status];
              const vpsStatus = user.vps?.status ? VPS_STATUS_LABEL[user.vps.status] : null;
              const isProvisioning = user.vps && ['provisioning', 'booting', 'installing'].includes(user.vps.status!);
              const isLoading = actionLoading === user.id;
              const isTerminating = actionLoading === user.id + '-term';

              return (
                <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                  {/* User */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-white">{user.business_name || 'No business name'}</div>
                    <div className="text-xs text-gray-500">{user.email}</div>
                    <div className="text-xs text-gray-600 mt-0.5">Signed up {new Date(user.created_at).toLocaleDateString()}</div>
                  </td>

                  {/* Payment Status */}
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-medium ${payment.bg} ${payment.color}`}>
                      {payment.label}
                    </span>
                  </td>

                  {/* VPS Status */}
                  <td className="px-4 py-3">
                    {user.vps ? (
                      <div>
                        <span className={`text-xs font-medium ${vpsStatus?.color || 'text-gray-400'}`}>
                          {vpsStatus?.label || user.vps.status}
                        </span>
                        {isProvisioning && (
                          <div className="mt-1.5 w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="h-full bg-yellow-400 animate-pulse rounded-full" style={{ width: '60%' }} />
                          </div>
                        )}
                        {user.vps.status === 'ready' && (
                          <div className="text-xs text-gray-500 mt-0.5">{user.vps.hostname}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>

                  {/* VPS IP */}
                  <td className="px-4 py-3 font-mono text-xs text-cyan-400">
                    {user.vps?.ip || (user.vps ? '...' : '—')}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      {/* Wire received → mark paid */}
                      {user.payment_status === 'pending_wire' && (
                        <button
                          onClick={() => handleMarkPaid(user.id)}
                          disabled={!!actionLoading}
                          className="px-3 py-1.5 text-xs font-medium bg-green-500/20 hover:bg-green-500/30 text-green-400 border border-green-500/30 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {actionLoading === user.id ? '...' : '✓ Wire Received'}
                        </button>
                      )}

                      {/* Paid → approve & provision VPS */}
                      {user.payment_status === 'paid' && (
                        <>
                          <button
                            onClick={() => setConfirmingUser(user.id)}
                            disabled={!!actionLoading}
                            className="px-3 py-1.5 text-xs font-medium bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 border border-cyan-500/30 rounded-lg transition-colors disabled:opacity-50"
                          >
                            {isLoading ? '...' : '🔧 Approve & Provision VPS'}
                          </button>
                          {confirmingUser === user.id && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-xs text-yellow-400">Confirm:</span>
                              <button
                                onClick={() => handleApproveVPS(user)}
                                className="px-2 py-1 text-xs font-bold bg-red-600 hover:bg-red-500 text-white rounded"
                              >
                                YES — Order VPS
                              </button>
                              <button
                                onClick={() => setConfirmingUser(null)}
                                className="px-2 py-1 text-xs bg-white/10 hover:bg-white/20 text-gray-300 rounded"
                              >
                                Cancel
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* VPS approved/provisioning — show progress */}
                      {user.payment_status === 'vps_approved' && (
                        <span className="text-xs text-blue-400 animate-pulse">⏳ Provisioning in progress...</span>
                      )}

                      {/* VPS active → terminate */}
                      {user.vps?.status === 'ready' && (
                        <button
                          onClick={() => handleTerminateVPS(user)}
                          disabled={!!actionLoading}
                          className="px-3 py-1.5 text-xs font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isTerminating ? '...' : '⛔ Terminate'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-600">
        💡 VPS provisioning uses Interserver KVM Windows plan (8 slices, $40/mo). Order is placed immediately when you click "Approve & Provision VPS."
      </div>
    </div>
  );
}
