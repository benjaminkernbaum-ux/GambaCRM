import React, { useState, useMemo, useCallback } from 'react';
import {
  Globe,
  Trash2,
  ChevronDown,
  Table2,
  LayoutGrid,
  Download,
  Search,
  Mail,
  MessageCircle,
  Copy,
  Check,
  Phone,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SEG_META,
  SEG_GROUPS,
  MOCK_LEADS,
  SegmentKey,
  PipelineLead,
  AGENTS,
  cn,
} from './types';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
  const parts = name.trim().split(' ');
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
}

function cleanPhone(phone: string) {
  // "+55 11 99012-3456" → "5511990123456"
  return phone.replace(/\D/g, '');
}

function exportCSV(leads: PipelineLead[]) {
  const header = 'ID,CRM ID,Name,Email,Phone,Segment,Channel,Stage,Assigned To,Updated At,Deposit Amount';
  const rows = leads.map((l) =>
    [l.id, l.crmId, l.name, l.email, l.phone, l.segment, l.channel, l.stage, l.assignedTo, l.updatedAt, l.depositAmount ?? ''].join(',')
  );
  const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'gamba_leads.csv';
  a.click();
  URL.revokeObjectURL(url);
}

// ─── Small badge components ────────────────────────────────────────────────────

function SegPill({ segKey }: { segKey: SegmentKey }) {
  const meta = SEG_META.find((s) => s.key === segKey);
  if (!meta) return null;
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
      style={{ background: meta.color + '22', color: meta.color, border: `1px solid ${meta.color}44` }}
    >
      <span>{meta.icon}</span>
      {meta.label}
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
    <span
      className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold"
      style={{ background: style.bg, color: style.color, border: `1px solid ${style.color}44` }}
    >
      {stage.replace('_', ' ')}
    </span>
  );
}

// ─── Segment Overview Cards ────────────────────────────────────────────────────

const OVERVIEW_SEGMENTS: SegmentKey[] = [
  'DOCS_VERIFIED', 'HIGH_INTENT_DEPOSIT', 'PIX_READY',
  'FAILED_DEPOSIT', 'NO_ANSWER', 'REASSIGNED',
];

