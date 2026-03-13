import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import {
  Globe, Trash2, ChevronDown, Table2, LayoutGrid, Download, Search,
  Mail, MessageCircle, Copy, Check, Phone, X, ChevronUp, ChevronRight,
  ExternalLink, ArrowUpDown, Filter, Layers, SlidersHorizontal, RefreshCw,
  TrendingUp, Users, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SEG_META, SEG_GROUPS, MOCK_LEADS, SegmentKey, PipelineLead, AGENTS, cn,
} from './types';
import { api } from './api';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function cleanPhone(phone: string) {
  return phone.replace(/\D/g, '');
}

function fmtDeposit(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function exportCSV(leads: PipelineLead[]) {
  const header = 'ID,CRM ID,Name,Email,Phone,Segment,Channel,Stage,Assigned To,Updated At,Deposit Amount';
  const rows = leads.map((l) =>
    [l.id, l.crmId, l.name, l.email, l.phone, l.segment, l.channel, l.stage,
     l.assignedTo, l.updatedAt, l.depositAmount ?? ''].join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'gamba_pipeline.csv'; a.click();
  URL.revokeObjectURL(url);
}

// ─── Badges ───────────────────────────────────────────────────────────────────

function SegPill({ segKey, size = 'md' }: { segKey: SegmentKey; size?: 'sm' | 'md' }) {
  const meta = SEG_META.find((s) => s.key === segKey);
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap"
      style={{
        background: meta.color + '22', color: meta.color,
        border: `1px solid ${meta.color}44`,
        padding: size === 'sm' ? '1px 6px' : '2px 8px',
        fontSize: size === 'sm' ? 9 : 10,
      }}
    >
      <span>{meta.icon}</span>{meta.label}
    </span>
  );
}

function ChannelBadge({ channel }: { channel: 'email' | 'wa' }) {
  return channel === 'wa' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: '#25d36622', color: '#25d366', border: '1px solid #25d36644' }}>
      <MessageCircle size={9} /> WA
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: '#6366f122', color: '#818cf8', border: '1px solid #6366f144' }}>
      <Mail size={9} /> Email
    </span>
  );
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { color: string; bg: string }> = {
    STAGE_1: { color: '#3b82f6', bg: '#3b82f622' },
    STAGE_2: { color: '#8b5cf6', bg: '#8b5cf622' },
    STAGE_3: { color: '#f97316', bg: '#f9731622' },
  };
  const style = map[stage] ?? { color: '#64748b', bg: '#64748b22' };
  return (
    <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}44` }}>
      {stage.replace('_', ' ')}
    </span>
  );
}

// ─── All-Segment Overview (all 22 segments in scrollable grid) ─────────────────

function SegmentOverview({
  leads,
  liveCounts,
  activeFilter,
  onFilter,
}: {
  leads: PipelineLead[];
  liveCounts: Record<string, number> | null;
  activeFilter: SegmentKey | 'all';
  onFilter: (k: SegmentKey | 'all') => void;
}) {
  const total = leads.length || 1;
  return (
    <div className="px-6 pt-5 pb-3">
      {/* Group rows */}
      {SEG_GROUPS.map((group) => {
        const segs = SEG_META.filter((s) => s.group === group.key);
        return (
          <div key={group.key} className="mb-3">
            <div
              className="text-[9px] font-mono tracking-[0.25em] uppercase mb-2 flex items-center gap-2"
              style={{ color: group.color }}
            >
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: group.color }} />
              {group.label}
            </div>
            <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${segs.length}, minmax(0,1fr))` }}>
              {segs.map((seg) => {
                const count = liveCounts?.[seg.key] ?? leads.filter((l) => l.segment === seg.key).length;
                const pct = Math.round((count / total) * 100);
                const isActive = activeFilter === seg.key;
                return (
                  <button
                    key={seg.key}
                    onClick={() => onFilter(isActive ? 'all' : seg.key)}
                    className="rounded-xl p-3 flex flex-col gap-1.5 text-left transition-all hover:scale-[1.02]"
                    style={{
                      background: isActive ? seg.color + '22' : '#0d0d22',
                      border: `1px solid ${isActive ? seg.color + '66' : '#1a1a35'}`,
                      boxShadow: isActive ? `0 0 12px ${seg.color}22` : 'none',
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-base leading-none">{seg.icon}</span>
                      <span className="text-[9px] font-mono" style={{ color: seg.color }}>{pct}%</span>
                    </div>
                    <div className="text-xl font-black text-white leading-none">{count}</div>
                    <div className="text-[9px] font-medium leading-tight" style={{ color: '#64748b' }}>{seg.label}</div>
                    <div className="h-0.5 rounded-full" style={{ background: '#1a1a35' }}>
                      <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: seg.color }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Lead Detail Panel ────────────────────────────────────────────────────────

function LeadDetailPanel({
  lead,
  onClose,
  onSegmentMove,
}: {
  lead: PipelineLead;
  onClose: () => void;
  onSegmentMove: (lead: PipelineLead, seg: SegmentKey) => void;
}) {
  const meta = SEG_META.find((s) => s.key === lead.segment)!;
  const [segOpen, setSegOpen] = useState(false);
  const [copied, setCopied] = useState<'email' | 'phone' | null>(null);

  const copy = async (text: string, field: 'email' | 'phone') => {
    try { await navigator.clipboard.writeText(text); } catch {}
    setCopied(field);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <motion.div
      initial={{ x: 380, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 380, opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 320 }}
      className="fixed right-0 top-0 h-full w-96 z-[100] flex flex-col overflow-hidden"
      style={{ background: '#080d18', borderLeft: `1px solid ${meta.color}44`, boxShadow: `-8px 0 40px ${meta.color}18` }}
    >
      {/* Header */}
      <div className="px-5 pt-5 pb-4 flex items-start justify-between" style={{ borderBottom: `1px solid ${meta.color}22` }}>
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black"
            style={{ background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44` }}
          >
            {initials(lead.name).toUpperCase()}
          </div>
          <div>
            <div className="font-bold text-white text-[15px] leading-tight">{lead.name}</div>
            <div className="text-[11px] font-mono mt-0.5" style={{ color: '#475569' }}>#{lead.crmId}</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: '#64748b' }}>
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4">

        {/* Current Segment */}
        <div>
          <div className="text-[9px] font-mono tracking-widest uppercase mb-2" style={{ color: '#334155' }}>Current Segment</div>
          <SegPill segKey={lead.segment} />
        </div>

        {/* Contact */}
        <div className="rounded-xl p-4 space-y-3" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>Contact</div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px]" style={{ color: '#475569' }}>Email</div>
              <div className="text-[12px] text-white font-medium">{lead.email}</div>
            </div>
            <button onClick={() => copy(lead.email, 'email')} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: copied === 'email' ? '#10b981' : '#475569' }}>
              {copied === 'email' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[10px]" style={{ color: '#475569' }}>Phone</div>
              <div className="text-[12px] text-white font-medium">{lead.phone}</div>
            </div>
            <button onClick={() => copy(lead.phone, 'phone')} className="p-1.5 rounded-lg hover:bg-white/10" style={{ color: copied === 'phone' ? '#10b981' : '#475569' }}>
              {copied === 'phone' ? <Check size={12} /> : <Copy size={12} />}
            </button>
          </div>
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Channel',    value: <ChannelBadge channel={lead.channel} /> },
            { label: 'Stage',      value: <StageBadge stage={lead.stage} /> },
            { label: 'Assigned',   value: <span className="text-[12px] font-semibold" style={{ color: '#6366f1' }}>{lead.assignedTo}</span> },
            { label: 'Last Active', value: <span className="text-[12px] font-mono" style={{ color: '#94a3b8' }}>{lead.updatedAt}</span> },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-3" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
              <div className="text-[9px] font-mono tracking-widest uppercase mb-1.5" style={{ color: '#334155' }}>{label}</div>
              {value}
            </div>
          ))}
        </div>

        {/* Deposit */}
        {lead.depositAmount !== undefined && (
          <div className="rounded-xl p-4" style={{ background: '#0d0d22', border: '1px solid #10b98133' }}>
            <div className="text-[9px] font-mono tracking-widest uppercase mb-1" style={{ color: '#334155' }}>Deposit Amount</div>
            <div className="text-2xl font-black" style={{ color: '#10b981' }}>{fmtDeposit(lead.depositAmount)}</div>
          </div>
        )}

        {/* Move Segment */}
        <div>
          <div className="text-[9px] font-mono tracking-widest uppercase mb-2" style={{ color: '#334155' }}>Move to Segment</div>
          <div className="relative">
            <button
              onClick={() => setSegOpen((o) => !o)}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[12px] font-medium"
              style={{ background: '#0d0d22', border: '1px solid #1a1a35', color: '#94a3b8' }}
            >
              <span>Select segment…</span>
              <ChevronDown size={12} className="ml-auto" />
            </button>
            <AnimatePresence>
              {segOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                  className="absolute bottom-full mb-1 left-0 right-0 z-50 rounded-xl overflow-hidden py-1"
                  style={{ background: '#0d0d22', border: '1px solid #1a1a35', maxHeight: 260, overflowY: 'auto' }}
                >
                  {SEG_GROUPS.map((g) => (
                    <React.Fragment key={g.key}>
                      <div className="px-3 py-1 text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>{g.label}</div>
                      {SEG_META.filter((s) => s.group === g.key).map((s) => (
                        <button
                          key={s.key}
                          disabled={s.key === lead.segment}
                          className="w-full flex items-center gap-2 px-3 py-2 text-[12px] hover:bg-white/5 text-left disabled:opacity-30"
                          onClick={() => { onSegmentMove(lead, s.key); setSegOpen(false); }}
                        >
                          <span>{s.icon}</span>
                          <span style={{ color: s.color }}>{s.label}</span>
                        </button>
                      ))}
                    </React.Fragment>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="p-5 space-y-2" style={{ borderTop: '1px solid #1a1a35' }}>
        <a
          href={`https://crmbeta.gambacrm.com/client/client-profile/${lead.crmId}/`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[12px] font-bold text-white transition-all"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 16px #6366f133' }}
        >
          <Globe size={13} /> Open in GAMBA CRM
          <ExternalLink size={11} className="ml-auto opacity-60" />
        </a>
        <a
          href={`https://wa.me/${cleanPhone(lead.phone)}`}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-2 w-full px-4 py-2.5 rounded-xl text-[12px] font-bold transition-all"
          style={{ background: '#25d36622', border: '1px solid #25d36644', color: '#25d366' }}
        >
          <Phone size={13} /> Open WhatsApp
          <ExternalLink size={11} className="ml-auto opacity-60" />
        </a>
      </div>
    </motion.div>
  );
}

// ─── Segment Dropdown ─────────────────────────────────────────────────────────

function SegmentDropdown({ value, onChange }: { value: SegmentKey | 'all'; onChange: (v: SegmentKey | 'all') => void }) {
  const [open, setOpen] = useState(false);
  const current = value === 'all' ? null : SEG_META.find((s) => s.key === value);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all"
        style={{ background: '#0d0d22', border: '1px solid #1a1a35', color: '#94a3b8', minWidth: 160 }}
      >
        {current ? <><span>{current.icon}</span><span style={{ color: current.color }}>{current.label}</span></> : <span>All Segments</span>}
        <ChevronDown size={12} className="ml-auto" />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-hidden py-1"
            style={{ background: '#0d0d22', border: '1px solid #1a1a35', minWidth: 200, maxHeight: 320, overflowY: 'auto' }}
          >
            <button className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-white/5 text-left" style={{ color: '#94a3b8' }}
              onClick={() => { onChange('all'); setOpen(false); }}>All Segments</button>
            {SEG_GROUPS.map((g) => (
              <React.Fragment key={g.key}>
                <div className="px-3 py-1 text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>{g.label}</div>
                {SEG_META.filter((s) => s.group === g.key).map((s) => (
                  <button key={s.key} className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-white/5 text-left"
                    onClick={() => { onChange(s.key); setOpen(false); }}>
                    <span>{s.icon}</span><span style={{ color: s.color }}>{s.label}</span>
                  </button>
                ))}
              </React.Fragment>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

type SortKey = 'name' | 'segment' | 'stage' | 'assignedTo' | 'updatedAt' | 'depositAmount';

function TableView({ leads, onSelect }: { leads: PipelineLead[]; onSelect: (l: PipelineLead) => void }) {
  const [page, setPage] = useState(0);
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const PAGE = 50;

  const sorted = useMemo(() => {
    return [...leads].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [leads, sortKey, sortDir]);

  const pages = Math.ceil(sorted.length / PAGE);
  const slice = sorted.slice(page * PAGE, (page + 1) * PAGE);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
    setPage(0);
  };

  useEffect(() => setPage(0), [leads]);

  const SortTh = ({ k, label }: { k: SortKey; label: string }) => (
    <th
      className="px-4 py-3 text-left text-[9px] font-mono tracking-widest uppercase cursor-pointer select-none group"
      style={{ color: sortKey === k ? '#6366f1' : '#334155' }}
      onClick={() => toggleSort(k)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown size={9} className="opacity-0 group-hover:opacity-100 transition-opacity" />
        {sortKey === k && (sortDir === 'asc' ? <ChevronUp size={9} /> : <ChevronDown size={9} />)}
      </div>
    </th>
  );

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a35' }}>
              <SortTh k="name"          label="Lead" />
              <SortTh k="segment"       label="Segment" />
              <th className="px-4 py-3 text-left text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>Channel</th>
              <SortTh k="stage"         label="Stage" />
              <th className="px-4 py-3 text-left text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>Contact</th>
              <SortTh k="assignedTo"    label="Assigned" />
              <SortTh k="updatedAt"     label="Last Active" />
              <SortTh k="depositAmount" label="Deposit" />
              <th className="px-4 py-3 text-left text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {slice.map((lead) => {
              const accent = SEG_META.find((s) => s.key === lead.segment)?.color ?? '#334155';
              return (
                <tr
                  key={lead.id}
                  className="group transition-colors hover:bg-white/[0.025] cursor-pointer"
                  style={{ borderBottom: '1px solid #1a1a3522' }}
                  onClick={() => onSelect(lead)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-0.5 h-8 rounded-full shrink-0" style={{ background: accent }} />
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                        style={{ background: accent + '22', color: accent, border: `1px solid ${accent}44` }}>
                        {initials(lead.name).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-[12px] leading-tight">{lead.name}</div>
                        <div className="text-[10px] font-mono" style={{ color: '#475569' }}>#{lead.crmId}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><SegPill segKey={lead.segment} /></td>
                  <td className="px-4 py-3"><ChannelBadge channel={lead.channel} /></td>
                  <td className="px-4 py-3"><StageBadge stage={lead.stage} /></td>
                  <td className="px-4 py-3">
                    <div className="text-[11px]" style={{ color: '#64748b' }}>{lead.email}</div>
                    <div className="text-[10px] font-mono" style={{ color: '#334155' }}>{lead.phone}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-medium" style={{ color: '#6366f1' }}>{lead.assignedTo}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[11px] font-mono" style={{ color: '#475569' }}>{lead.updatedAt}</span>
                  </td>
                  <td className="px-4 py-3">
                    {lead.depositAmount !== undefined
                      ? <span className="text-[11px] font-bold font-mono" style={{ color: '#10b981' }}>{fmtDeposit(lead.depositAmount)}</span>
                      : <span style={{ color: '#334155' }}>—</span>}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <a href={`https://crmbeta.gambacrm.com/client/client-profile/${lead.crmId}/`} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: '#6366f1' }} title="Open in CRM">
                        <Globe size={13} />
                      </a>
                      <a href={`https://wa.me/${cleanPhone(lead.phone)}`} target="_blank" rel="noreferrer"
                        className="p-1.5 rounded-lg hover:bg-white/10 transition-all" style={{ color: '#25d366' }} title="WhatsApp">
                        <Phone size={13} />
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #1a1a35' }}>
          <span className="text-[11px] font-mono" style={{ color: '#475569' }}>
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, sorted.length)} of {sorted.length}
          </span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}
              className="px-2 py-1 rounded-lg text-[11px] font-mono disabled:opacity-30" style={{ color: '#6366f1', background: '#6366f111' }}>
              ← Prev
            </button>
            {Array.from({ length: Math.min(pages, 10) }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)}
                className="w-7 h-7 rounded-lg text-[11px] font-mono transition-colors"
                style={i === page ? { background: '#6366f1', color: '#fff' } : { color: '#475569' }}>
                {i + 1}
              </button>
            ))}
            {pages > 10 && <span className="text-[11px] font-mono" style={{ color: '#334155' }}>…{pages}</span>}
            <button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} disabled={page === pages - 1}
              className="px-2 py-1 rounded-lg text-[11px] font-mono disabled:opacity-30" style={{ color: '#6366f1', background: '#6366f111' }}>
              Next →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kanban View (per-segment columns, grouped by category) ────────────────────

function KanbanView({ leads, onSelect }: { leads: PipelineLead[]; onSelect: (l: PipelineLead) => void }) {
  // Show each segment as its own column, grouped in rows by SEG_GROUP
  return (
    <div className="p-4 space-y-6">
      {SEG_GROUPS.map((group) => {
        const segs = SEG_META.filter((s) => s.group === group.key);
        const groupLeads = leads.filter((l) => segs.some((s) => s.key === l.segment));
        if (groupLeads.length === 0) return null;
        return (
          <div key={group.key}>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: group.color }} />
              <span className="text-[10px] font-mono tracking-widest uppercase" style={{ color: group.color }}>{group.label}</span>
              <span className="text-[10px] font-mono" style={{ color: '#334155' }}>({groupLeads.length})</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2">
              {segs.map((seg) => {
                const segLeads = leads.filter((l) => l.segment === seg.key);
                if (segLeads.length === 0) return null;
                return (
                  <div key={seg.key} className="shrink-0 w-56">
                    <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: `1px solid ${seg.color}33` }}>
                      <div className="px-3 py-2.5 flex items-center justify-between" style={{ borderBottom: `1px solid ${seg.color}22` }}>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{seg.icon}</span>
                          <span className="text-[11px] font-bold" style={{ color: seg.color }}>{seg.label}</span>
                        </div>
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold"
                          style={{ background: seg.color + '22', color: seg.color }}>{segLeads.length}</span>
                      </div>
                      <div className="p-2 space-y-1.5 max-h-72 overflow-y-auto">
                        {segLeads.slice(0, 25).map((lead) => (
                          <button key={lead.id} onClick={() => onSelect(lead)}
                            className="w-full p-2.5 rounded-lg text-left transition-all hover:bg-white/5"
                            style={{ background: '#05050f', border: `1px solid ${seg.color}22` }}>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black shrink-0"
                                style={{ background: seg.color + '22', color: seg.color }}>
                                {initials(lead.name).toUpperCase()}
                              </div>
                              <div className="text-[11px] font-semibold text-white truncate leading-tight">{lead.name}</div>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] font-mono" style={{ color: '#334155' }}>#{lead.crmId}</span>
                              <ChannelBadge channel={lead.channel} />
                            </div>
                            {lead.depositAmount !== undefined && (
                              <div className="text-[10px] font-bold font-mono mt-1" style={{ color: '#10b981' }}>
                                {fmtDeposit(lead.depositAmount)}
                              </div>
                            )}
                          </button>
                        ))}
                        {segLeads.length > 25 && (
                          <div className="text-center text-[9px] py-1.5" style={{ color: '#334155' }}>
                            +{segLeads.length - 25} more
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main PipelineView ────────────────────────────────────────────────────────

export function PipelineView() {
  const [segFilter,     setSegFilter]     = useState<SegmentKey | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'wa'>('all');
  const [stageFilter,   setStageFilter]   = useState<'all' | 'STAGE_1' | 'STAGE_2' | 'STAGE_3'>('all');
  const [search,        setSearch]        = useState('');
  const [viewMode,      setViewMode]      = useState<'table' | 'kanban'>('table');
  const [selectedLead,  setSelectedLead]  = useState<PipelineLead | null>(null);
  const [showOverview,  setShowOverview]  = useState(true);
  const [leads,         setLeads]         = useState<PipelineLead[]>(MOCK_LEADS);
  const [liveCounts,    setLiveCounts]    = useState<Record<string, number> | null>(null);

  // Fetch live counts from backend when available
  useEffect(() => {
    api.status().then((res) => {
      if (res && typeof res === 'object' && 'segments' in res) {
        setLiveCounts(res.segments as Record<string, number>);
      }
    });
  }, []);

  const filtered = useMemo(() => {
    return leads.filter((l) => {
      if (segFilter !== 'all' && l.segment !== segFilter) return false;
      if (channelFilter !== 'all' && l.channel !== channelFilter) return false;
      if (stageFilter !== 'all' && l.stage !== stageFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !l.crmId.includes(q) && !l.email.toLowerCase().includes(q) && !l.phone.includes(q)) return false;
      }
      return true;
    });
  }, [leads, segFilter, channelFilter, stageFilter, search]);

  const handleSegmentMove = useCallback((lead: PipelineLead, newSeg: SegmentKey) => {
    setLeads((prev) => prev.map((l) => l.id === lead.id ? { ...l, segment: newSeg } : l));
    setSelectedLead((prev) => prev?.id === lead.id ? { ...prev, segment: newSeg } : prev);
  }, []);

  // Stats
  const hot      = leads.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length;
  const verified = leads.filter((l) => l.segment === 'DOCS_VERIFIED').length;
  const active   = leads.filter((l) => l.segment === 'SKIP_ACTIVE').length;

  return (
    <div className="min-h-full relative" style={{ background: '#05050f' }}>

      {/* ── Top KPI bar ── */}
      <div className="px-6 pt-5 pb-3 flex items-center gap-6" style={{ borderBottom: '1px solid #1a1a35' }}>
        {[
          { label: 'Total Pipeline', value: leads.length, color: '#6366f1', icon: Users },
          { label: 'Hot / PIX Ready', value: hot,      color: '#f97316', icon: Zap },
          { label: 'Docs Verified',  value: verified,  color: '#10b981', icon: TrendingUp },
          { label: 'Active WA',      value: active,    color: '#25d366', icon: MessageCircle },
          { label: 'Showing Now',    value: filtered.length, color: '#8b5cf6', icon: Filter },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '22', color }}>
              <Icon size={13} />
            </div>
            <div>
              <div className="text-xl font-black text-white leading-none">{value}</div>
              <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#334155' }}>{label}</div>
            </div>
          </div>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {liveCounts && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold"
              style={{ background: '#10b98122', color: '#10b981', border: '1px solid #10b98133' }}>
              <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              Live Counts
            </span>
          )}
          <button
            onClick={() => setShowOverview((o) => !o)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all"
            style={{ background: '#0d0d22', border: '1px solid #1a1a35', color: '#64748b' }}
          >
            <Layers size={12} />
            {showOverview ? 'Hide' : 'Show'} Segments
          </button>
        </div>
      </div>

      {/* ── All-segment overview grid ── */}
      <AnimatePresence>
        {showOverview && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: 'hidden', borderBottom: '1px solid #1a1a35' }}
          >
            <SegmentOverview
              leads={leads}
              liveCounts={liveCounts}
              activeFilter={segFilter}
              onFilter={setSegFilter}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filter toolbar ── */}
      <div className="px-6 py-3">
        <div className="rounded-xl p-3 flex items-center gap-3 flex-wrap"
          style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>

          <SlidersHorizontal size={13} style={{ color: '#334155' }} />

          {/* Segment */}
          <SegmentDropdown value={segFilter} onChange={setSegFilter} />

          {/* Channel */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
            {(['all', 'email', 'wa'] as const).map((c) => (
              <button key={c} onClick={() => setChannelFilter(c)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all capitalize"
                style={channelFilter === c ? { background: '#6366f1', color: '#fff' } : { color: '#475569' }}>
                {c === 'all' ? 'All' : c === 'wa' ? 'WhatsApp' : 'Email'}
              </button>
            ))}
          </div>

          {/* Stage */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
            {(['all', 'STAGE_1', 'STAGE_2', 'STAGE_3'] as const).map((s) => (
              <button key={s} onClick={() => setStageFilter(s)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all"
                style={stageFilter === s ? { background: '#6366f1', color: '#fff' } : { color: '#475569' }}>
                {s === 'all' ? 'All Stages' : s.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#334155' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, email, phone…"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none placeholder:text-[#334155]"
              style={{ background: '#05050f', border: '1px solid #1a1a35', color: '#94a3b8' }} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
                <X size={11} />
              </button>
            )}
          </div>

          {/* Active filter chips */}
          {(segFilter !== 'all' || channelFilter !== 'all' || stageFilter !== 'all') && (
            <button
              onClick={() => { setSegFilter('all'); setChannelFilter('all'); setStageFilter('all'); setSearch(''); }}
              className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-semibold transition-all"
              style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#f87171' }}
            >
              <X size={10} /> Clear filters
            </button>
          )}

          <span className="text-[12px] font-mono ml-auto" style={{ color: '#475569' }}>
            <span className="text-white font-bold">{filtered.length}</span> / {leads.length}
          </span>

          {/* View mode */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
            <button onClick={() => setViewMode('table')} className="p-1.5 rounded-md transition-all"
              style={viewMode === 'table' ? { background: '#6366f1', color: '#fff' } : { color: '#475569' }}>
              <Table2 size={14} />
            </button>
            <button onClick={() => setViewMode('kanban')} className="p-1.5 rounded-md transition-all"
              style={viewMode === 'kanban' ? { background: '#6366f1', color: '#fff' } : { color: '#475569' }}>
              <LayoutGrid size={14} />
            </button>
          </div>

          {/* Export */}
          <button onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: '#05050f', border: '1px solid #1a1a35', color: '#6366f1' }}>
            <Download size={13} /> Export CSV
          </button>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="px-6 pb-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <AnimatePresence mode="wait">
            <motion.div key={viewMode} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
              {viewMode === 'table'
                ? <TableView leads={filtered} onSelect={setSelectedLead} />
                : <KanbanView leads={filtered} onSelect={setSelectedLead} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* ── Lead Detail Panel ── */}
      <AnimatePresence>
        {selectedLead && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[99]"
              style={{ background: 'rgba(0,0,0,0.5)' }}
              onClick={() => setSelectedLead(null)}
            />
            <LeadDetailPanel
              lead={selectedLead}
              onClose={() => setSelectedLead(null)}
              onSegmentMove={handleSegmentMove}
            />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
