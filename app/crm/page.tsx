'use client';
import React, { useEffect, useState, useRef } from 'react';
import { getMcUrl } from '@/lib/mc-url';
import {
  Users, Building2, PieChart, Activity, CheckSquare, Plus, Search, Trash2,
  Loader2, X, Calendar, DollarSign, User, Globe, Phone, Mail, Edit2,
  Clock, AlertCircle, CheckCircle, FileText, ExternalLink, MessageSquare,
  Zap, Send, ArrowRight, Filter
} from 'lucide-react';

type Tab = 'contacts' | 'companies' | 'pipeline' | 'activities' | 'tasks';
type ActivityType = 'scrape_run' | 'post_published' | 'dm_sent' | 'dm_reply' | 'contact_created' | 'deal_created' | 'deal_stage_changed' | 'note_added' | 'task_completed' | 'api_import';
type DealStage = 'lead' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

const STAGES: { id: DealStage; label: string; color: string }[] = [
  { id: 'lead', label: 'Lead', color: '#71717a' },
  { id: 'qualified', label: 'Qualified', color: '#3b82f6' },
  { id: 'proposal', label: 'Proposal', color: '#a855f7' },
  { id: 'negotiation', label: 'Negotiation', color: '#f97316' },
  { id: 'won', label: 'Won', color: '#22c55e' },
  { id: 'lost', label: 'Lost', color: '#ef4444' },
];

const ACTIVITY_CONFIG: Record<ActivityType, { label: string; color: string }> = {
  scrape_run: { label: 'Scrape Run', color: '#f97316' },
  post_published: { label: 'Post Published', color: '#3b82f6' },
  dm_sent: { label: 'DM Sent', color: '#8b5cf6' },
  dm_reply: { label: 'DM Reply', color: '#22c55e' },
  contact_created: { label: 'Contact Created', color: '#06b6d4' },
  deal_created: { label: 'Deal Created', color: '#eab308' },
  deal_stage_changed: { label: 'Stage Changed', color: '#f97316' },
  note_added: { label: 'Note Added', color: '#71717a' },
  task_completed: { label: 'Task Done', color: '#22c55e' },
  api_import: { label: 'API Import', color: '#8b5cf6' },
};

// Cached MC URL — resolved once from getMcUrl()
let _mcUrl: string | null = null;
let _mcUrlPromise: Promise<string> | null = null;
const MC_FALLBACK = 'https://mc.opernox.com';

function resolveMcUrl() {
  if (_mcUrl) return Promise.resolve(_mcUrl);
  if (!_mcUrlPromise) _mcUrlPromise = getMcUrl().then(u => { _mcUrl = u; return u; }).catch(() => MC_FALLBACK);
  return _mcUrlPromise;
}

async function mcApi(endpoint: string, options?: RequestInit) {
  const base = await resolveMcUrl();
  return fetch(`${base}${endpoint}`, { credentials: 'include', ...options });
}

function timeAgo(date: string) {
  const d = new Date(date);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

// ---- Shared UI Components ----
function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '16px', width: '100%', maxWidth: '500px', maxHeight: '88vh', overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid #27272a', position: 'sticky', top: 0, backgroundColor: '#18181b' }}>
          <h2 style={{ color: 'white', fontSize: '0.95rem', fontWeight: 600 }}>{title}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: '4px', display: 'flex' }}><X size={16} /></button>
        </div>
        <div style={{ padding: '20px' }}>{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', fontSize: '0.7rem', color: '#71717a', marginBottom: '5px', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>
      {children}
    </div>
  );
}

function Input(props: { value: any; onChange?: React.ChangeEventHandler<HTMLInputElement>; style?: any; placeholder?: string; type?: string }) {
  return <input {...props} onChange={props.onChange} style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', ...(props.style || {}) }} />;
}

