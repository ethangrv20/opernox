'use client';

import { useState, useEffect } from 'react';

type VPSStatus = 'provisioning' | 'booting' | 'installing' | 'ready' | 'stopped' | 'terminated';

interface VPS {
  id: string;
  hostname: string;
  ip: string | null;
  status: VPSStatus;
  platform: string;
  os: string;
  slices: number;
  location_name: string;
  provisioned_at: string | null;
  ready_at: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<VPSStatus, { label: string; color: string; bg: string; description: string }> = {
  provisioning: {
    label: 'Provisioning',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10 border-yellow-400/30',
    description: 'Your VPS order has been placed. Interserver is spinning up your server.',
  },
  booting: {
    label: 'Booting',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10 border-blue-400/30',
    description: 'VPS is online. Installing Node.js, PM2, and mission-control...',
  },
  installing: {
    label: 'Installing',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10 border-purple-400/30',
    description: 'Installing AdsPower browser and configuring automation scripts...',
  },
  ready: {
    label: 'Ready',
    color: 'text-green-400',
    bg: 'bg-green-400/10 border-green-400/30',
    description: 'Your automation VPS is fully operational. Accounts can now be connected.',
  },
  stopped: {
    label: 'Stopped',
    color: 'text-gray-400',
    bg: 'bg-gray-400/10 border-gray-400/30',
    description: 'Your VPS is powered off. Contact support to restart.',
  },
  terminated: {
    label: 'Terminated',
    color: 'text-red-400',
    bg: 'bg-red-400/10 border-red-400/30',
    description: 'This VPS has been destroyed and is no longer active.',
  },
};

const LOCATION_FLAGS: Record<string, string> = {
  'Secaucus NJ': '🇺🇸 NJ',
  'Los Angeles CA': '🇺🇸 LA',
  'Dallas TX': '🇺🇸 TX',
};

function StatusBadge({ status }: { status: VPSStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium border ${config.color} ${config.bg}`}>
      <span className={`w-2 h-2 rounded-full ${
        status === 'ready' ? 'bg-green-400 animate-pulse' :
        status === 'provisioning' || status === 'booting' || status === 'installing' ? 'bg-yellow-400 animate-pulse' :
        status === 'stopped' ? 'bg-gray-400' : 'bg-red-400'
      }`} />
      {config.label}
    </span>
  );
}

function InfoRow({ label, value, mono = false }: { label: string; value: string | null | undefined; mono?: boolean }) {
  if (!value) return null;
  return (
    <div className="flex items-center justify-between py-2 border-b border-white/5">
      <span className="text-sm text-gray-400">{label}</span>
      <span className={`text-sm ${mono ? 'font-mono text-cyan-400' : 'text-white'}`}>{value}</span>
    </div>
  );
}

export default function ClientVPSPage() {
  const [vps, setVps] = useState<VPS | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  async function fetchVPS() {
    try {
      const res = await fetch('/api/client-vps', { credentials: 'include' });
      if (!res.ok) throw new Error('Not authenticated or no VPS found');
      const data = await res.json();
      setVps(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load VPS');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchVPS();
    // Poll every 30s if provisioning/booting/installing
    const interval = setInterval(() => {
      if (vps && ['provisioning', 'booting', 'installing'].includes(vps.status)) {
        fetchVPS();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [vps?.status]);

  async function handleRefresh() {
    setRefreshing(true);
    await fetchVPS();
    setRefreshing(false);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading your VPS...</p>
        </div>
      </div>
    );
  }

  if (error || !vps) {
    return (
      <div className="max-w-lg mx-auto mt-12 text-center">
        <div className="text-5xl mb-4">🖥️</div>
        <h1 className="text-xl font-semibold text-white mb-2">No VPS Found</h1>
        <p className="text-gray-400 text-sm mb-6">
          You don't have a VPS yet. Purchase a plan to automatically provision your own dedicated automation server.
        </p>
        <a
          href="/pricing"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-medium rounded-lg transition-colors"
        >
          View Plans →
        </a>
      </div>
    );
  }

  const config = STATUS_CONFIG[vps.status as VPSStatus];
  const locationFlag = LOCATION_FLAGS[vps.location_name] || '🇺🇸';
  const uptime = vps.ready_at
    ? `${Math.floor((Date.now() - new Date(vps.ready_at).getTime()) / 86400000)} days`
    : vps.provisioned_at
    ? 'Coming online...'
    : 'Pending';

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-white">Your Automation VPS</h1>
          <p className="text-sm text-gray-400 mt-0.5">{vps.hostname}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-400 hover:text-white border border-white/10 hover:border-white/20 rounded-lg transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Status Card */}
      <div className={`rounded-xl border p-5 ${config.bg}`}>
        <div className="flex items-start justify-between mb-3">
          <StatusBadge status={vps.status as VPSStatus} />
          <span className="text-xs text-gray-500">
            {locationFlag} {vps.location_name}
          </span>
        </div>
        <p className="text-sm text-gray-300">{config.description}</p>
      </div>

      {/* VPS Info */}
      <div className="bg-white/5 rounded-xl border border-white/10 overflow-hidden">
        <div className="px-4 py-3 border-b border-white/5">
          <h2 className="text-sm font-medium text-white">Server Details</h2>
        </div>
        <div className="px-4">
          <InfoRow label="IP Address" value={vps.ip || 'Assigning...'} mono />
          <InfoRow label="Hostname" value={vps.hostname} mono />
          <InfoRow label="Platform" value={vps.platform.toUpperCase()} />
          <InfoRow label="Operating System" value={vps.os === 'windowsr2' ? 'Windows Server 2016 R2' : vps.os} />
          <InfoRow label="Specs" value={`${vps.slices} slices · 4 cores · 16GB RAM · 320GB SSD`} />
          <InfoRow label="Uptime" value={uptime} />
          <InfoRow label="Created" value={new Date(vps.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} />
          {vps.provisioned_at && (
            <InfoRow label="Provisioned" value={new Date(vps.provisioned_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} />
          )}
        </div>
      </div>

      {/* Quick Actions */}
      {vps.status === 'ready' && (
        <div className="bg-white/5 rounded-xl border border-white/10 p-5">
          <h2 className="text-sm font-medium text-white mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/accounts"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
            >
              <span>🔗</span> Connect Accounts
            </a>
            <a
              href="/ugc"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
            >
              <span>📱</span> Instagram UGC
            </a>
            <a
              href="/tiktok"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
            >
              <span>🎵</span> TikTok UGC
            </a>
            <a
              href="/linkedin"
              className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-white transition-colors"
            >
              <span>💼</span> LinkedIn
            </a>
          </div>
        </div>
      )}

      {/* Provisioning progress notice */}
      {['provisioning', 'booting', 'installing'].includes(vps.status) && (
        <div className="text-center py-4">
          <p className="text-xs text-gray-500">
            ⏳ Your VPS typically comes online within 10-15 minutes of purchase.
            <br />This page auto-refreshes every 30 seconds.
          </p>
        </div>
      )}
    </div>
  );
}