function SegmentOverview({ leads }: { leads: PipelineLead[] }) {
  const total = leads.length || 1;
  return (
    <div className="grid grid-cols-6 gap-3 px-6 pt-5 pb-4">
      {OVERVIEW_SEGMENTS.map((key) => {
        const meta = SEG_META.find((s) => s.key === key)!;
        const count = leads.filter((l) => l.segment === key).length;
        const pct = Math.round((count / total) * 100);
        return (
          <div
            key={key}
            className="rounded-xl p-4 flex flex-col gap-2"
            style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}
          >
            <div className="flex items-center justify-between">
              <span className="text-xl">{meta.icon}</span>
              <span className="text-[10px] font-mono" style={{ color: meta.color }}>{pct}%</span>
            </div>
            <div className="text-2xl font-black text-white leading-none">{count}</div>
            <div className="text-[11px] font-medium leading-tight" style={{ color: '#64748b' }}>{meta.label}</div>
            <div className="h-1 rounded-full overflow-hidden" style={{ background: '#1a1a35' }}>
              <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.color }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Segment Dropdown ─────────────────────────────────────────────────────────

function SegmentDropdown({
  value,
  onChange,
}: {
  value: SegmentKey | 'all';
  onChange: (v: SegmentKey | 'all') => void;
}) {
  const [open, setOpen] = useState(false);
  const current = value === 'all' ? null : SEG_META.find((s) => s.key === value);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all"
        style={{ background: '#0d0d22', border: '1px solid #1a1a35', color: '#94a3b8', minWidth: 160 }}
      >
        {current ? (
          <>
            <span>{current.icon}</span>
            <span style={{ color: current.color }}>{current.label}</span>
          </>
        ) : (
          <span>All Segments</span>
        )}
        <ChevronDown size={12} className="ml-auto" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.1 }}
            className="absolute top-full mt-1 left-0 z-50 rounded-xl overflow-hidden py-1"
            style={{ background: '#0d0d22', border: '1px solid #1a1a35', minWidth: 200, maxHeight: 320, overflowY: 'auto' }}
          >
            <button
              className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-white/5 text-left"
              style={{ color: '#94a3b8' }}
              onClick={() => { onChange('all'); setOpen(false); }}
            >
              All Segments
            </button>
            {SEG_GROUPS.map((g) => (
              <React.Fragment key={g.key}>
                <div className="px-3 py-1 text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>
                  {g.label}
                </div>
                {SEG_META.filter((s) => s.group === g.key).map((s) => (
                  <button
                    key={s.key}
                    className="w-full flex items-center gap-2 px-3 py-2 text-[12px] font-medium hover:bg-white/5 text-left"
                    onClick={() => { onChange(s.key); setOpen(false); }}
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
  );
}

// ─── Action Buttons ───────────────────────────────────────────────────────────

function ActionButtons({ lead }: { lead: PipelineLead }) {
  const [copied, setCopied] = useState(false);

  const openCRM = () => {
    window.open(`https://crmbeta.gambacrm.com/client/client-profile/${lead.crmId}/`, '_blank');
  };

  const openWA = () => {
    const phone = cleanPhone(lead.phone);
    window.open(`https://wa.me/${phone}`, '_blank');
  };

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(lead.email);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const el = document.createElement('textarea');
      el.value = lead.email;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
      {/* Open in CRM */}
      <button
        onClick={openCRM}
        className="p-1.5 rounded-lg transition-all hover:bg-white/10"
        style={{ color: '#6366f1' }}
        title={`Open in CRM (#${lead.crmId})`}
      >
        <Globe size={13} />
      </button>

      {/* Open WhatsApp */}
      <button
        onClick={openWA}
        className="p-1.5 rounded-lg transition-all"
        style={{ color: '#25d366' }}
        title={`Open WhatsApp — ${lead.phone}`}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#25d36618')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Phone size={13} />
      </button>

      {/* Copy email */}
      <button
        onClick={copyEmail}
        className="p-1.5 rounded-lg transition-all"
        style={{ color: copied ? '#10b981' : '#64748b' }}
        title={`Copy email — ${lead.email}`}
        onMouseEnter={(e) => (e.currentTarget.style.background = '#ffffff10')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
      </button>
    </div>
  );
}

// ─── Table View ───────────────────────────────────────────────────────────────

function TableView({ leads }: { leads: PipelineLead[] }) {
  const [page, setPage] = useState(0);
  const PAGE = 50;
  const total = leads.length;
  const pages = Math.ceil(total / PAGE);
  const slice = leads.slice(page * PAGE, (page + 1) * PAGE);

  const getAccent = (seg: SegmentKey) => SEG_META.find((s) => s.key === seg)?.color ?? '#334155';

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr style={{ borderBottom: '1px solid #1a1a35' }}>
              {['LEAD', 'SEGMENT', 'CHANNEL', 'STAGE', 'CONTACT', 'ASSIGNED', 'LAST ACTIVE', 'ACTIONS'].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-[9px] font-mono tracking-widest uppercase"
                  style={{ color: '#334155' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {slice.map((lead) => {
              const accent = getAccent(lead.segment);
              const inits = initials(lead.name);
              return (
                <tr
                  key={lead.id}
                  className="group transition-colors hover:bg-white/[0.02]"
                  style={{ borderBottom: '1px solid #1a1a3522' }}
                >
                  {/* Left accent bar + name */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-0.5 h-8 rounded-full shrink-0"
                        style={{ background: accent }}
                      />
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                        style={{ background: accent + '22', color: accent, border: `1px solid ${accent}44` }}
                      >
                        {inits.toUpperCase()}
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
                    <ActionButtons lead={lead} />
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
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(pages, 8) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className="w-7 h-7 rounded-lg text-[11px] font-mono transition-colors"
                style={
                  i === page
                    ? { background: '#6366f1', color: '#fff' }
                    : { color: '#475569', background: 'transparent' }
                }
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Kanban View ──────────────────────────────────────────────────────────────

function KanbanView({ leads }: { leads: PipelineLead[] }) {
  const columns = SEG_GROUPS.map((g) => ({
    ...g,
    segments: SEG_META.filter((s) => s.group === g.key),
    leads: leads.filter((l) => SEG_META.find((s) => s.key === l.segment && s.group === g.key)),
  }));

  return (
    <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
      {columns.map((col) => (
        <div key={col.key} className="shrink-0 w-64">
          <div
            className="rounded-xl overflow-hidden"
            style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}
          >
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderBottom: '1px solid #1a1a35' }}
            >
              <span className="text-[12px] font-bold" style={{ color: col.color }}>{col.label}</span>
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ background: col.color + '22', color: col.color }}
              >
                {col.leads.length}
              </span>
            </div>
            <div className="p-2 space-y-2 max-h-96 overflow-y-auto">
              {col.leads.slice(0, 20).map((lead) => {
                const meta = SEG_META.find((s) => s.key === lead.segment)!;
                return (
                  <div
                    key={lead.id}
                    className="p-3 rounded-lg"
                    style={{ background: '#05050f', border: '1px solid #1a1a35' }}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black shrink-0"
                        style={{ background: meta.color + '22', color: meta.color }}
                      >
                        {initials(lead.name).toUpperCase()}
                      </div>
                      <div>
                        <div className="text-[11px] font-semibold text-white leading-tight">{lead.name}</div>
                        <div className="text-[9px] font-mono" style={{ color: '#334155' }}>#{lead.crmId}</div>
                      </div>
                    </div>
                    <SegPill segKey={lead.segment} />
                  </div>
                );
              })}
              {col.leads.length > 20 && (
                <div className="text-center text-[10px] py-2" style={{ color: '#334155' }}>
                  +{col.leads.length - 20} more
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Main PipelineView ────────────────────────────────────────────────────────

export function PipelineView() {
  const [segFilter, setSegFilter] = useState<SegmentKey | 'all'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'email' | 'wa'>('all');
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');

  const filtered = useMemo(() => {
    return MOCK_LEADS.filter((l) => {
      if (segFilter !== 'all' && l.segment !== segFilter) return false;
      if (channelFilter !== 'all' && l.channel !== channelFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!l.name.toLowerCase().includes(q) && !l.crmId.includes(q) && !l.email.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [segFilter, channelFilter, search]);

  return (
    <div className="min-h-full" style={{ background: '#05050f' }}>

      {/* Segment Overview */}
      <SegmentOverview leads={MOCK_LEADS} />

      {/* Filter Toolbar */}
      <div className="px-6 pb-4">
        <div
          className="rounded-xl p-4 flex items-center gap-3 flex-wrap"
          style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}
        >
          {/* Segment dropdown */}
          <SegmentDropdown value={segFilter} onChange={setSegFilter} />

          {/* Channel toggles */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
            {(['all', 'email', 'wa'] as const).map((c) => (
              <button
                key={c}
                onClick={() => setChannelFilter(c)}
                className="px-3 py-1.5 rounded-md text-[11px] font-semibold transition-all capitalize"
                style={
                  channelFilter === c
                    ? { background: '#6366f1', color: '#fff' }
                    : { color: '#475569' }
                }
              >
                {c === 'all' ? 'All' : c === 'wa' ? 'WhatsApp' : 'Email'}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#334155' }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, ID, email…"
              className="w-full pl-8 pr-3 py-2 rounded-lg text-[12px] outline-none placeholder:text-[#334155]"
              style={{ background: '#05050f', border: '1px solid #1a1a35', color: '#94a3b8' }}
            />
          </div>

          {/* Count */}
          <span className="text-[12px] font-mono ml-auto" style={{ color: '#475569' }}>
            <span className="text-white font-bold">{filtered.length}</span> leads
          </span>

          {/* View mode */}
          <div className="flex items-center gap-1 rounded-lg p-1" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
            <button
              onClick={() => setViewMode('table')}
              className="p-1.5 rounded-md transition-all"
              style={viewMode === 'table' ? { background: '#6366f1', color: '#fff' } : { color: '#475569' }}
            >
              <Table2 size={14} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className="p-1.5 rounded-md transition-all"
              style={viewMode === 'kanban' ? { background: '#6366f1', color: '#fff' } : { color: '#475569' }}
            >
              <LayoutGrid size={14} />
            </button>
          </div>

          {/* Export */}
          <button
            onClick={() => exportCSV(filtered)}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all"
            style={{ background: '#05050f', border: '1px solid #1a1a35', color: '#6366f1' }}
          >
            <Download size={13} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 pb-6">
        <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={viewMode}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.12 }}
            >
              {viewMode === 'table' ? (
                <TableView leads={filtered} />
              ) : (
                <KanbanView leads={filtered} />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