function Sel(props: { value: any; onChange?: React.ChangeEventHandler<HTMLSelectElement>; options: { value: string; label: string }[] }) {
  return (
    <select value={props.value} onChange={props.onChange} style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box' }}>
      {props.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

function TxtArea(props: { value: any; onChange?: React.ChangeEventHandler<HTMLTextAreaElement>; placeholder?: string }) {
  return <textarea value={props.value} onChange={props.onChange} placeholder={props.placeholder} rows={3} style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '9px 12px', color: 'white', fontSize: '0.85rem', outline: 'none', boxSizing: 'border-box', resize: 'vertical' }} />;
}

function Btn({ children, color = '#3b82f6', loading, disabled, onClick, style }: any) {
  return (
    <button onClick={onClick} disabled={disabled || loading} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 16px', borderRadius: '8px', fontSize: '0.82rem', fontWeight: 600, border: 'none', cursor: disabled || loading ? 'not-allowed' : 'pointer', opacity: disabled || loading ? 0.4 : 1, backgroundColor: color, color: 'white', ...(style || {}) }}>
      {loading && <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />}
      {children}
    </button>
  );
}

function Badge({ children, color }: { children: React.ReactNode; color: string }) {
  return <span style={{ fontSize: '0.65rem', padding: '2px 8px', borderRadius: '20px', backgroundColor: color + '22', color, fontWeight: 600 }}>{children}</span>;
}

// ---- CONTACTS TAB ----
function ContactsTab() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company_name: '', website: '', industry: '', source: 'manual', status: 'new', notes: '' });

  async function load() {
    setLoading(true);
    let url = '/api/crm/contacts?limit=100';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    if (statusFilter) url += `&status=${encodeURIComponent(statusFilter)}`;
    try {
      const r = await mcApi(url);
      const d = await r.json();
      setContacts(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [search, statusFilter]);

  function openCreate() { setForm({ name: '', email: '', phone: '', company_name: '', website: '', industry: '', source: 'manual', status: 'new', notes: '' }); setEditing(null); setShowModal(true); }
  function openEdit(c: any) { setForm({ name: c.name || '', email: c.email || '', phone: c.phone || '', company_name: c.company_name || '', website: c.website || '', industry: c.industry || '', source: c.source || 'manual', status: c.status || 'new', notes: c.notes || '' }); setEditing(c); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const opts = { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) };
      const url = editing ? `/api/crm/contacts/${editing.id}` : '/api/crm/contacts';
      await mcApi(url, opts);
      setShowModal(false);
      load();
    } catch { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this contact?')) return;
    await mcApi(`/api/crm/contacts/${id}`, { method: 'DELETE' });
    load();
  }

  const statusColors: Record<string, string> = { new: '#3b82f6', active: '#22c55e', converted: '#a855f7', churned: '#71717a' };
  const statusBadge = (s: string) => <Badge color={statusColors[s] || '#71717a'}>{s}</Badge>;

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, email, company..." style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '8px 12px 8px 32px', color: 'white', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.82rem', outline: 'none' }}>
          <option value="">All statuses</option>
          <option value="new">New</option>
          <option value="active">Active</option>
          <option value="converted">Converted</option>
          <option value="churned">Churned</option>
        </select>
        <Btn onClick={openCreate}><Plus size={13} /> Add Contact</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46' }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : contacts.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46', fontSize: '0.85rem' }}>No contacts yet â€” add your first one above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {contacts.map(c => (
            <div key={c.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '50%', backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <User size={16} style={{ color: '#71717a' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                  <span style={{ color: 'white', fontSize: '0.88rem', fontWeight: 600 }}>{c.name}</span>
                  {statusBadge(c.status || 'new')}
                  <Badge color="#52525b">{c.source || 'manual'}</Badge>
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {c.email && <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '3px' }}><Mail size={10} />{c.email}</span>}
                  {c.phone && <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '3px' }}><Phone size={10} />{c.phone}</span>}
                  {c.company_name && <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '3px' }}><Building2 size={10} />{c.company_name}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Contact' : 'New Contact'}>
        <Field label="Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="John Smith" /></Field>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label="Email"><Input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="john@company.com" type="email" /></Field>
          <Field label="Phone"><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+1 234 567 8900" /></Field>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label="Company"><Input value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} placeholder="Acme Corp" /></Field>
          <Field label="Industry"><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="SaaS, Finance..." /></Field>
        </div>
        <Field label="Website"><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="acme.com" /></Field>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label="Source"><Sel value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} options={[{ value: 'manual', label: 'Manual' }, { value: 'scrape', label: 'Scrape' }, { value: 'api', label: 'API' }, { value: 'outreach', label: 'Outreach' }]} /></Field>
          <Field label="Status"><Sel value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} options={[{ value: 'new', label: 'New' }, { value: 'active', label: 'Active' }, { value: 'converted', label: 'Converted' }, { value: 'churned', label: 'Churned' }]} /></Field>
        </div>
        <Field label="Notes"><TxtArea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes about this contact..." /></Field>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Btn onClick={() => setShowModal(false)} color="#27272a">Cancel</Btn>
          <Btn onClick={handleSave} loading={saving} disabled={!form.name.trim()}>{editing ? 'Save Changes' : 'Add Contact'}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ---- COMPANIES TAB ----
function CompaniesTab() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', domain: '', industry: '', size: '', website: '' });

  async function load() {
    setLoading(true);
    let url = '/api/crm/companies?limit=100';
    if (search) url += `&search=${encodeURIComponent(search)}`;
    try {
      const r = await mcApi(url);
      const d = await r.json();
      setCompanies(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [search]);

  function openCreate() { setForm({ name: '', domain: '', industry: '', size: '', website: '' }); setEditing(null); setShowModal(true); }
  function openEdit(c: any) { setForm({ name: c.name || '', domain: c.domain || '', industry: c.industry || '', size: c.size || '', website: c.website || '' }); setEditing(c); setShowModal(true); }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const opts = { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) };
      const url = editing ? `/api/crm/companies/${editing.id}` : '/api/crm/companies';
      await mcApi(url, opts);
      setShowModal(false);
      load();
    } catch { setSaving(false); }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this company?')) return;
    await mcApi(`/api/crm/companies/${id}`, { method: 'DELETE' });
    load();
  }

  const sizeColors: Record<string, string> = { startup: '#22c55e', smb: '#3b82f6', mid: '#a855f7', enterprise: '#f97316' };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: '1', minWidth: '180px' }}>
          <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#52525b', pointerEvents: 'none' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search companies..." style={{ width: '100%', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '8px 12px 8px 32px', color: 'white', fontSize: '0.82rem', outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <Btn onClick={openCreate}><Plus size={13} /> Add Company</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46' }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : companies.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46', fontSize: '0.85rem' }}>No companies yet â€” add your first one above.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {companies.map(c => (
            <div key={c.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '12px', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#27272a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={16} style={{ color: '#71717a' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '3px' }}>
                  <span style={{ color: 'white', fontSize: '0.88rem', fontWeight: 600 }}>{c.name}</span>
                  {c.size && <Badge color={sizeColors[c.size] || '#71717a'}>{c.size}</Badge>}
                </div>
                <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
                  {c.domain && <span style={{ fontSize: '0.75rem', color: '#71717a', display: 'flex', alignItems: 'center', gap: '3px' }}><Globe size={10} />{c.domain}</span>}
                  {c.industry && <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{c.industry}</span>}
                  {c.website && <span style={{ fontSize: '0.75rem', color: '#52525b' }}>{c.website}</span>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '4px', flexShrink: 0 }}>
                <button onClick={() => openEdit(c)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}><Edit2 size={13} /></button>
                <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', color: '#52525b', cursor: 'pointer', padding: '6px', borderRadius: '6px' }}><Trash2 size={13} /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Company' : 'New Company'}>
        <Field label="Company Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp" /></Field>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label="Domain"><Input value={form.domain} onChange={e => setForm({ ...form, domain: e.target.value })} placeholder="acme.com" /></Field>
          <Field label="Website"><Input value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="https://acme.com" /></Field>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label="Industry"><Input value={form.industry} onChange={e => setForm({ ...form, industry: e.target.value })} placeholder="SaaS, Finance, Healthcare..." /></Field>
          <Field label="Size"><Sel value={form.size} onChange={e => setForm({ ...form, size: e.target.value })} options={[{ value: '', label: 'Select size' }, { value: 'startup', label: 'Startup' }, { value: 'smb', label: 'SMB' }, { value: 'mid', label: 'Mid-Market' }, { value: 'enterprise', label: 'Enterprise' }]} /></Field>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Btn onClick={() => setShowModal(false)} color="#27272a">Cancel</Btn>
          <Btn onClick={handleSave} loading={saving} disabled={!form.name.trim()}>{editing ? 'Save Changes' : 'Add Company'}</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ---- PIPELINE TAB ----
function PipelineTab() {
  const [deals, setDeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', value: '', stage: 'lead', expected_close: '', notes: '' });

  async function load() {
    setLoading(true);
    try {
      const r = await mcApi('/api/crm/deals?limit=100');
      const d = await r.json();
      setDeals(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await mcApi('/api/crm/deals', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: form.name, value: form.value ? parseFloat(form.value) : null, stage: form.stage, expected_close: form.expected_close || null, notes: form.notes || null }) });
      setShowModal(false);
      setForm({ name: '', value: '', stage: 'lead', expected_close: '', notes: '' });
      load();
    } catch { setSaving(false); }
  }

  async function moveDeal(deal: any, toStage: string) {
    if (deal.stage === toStage) return;
    await mcApi(`/api/crm/deals/${deal.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ stage: toStage }) });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this deal?')) return;
    await mcApi(`/api/crm/deals/${id}`, { method: 'DELETE' });
    load();
  }

  const dealsByStage = STAGES.reduce((acc, s) => { acc[s.id] = deals.filter(d => d.stage === s.id); return acc; }, {} as Record<string, any[]>);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
        <Btn onClick={() => { setForm({ name: '', value: '', stage: 'lead', expected_close: '', notes: '' }); setShowModal(true); }}><Plus size={13} /> New Deal</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46' }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : (
        <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', paddingBottom: '8px' }}>
          {STAGES.map(stage => (
            <div key={stage.id} style={{ flex: '1', minWidth: '170px', backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '12px', padding: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: stage.color }} />
                  <span style={{ color: 'white', fontSize: '0.78rem', fontWeight: 600 }}>{stage.label}</span>
                </div>
                <span style={{ backgroundColor: '#18181b', color: '#71717a', fontSize: '0.7rem', padding: '1px 8px', borderRadius: '20px' }}>{dealsByStage[stage.id]?.length || 0}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                {(dealsByStage[stage.id] || []).map(deal => (
                  <div key={deal.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '11px 12px' }}>
                    <div style={{ color: 'white', fontSize: '0.82rem', fontWeight: 500, marginBottom: '3px' }}>{deal.name}</div>
                    {deal.value && <div style={{ color: '#22c55e', fontSize: '0.75rem', fontWeight: 600 }}>${Number(deal.value).toLocaleString()}</div>}
                    {deal.contact?.name && <div style={{ color: '#71717a', fontSize: '0.72rem', marginTop: '2px' }}>{deal.contact.name}</div>}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '7px' }}>
                      {STAGES.filter(s => s.id !== deal.stage).map(s => (
                        <button key={s.id} onClick={() => moveDeal(deal, s.id)} title={`Move to ${s.label}`} style={{ background: 'none', border: '1px solid #27272a', borderRadius: '5px', width: '22px', height: '22px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: s.color }} />
                        </button>
                      ))}
                      <button onClick={() => handleDelete(deal.id)} style={{ background: 'none', border: 'none', marginLeft: 'auto', color: '#3f3f46', cursor: 'pointer', padding: '2px' }}><Trash2 size={11} /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Deal">
        <Field label="Deal Name *"><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Acme Corp â€” $50k contract" /></Field>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label="Value ($)"><Input value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="50000" type="number" /></Field>
          <Field label="Stage"><Sel value={form.stage} onChange={e => setForm({ ...form, stage: e.target.value })} options={STAGES.map(s => ({ value: s.id, label: s.label }))} /></Field>
        </div>
        <Field label="Expected Close"><Input value={form.expected_close} onChange={e => setForm({ ...form, expected_close: e.target.value })} type="date" /></Field>
        <Field label="Notes"><TxtArea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Deal notes..." /></Field>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Btn onClick={() => setShowModal(false)} color="#27272a">Cancel</Btn>
          <Btn onClick={handleSave} loading={saving} disabled={!form.name.trim()}>Create Deal</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ---- ACTIVITIES TAB ----
function ActivitiesTab() {
  const [activities, setActivities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');

  async function load() {
    setLoading(true);
    let url = '/api/crm/activities?limit=100';
    if (typeFilter) url += `&type=${encodeURIComponent(typeFilter)}`;
    try {
      const r = await mcApi(url);
      const d = await r.json();
      setActivities(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [typeFilter]);

  const actConfig = (type: string) => ACTIVITY_CONFIG[type as ActivityType] || { label: type, color: '#71717a' };
  const actIcon = (type: string) => {
    const map: Record<string, any> = { scrape_run: Zap, post_published: Send, dm_sent: MessageSquare, dm_reply: MessageSquare, contact_created: User, deal_created: DollarSign, deal_stage_changed: ArrowRight, note_added: FileText, task_completed: CheckCircle, api_import: ExternalLink };
    return map[type] || Activity;
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)} style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.82rem', outline: 'none' }}>
          <option value="">All activities</option>
          <option value="scrape_run">Scrape Runs</option>
          <option value="post_published">Posts Published</option>
          <option value="dm_sent">DMs Sent</option>
          <option value="dm_reply">DM Replies</option>
          <option value="contact_created">Contacts Created</option>
          <option value="deal_created">Deals Created</option>
          <option value="deal_stage_changed">Deal Stage Changes</option>
          <option value="note_added">Notes Added</option>
          <option value="task_completed">Tasks Completed</option>
          <option value="api_import">API Imports</option>
        </select>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46' }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : activities.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46', fontSize: '0.85rem' }}>No activities recorded yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {activities.map(a => {
            const IconComp = actIcon(a.type);
            const cfg = actConfig(a.type);
            return (
              <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '12px 14px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: cfg.color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
                  <IconComp size={14} style={{ color: cfg.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '2px' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white' }}>{a.summary}</span>
                    <Badge color={cfg.color}>{cfg.label}</Badge>
                  </div>
                  {a.details && Object.keys(a.details).length > 0 && (
                    <div style={{ fontSize: '0.72rem', color: '#52525b', marginTop: '2px' }}>
                      {a.actor && <span style={{ textTransform: 'capitalize' }}>by {a.actor} Â· </span>}
                      {a.created_at && timeAgo(a.created_at)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---- TASKS TAB ----
function TasksTab() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', due_at: '', priority: 'medium' });

  async function load() {
    setLoading(true);
    let url = '/api/crm/tasks?limit=100';
    if (filter === 'active') url += '&completed=false';
    else if (filter === 'overdue') url += '&overdue=true';
    else if (filter === 'done') url += '&completed=true';
    try {
      const r = await mcApi(url);
      const d = await r.json();
      setTasks(Array.isArray(d) ? d : []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, [filter]);

  async function toggleComplete(task: any) {
    await mcApi('/api/crm/tasks/' + task.id, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ completed: !task.completed }) });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this task?')) return;
    await mcApi('/api/crm/tasks/' + id, { method: 'DELETE' });
    load();
  }

  async function handleSave() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      await mcApi('/api/crm/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title: form.title, description: form.description || null, due_at: form.due_at || null, priority: form.priority }) });
      setShowModal(false);
      setForm({ title: '', description: '', due_at: '', priority: 'medium' });
      load();
    } catch { setSaving(false); }
  }

  const priorityColors: Record<string, string> = { low: '#71717a', medium: '#f97316', high: '#ef4444' };
  const isOverdue = (t: any) => t.due_at && !t.completed && new Date(t.due_at) < new Date();

  return (
    <div>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <select value={filter} onChange={e => setFilter(e.target.value)} style={{ backgroundColor: '#09090b', border: '1px solid #27272a', borderRadius: '8px', padding: '8px 12px', color: 'white', fontSize: '0.82rem', outline: 'none' }}>
          <option value="">All tasks</option>
          <option value="active">Active</option>
          <option value="overdue">Overdue</option>
          <option value="done">Completed</option>
        </select>
        <Btn onClick={() => { setForm({ title: '', description: '', due_at: '', priority: 'medium' }); setShowModal(true); }}><Plus size={13} /> New Task</Btn>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46' }}><Loader2 size={22} style={{ animation: 'spin 1s linear infinite' }} /></div>
      ) : tasks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px', color: '#3f3f46', fontSize: '0.85rem' }}>No tasks yet.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
          {tasks.map(t => (
            <div key={t.id} style={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '10px', padding: '12px 14px', display: 'flex', alignItems: 'center', gap: '10px', opacity: t.completed ? 0.55 : 1 }}>
              <button onClick={() => toggleComplete(t)} style={{ background: 'none', border: '2px solid', borderColor: t.completed ? '#22c55e' : '#3f3f46', borderRadius: '50%', width: '20px', height: '20px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0 }}>
                {t.completed && <CheckCircle size={12} style={{ color: '#22c55e' }} />}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ color: 'white', fontSize: '0.85rem', fontWeight: 500, textDecoration: t.completed ? 'line-through' : 'none' }}>{t.title}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px', flexWrap: 'wrap' }}>
                  {t.due_at && <span style={{ fontSize: '0.72rem', color: isOverdue(t) ? '#ef4444' : '#71717a', display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={10} />{new Date(t.due_at).toLocaleDateString()}</span>}
                  <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: '20px', backgroundColor: (priorityColors[t.priority] || '#71717a') + '22', color: priorityColors[t.priority] || '#71717a', fontWeight: 600 }}>{t.priority}</span>
                  {isOverdue(t) && <span style={{ fontSize: '0.65rem', color: '#ef4444' }}>Overdue</span>}
                </div>
              </div>
              <button onClick={() => handleDelete(t.id)} style={{ background: 'none', border: 'none', color: '#3f3f46', cursor: 'pointer', padding: '4px' }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={showModal} onClose={() => setShowModal(false)} title="New Task">
        <Field label="Task Title *"><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Follow up with Acme Corp" /></Field>
        <Field label="Description"><TxtArea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Details about this task..." /></Field>
        <div style={{ display: 'flex', gap: '10px' }}>
          <Field label="Due Date"><Input value={form.due_at} onChange={e => setForm({ ...form, due_at: e.target.value })} type="date" /></Field>
          <Field label="Priority"><Sel value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} options={[{ value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' }]} /></Field>
        </div>
        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Btn onClick={() => setShowModal(false)} color="#27272a">Cancel</Btn>
          <Btn onClick={handleSave} loading={saving} disabled={!form.title.trim()}>Create Task</Btn>
        </div>
      </Modal>
    </div>
  );
}

// ---- MAIN PAGE ----
export default function CrmPage() {
  const [activeTab, setActiveTab] = useState<Tab>('contacts');

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: 'contacts', label: 'Contacts', icon: Users },
    { id: 'companies', label: 'Companies', icon: Building2 },
    { id: 'pipeline', label: 'Pipeline', icon: PieChart },
    { id: 'activities', label: 'Activities', icon: Activity },
    { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  ];

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 16px 80px' }}>


      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'white' }}>CRM</h1>
          <p style={{ color: '#71717a', fontSize: '0.8rem', marginTop: '2px' }}>Contacts Â· Companies Â· Pipeline Â· Activities Â· Tasks</p>
        </div>
      </div>

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', backgroundColor: '#09090b', padding: '5px', borderRadius: '12px', border: '1px solid #18181b', width: 'fit-content' }}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, backgroundColor: active ? '#27272a' : 'transparent', color: active ? 'white' : '#71717a', transition: 'all 0.15s' }}>
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div>
        {activeTab === 'contacts' && <ContactsTab />}
        {activeTab === 'companies' && <CompaniesTab />}
        {activeTab === 'pipeline' && <PipelineTab />}
        {activeTab === 'activities' && <ActivitiesTab />}
        {activeTab === 'tasks' && <TasksTab />}
      </div>
    </div>
  );
}
