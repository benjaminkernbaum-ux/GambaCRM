/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  CheckCircle2,
  Clock,
  XCircle,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  LayoutGrid,
  Table2,
  Users,
  TrendingUp,
  Filter,
  X,
  Search,
  Eye,
  MessageCircle,
  RefreshCw,
  UserCheck,
  Download,
  Zap,
  Activity,
  ArrowUpDown,
  CheckSquare,
  Square,
  BarChart3,
  Flame,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  SEG_META,
  SEG_GROUPS,
  MOCK_LEADS,
  SegmentKey,
  PipelineLead,
  SegmentMeta,
  AGENTS,
  cn,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const COMPLIANCE_APPROVED: SegmentKey[] = ['DOCS_VERIFIED'];
const COMPLIANCE_REVIEW:   SegmentKey[] = ['DOCS_UNDER_REVIEW', 'DOCS_PENDING'];
const COMPLIANCE_REJECTED: SegmentKey[] = [
  'REJECT_SCREENSHOT', 'REJECT_MISSING_SIDE',
  'REJECT_BW', 'REJECT_NAME_MISMATCH', 'REJECT_EXPIRED',
];

const PAGE_SIZE = 50;

type FilterValue =
  | 'all'
  | SegmentKey
  | 'compliance_approved'
  | 'compliance_review'
  | 'compliance_rejected'
  | 'reassigned';

type DetailMode = 'kanban' | 'table';

type SortKey = 'name' | 'segment' | 'channel' | 'stage' | 'assignedTo' | 'updatedAt' | 'depositAmount';
type SortDir = 'asc' | 'desc';

// ─── Pre-computed module-level data ────────────────────────────────────────────
const _COUNT_BY_KEY: Record<string, number> = {};
for (const l of MOCK_LEADS) _COUNT_BY_KEY[l.segment] = (_COUNT_BY_KEY[l.segment] || 0) + 1;

const _GROUP_TOTALS: Record<string, number> = {};
for (const g of SEG_GROUPS) {
  _GROUP_TOTALS[g.key] = SEG_META
    .filter((s) => s.group === g.key)
    .reduce((acc, s) => acc + (_COUNT_BY_KEY[s.key] || 0), 0);
}

// KPI pre-computation
const _HOT_COUNT   = (_COUNT_BY_KEY['HIGH_INTENT_DEPOSIT'] || 0) + (_COUNT_BY_KEY['PIX_READY'] || 0);
const _TOTAL_DEP   = MOCK_LEADS.reduce((s, l) => s + (l.depositAmount || 0), 0);
const _REASSIGN_COUNT = (_COUNT_BY_KEY['REASSIGNED'] || 0) + (_COUNT_BY_KEY['REASSIGNED_2'] || 0);
const _CONV_RATE   = Math.round((_COUNT_BY_KEY['DOCS_VERIFIED'] || 0) / MOCK_LEADS.length * 100);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function segBy(key: SegmentKey): SegmentMeta {
  return SEG_META.find((s) => s.key === key)!;
}

function fmtDeposit(n: number) {
  return `R$ ${n.toLocaleString('pt-BR')}`;
}

// ─── Avatar / badge helpers ────────────────────────────────────────────────────

const _AVATAR_COLORS = ['#f97316','#22c55e','#3b82f6','#8b5cf6','#06b6d4','#f59e0b','#ec4899','#14b8a6'];

function InitialsAvatar({ name, size = 'md' }: { name: string; size?: 'sm' | 'md' }) {
  const hash = name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const color = _AVATAR_COLORS[hash % _AVATAR_COLORS.length];
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const cls = size === 'sm' ? 'w-6 h-6 text-[9px]' : 'w-8 h-8 text-[11px]';
  return (
    <div
      className={`${cls} rounded-full flex items-center justify-center font-black shrink-0`}
      style={{ backgroundColor: color + '25', color }}
    >
      {initials}
    </div>
  );
}

function ChannelBadge({ channel }: { channel: 'email' | 'wa' }) {
  const isWa = channel === 'wa';
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border whitespace-nowrap"
      style={
        isWa
          ? { color: '#25d366', borderColor: '#25d36640', backgroundColor: '#25d36615' }
          : { color: '#60a5fa', borderColor: '#60a5fa40', backgroundColor: '#60a5fa15' }
      }
    >
      {isWa ? '💬' : '✉️'} {isWa ? 'WA' : 'Email'}
    </span>
  );
}

const _STAGE_META = {
  STAGE_1: { label: 'Stage 1', color: '#f59e0b' },
  STAGE_2: { label: 'Stage 2', color: '#3b82f6' },
  STAGE_3: { label: 'Stage 3', color: '#8b5cf6' },
};

function StageBadge({ stage }: { stage: 'STAGE_1' | 'STAGE_2' | 'STAGE_3' }) {
  const { label, color } = _STAGE_META[stage];
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold border whitespace-nowrap"
      style={{ color, borderColor: color + '40', backgroundColor: color + '15' }}
    >
      {label}
    </span>
  );
}

// ─── Segment Pill ─────────────────────────────────────────────────────────────

export function SegPill({ segKey }: { segKey: SegmentKey }) {
  const meta = segBy(segKey);
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold border whitespace-nowrap"
      style={{ color: meta.color, borderColor: meta.color + '40', backgroundColor: meta.color + '15' }}
    >
      {meta.icon} {meta.label}
    </span>
  );
}

// ─── Count badge ──────────────────────────────────────────────────────────────

function CountBadge({ count, color }: { count: number; color: string }) {
  return (
    <span
      className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full"
      style={{ backgroundColor: color + '22', color }}
    >
      {count.toLocaleString()}
    </span>
  );
}

// ─── Command Control Bar ──────────────────────────────────────────────────────
// Top-level KPI strip + quick action buttons

function CommandControl({
  selectedIds,
  onBulkAssign,
  onClearSelection,
  filteredCount,
  activeFilter,
}: {
  selectedIds: Set<string>;
  onBulkAssign: (agent: string) => void;
  onClearSelection: () => void;
  filteredCount: number;
  activeFilter: FilterValue;
}) {
  const [assignOpen, setAssignOpen] = useState(false);
  const hasSelection = selectedIds.size > 0;

  const kpis = [
    {
      icon: <Flame size={15} />,
      label: 'Hot Leads',
      value: _HOT_COUNT,
      color: '#f97316',
      sub: 'High Intent + PIX Ready',
    },
    {
      icon: <Target size={15} />,
      label: 'Conv. Rate',
      value: `${_CONV_RATE}%`,
      color: '#00FF00',
      sub: 'Docs Verified / Total',
    },
    {
      icon: <Activity size={15} />,
      label: 'Reassigned',
      value: _REASSIGN_COUNT,
      color: '#818cf8',
      sub: 'Pending re-routing',
    },
    {
      icon: <BarChart3 size={15} />,
      label: 'Total Deposits',
      value: `R$ ${Math.round(_TOTAL_DEP / 1000)}k`,
      color: '#fbbf24',
      sub: 'Across all deposit leads',
    },
  ];

  return (
    <div className="glass rounded-2xl border border-white/8 overflow-hidden">
      {/* KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-white/5">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="px-5 py-3 flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: kpi.color + '18', color: kpi.color }}
            >
              {kpi.icon}
            </div>
            <div>
              <div className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider">{kpi.label}</div>
              <div className="text-base font-black font-mono leading-tight" style={{ color: kpi.color }}>
                {kpi.value}
              </div>
              <div className="text-[9px] text-zinc-600">{kpi.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Action Bar */}
      <div className="border-t border-white/5 px-5 py-2.5 flex items-center gap-3 flex-wrap">
        {/* Selection status */}
        {hasSelection ? (
          <div className="flex items-center gap-3 flex-1">
            <div className="flex items-center gap-2 text-xs font-mono text-neon-green">
              <CheckSquare size={13} />
              <span className="font-bold">{selectedIds.size}</span>
              <span className="text-zinc-500">leads selected</span>
            </div>

            {/* Bulk assign */}
            <div className="relative">
              <button
                onClick={() => setAssignOpen((o) => !o)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-purple-400/30 bg-purple-500/10 text-purple-400 text-xs font-mono hover:border-purple-400/60 transition-all"
              >
                <UserCheck size={12} />
                Bulk Assign
                <ChevronDown size={11} className={cn('transition-transform', assignOpen && 'rotate-180')} />
              </button>
              <AnimatePresence>
                {assignOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -4, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -4, scale: 0.96 }}
                    transition={{ duration: 0.1 }}
                    className="absolute left-0 top-full mt-1.5 w-36 glass rounded-xl border border-white/15 shadow-2xl z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-600 border-b border-white/5">
                      Assign {selectedIds.size} leads to
                    </div>
                    {AGENTS.filter((a) => a !== 'Sistema' && a !== 'Unassigned').map((agent) => (
                      <button
                        key={agent}
                        onClick={() => { onBulkAssign(agent); setAssignOpen(false); }}
                        className="w-full text-left px-3 py-2 text-[11px] font-mono hover:bg-white/5 transition-colors text-zinc-400 hover:text-white flex items-center gap-2"
                      >
                        <InitialsAvatar name={agent} size="sm" />
                        {agent}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button
              onClick={onClearSelection}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-500 text-xs font-mono hover:text-zinc-300 hover:border-white/20 transition-all"
            >
              <X size={11} /> Clear
            </button>
          </div>
        ) : (
          <div className="flex-1 flex items-center gap-2">
            <Zap size={12} className="text-neon-green" />
            <span className="text-[10px] font-mono text-zinc-600">
              Showing <span className="text-zinc-400 font-bold">{filteredCount.toLocaleString()}</span> leads
              {activeFilter !== 'all' && ' (filtered)'}
              {' '}· Select rows to bulk assign
            </span>
          </div>
        )}

        {/* Export button */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-zinc-500 text-xs font-mono hover:text-zinc-300 hover:border-white/20 transition-all ml-auto"
          title="Export CSV (demo)"
        >
          <Download size={12} />
          Export
        </button>
      </div>
    </div>
  );
}

// ─── Compliance Overview ──────────────────────────────────────────────────────

function ComplianceOverview({
  onFilter,
  activeFilter,
}: {
  onFilter: (f: FilterValue) => void;
  activeFilter: FilterValue;
}) {
  const approved = MOCK_LEADS.filter((l) => COMPLIANCE_APPROVED.includes(l.segment)).length;
  const review   = MOCK_LEADS.filter((l) => COMPLIANCE_REVIEW.includes(l.segment)).length;
  const rejected = MOCK_LEADS.filter((l) => COMPLIANCE_REJECTED.includes(l.segment)).length;
  const total    = approved + review + rejected || 1;
  const rate     = Math.round((approved / total) * 100);

  const cards = [
    { key: 'compliance_approved' as FilterValue, icon: <CheckCircle2 size={18} />, label: 'Approved', sub: 'Docs Verified', count: approved, color: '#00FF00' },
    { key: 'compliance_review'   as FilterValue, icon: <Clock size={18} />,        label: 'In Review', sub: 'Pending + Under Review', count: review, color: '#fbbf24' },
    { key: 'compliance_rejected' as FilterValue, icon: <XCircle size={18} />,      label: 'Rejected', sub: '5 rejection types', count: rejected, color: '#f87171' },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {cards.map((card) => {
          const isActive = activeFilter === card.key;
          return (
            <motion.button
              key={card.key}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onFilter(isActive ? 'all' : card.key)}
              className={cn('glass rounded-xl p-4 text-left transition-all border', isActive ? 'ring-1' : 'border-white/5 hover:border-white/10')}
              style={isActive ? { borderColor: card.color + '60', boxShadow: `0 0 12px ${card.color}18` } : {}}
            >
              <div className="flex items-start justify-between mb-2">
                <span style={{ color: card.color }}>{card.icon}</span>
                <span className="text-2xl font-black font-mono" style={{ color: card.color }}>
                  {card.count.toLocaleString()}
                </span>
              </div>
              <div className="text-xs font-bold text-zinc-300">{card.label}</div>
              <div className="text-[10px] text-zinc-600 mt-0.5">{card.sub}</div>
            </motion.button>
          );
        })}
      </div>
      <div className="glass rounded-xl px-4 py-2.5 flex items-center gap-4">
        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest shrink-0 w-32">Compliance Rate</span>
        <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${rate}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
            className="h-full rounded-full"
            style={{ background: 'linear-gradient(90deg, #22c55e, #00FF00)' }}
          />
        </div>
        <span className="text-sm font-bold font-mono text-neon-green shrink-0">{rate}%</span>
        <span className="text-[10px] font-mono text-zinc-600 shrink-0">{approved + review + rejected} compliance leads</span>
      </div>
    </div>
  );
}

// ─── Segment Rail ─────────────────────────────────────────────────────────────

function SegmentRail({ activeFilter, onFilter }: { activeFilter: FilterValue; onFilter: (f: FilterValue) => void }) {
  return (
    <div className="space-y-5">
      {SEG_GROUPS.map((group) => {
        const segs = SEG_META.filter((s) => s.group === group.key);
        return (
          <div key={group.key}>
            <div className="flex items-center gap-2 mb-2.5">
              <div className="w-1 h-4 rounded-full" style={{ backgroundColor: group.color }} />
              <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">{group.label}</span>
              <CountBadge count={_GROUP_TOTALS[group.key] || 0} color={group.color} />
            </div>
            <div className="flex flex-wrap gap-2">
              {segs.map((seg) => {
                const count    = _COUNT_BY_KEY[seg.key] || 0;
                const isActive = activeFilter === seg.key;
                const pct      = Math.round((count / MOCK_LEADS.length) * 100);
                return (
                  <motion.button
                    key={seg.key}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => onFilter(isActive ? 'all' : (seg.key as FilterValue))}
                    className={cn('relative flex items-center gap-2 pl-3 pr-3 py-2 rounded-xl border text-xs font-mono transition-all overflow-hidden', isActive ? '' : 'border-white/5 hover:border-white/15')}
                    style={isActive ? { borderColor: seg.color, backgroundColor: seg.color + '18', color: seg.color } : { color: '#94a3b8' }}
                  >
                    <span className="absolute inset-0 opacity-10 pointer-events-none" style={{ width: `${pct}%`, backgroundColor: seg.color }} />
                    <span className="relative z-10">{seg.icon}</span>
                    <span className="relative z-10 hidden sm:inline">{seg.label}</span>
                    <CountBadge count={count} color={isActive ? seg.color : '#64748b'} />
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Kanban Panel ─────────────────────────────────────────────────────────────

const KANBAN_CAP = 8;

function KanbanPanel({ leads }: { leads: PipelineLead[] }) {
  const byGroup = useMemo(() => {
    const map: Record<string, PipelineLead[]> = {};
    for (const g of SEG_GROUPS) map[g.key] = [];
    for (const l of leads) {
      const seg = segBy(l.segment);
      if (seg) map[seg.group].push(l);
    }
    return map;
  }, [leads]);

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {SEG_GROUPS.map((group) => {
        const groupLeads = byGroup[group.key] || [];
        const visible    = groupLeads.slice(0, KANBAN_CAP);
        const overflow   = groupLeads.length - visible.length;
        return (
          <div key={group.key} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 px-3 py-2 rounded-t-xl border-b-2 mb-2" style={{ borderColor: group.color, backgroundColor: group.color + '10' }}>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: group.color }}>{group.label}</span>
              <CountBadge count={groupLeads.length} color={group.color} />
            </div>
            <div className="space-y-2">
              {visible.length === 0 && (
                <div className="text-[10px] font-mono text-zinc-700 text-center py-8 border border-dashed border-white/5 rounded-xl">No leads</div>
              )}
              {visible.map((lead) => (
                <motion.div
                  key={lead.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass rounded-xl p-3 hover:border-white/15 transition-all cursor-default"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <span className="text-xs font-bold text-zinc-200 leading-tight">{lead.name}</span>
                    <span className="text-[10px] font-mono text-zinc-600 shrink-0 ml-1">{lead.updatedAt}</span>
                  </div>
                  <SegPill segKey={lead.segment} />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-[10px] font-mono text-zinc-600">{lead.assignedTo}</span>
                    {lead.depositAmount && (
                      <span className="text-[10px] font-mono text-neon-green font-bold">{fmtDeposit(lead.depositAmount)}</span>
                    )}
                  </div>
                </motion.div>
              ))}
              {overflow > 0 && (
                <div className="text-center text-[10px] font-mono py-2 rounded-xl border border-dashed" style={{ borderColor: group.color + '30', color: group.color }}>
                  +{overflow.toLocaleString()} more
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Table Panel ─────────────────────────────────────────────────────────────

const _REASSIGNAGENTS = AGENTS.filter((a) => a !== 'Sistema' && a !== 'Unassigned');

// Row left-border color by group
const _GROUP_COLOR: Record<string, string> = {};
for (const g of SEG_GROUPS) _GROUP_COLOR[g.key] = g.color;

function getRowAccent(seg: SegmentKey): string {
  const meta = segBy(seg);
  return meta ? _GROUP_COLOR[meta.group] : '#334155';
}

function SortableHeader({
  label,
  sortKey,
  currentSort,
  dir,
  onSort,
}: {
  label: string;
  sortKey: SortKey;
  currentSort: SortKey | null;
  dir: SortDir;
  onSort: (k: SortKey) => void;
}) {
  const active = currentSort === sortKey;
  return (
    <button
      className={cn('flex items-center gap-1 font-mono text-[10px] uppercase tracking-widest transition-colors whitespace-nowrap', active ? 'text-neon-green' : 'text-zinc-500 hover:text-zinc-300')}
      onClick={() => onSort(sortKey)}
    >
      {label}
      {active ? (
        dir === 'asc' ? <ChevronUp size={10} /> : <ChevronDown size={10} />
      ) : (
        <ArrowUpDown size={9} className="opacity-30" />
      )}
    </button>
  );
}

function TablePanel({
  leads,
  selectedIds,
  onSelect,
  onSelectAll,
  bulkReassignments,
}: {
  leads: PipelineLead[];
  selectedIds: Set<string>;
  onSelect: (id: string, checked: boolean) => void;
  onSelectAll: (checked: boolean, visibleIds: string[]) => void;
  bulkReassignments: Record<string, string>;
}) {
  const [page, setPage]                   = useState(0);
  const [search, setSearch]               = useState('');
  const [reassignOpen, setReassignOpen]   = useState<string | null>(null);
  const [reassignments, setReassignments] = useState<Record<string, string>>({});
  const [sortKey, setSortKey]             = useState<SortKey | null>(null);
  const [sortDir, setSortDir]             = useState<SortDir>('asc');

  const handleSort = useCallback((k: SortKey) => {
    setSortKey((prev) => {
      if (prev === k) { setSortDir((d) => d === 'asc' ? 'desc' : 'asc'); return k; }
      setSortDir('asc');
      return k;
    });
  }, []);

  const searched = useMemo(() => {
    let list = leads;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.crmId.includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.includes(q),
      );
    }
    if (sortKey) {
      list = [...list].sort((a, b) => {
        let av: string | number = (a as any)[sortKey] ?? '';
        let bv: string | number = (b as any)[sortKey] ?? '';
        if (sortKey === 'depositAmount') { av = a.depositAmount ?? 0; bv = b.depositAmount ?? 0; }
        const cmp = av < bv ? -1 : av > bv ? 1 : 0;
        return sortDir === 'asc' ? cmp : -cmp;
      });
    }
    return list;
  }, [leads, search, sortKey, sortDir]);

  const totalPages = Math.ceil(searched.length / PAGE_SIZE);
  const slice      = searched.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const visibleIds = slice.map((l) => l.id);
  const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));

  React.useEffect(() => { setPage(0); }, [leads.length, search]);

  React.useEffect(() => {
    if (!reassignOpen) return;
    const handler = () => setReassignOpen(null);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [reassignOpen]);

  return (
    <div>
      {/* ── Search bar ─────────────────────────────────────────────────────── */}
      <div className="px-4 py-3 border-b border-white/5 flex items-center gap-3">
        <Search size={14} className="text-zinc-500 shrink-0" />
        <input
          type="text"
          placeholder="Search by name, #ID, email or phone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 bg-transparent text-xs font-mono text-zinc-300 placeholder-zinc-600 outline-none"
        />
        {search && (
          <button onClick={() => setSearch('')} className="text-zinc-600 hover:text-zinc-400 transition-colors">
            <X size={13} />
          </button>
        )}
        <span className="text-[10px] font-mono text-zinc-600 shrink-0 border-l border-white/5 pl-3">
          {searched.length.toLocaleString()} leads
        </span>
      </div>

      {/* ── Table ──────────────────────────────────────────────────────────── */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs font-mono min-w-[980px]">
          <thead>
            <tr className="border-b border-white/10">
              {/* Select-all checkbox */}
              <th className="py-2.5 px-3 w-8">
                <button
                  onClick={() => onSelectAll(!allSelected, visibleIds)}
                  className="text-zinc-500 hover:text-neon-green transition-colors"
                >
                  {allSelected ? <CheckSquare size={13} className="text-neon-green" /> : <Square size={13} />}
                </button>
              </th>
              <th className="text-left py-2.5 px-3 w-3" /> {/* row accent stripe */}
              <th className="text-left py-2.5 px-4">
                <SortableHeader label="Lead" sortKey="name" currentSort={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="text-left py-2.5 px-4">
                <SortableHeader label="Status" sortKey="segment" currentSort={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="text-left py-2.5 px-4">
                <SortableHeader label="Channel" sortKey="channel" currentSort={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="text-left py-2.5 px-4">
                <SortableHeader label="Stage" sortKey="stage" currentSort={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="text-left py-2.5 px-4 text-zinc-500 uppercase tracking-widest text-[10px]">Contact</th>
              <th className="text-left py-2.5 px-4">
                <SortableHeader label="Agent" sortKey="assignedTo" currentSort={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="text-left py-2.5 px-4">
                <SortableHeader label="Last Active" sortKey="updatedAt" currentSort={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="text-left py-2.5 px-4">
                <SortableHeader label="Deposit" sortKey="depositAmount" currentSort={sortKey} dir={sortDir} onSort={handleSort} />
              </th>
              <th className="text-left py-2.5 px-4 text-zinc-500 uppercase tracking-widest text-[10px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence mode="popLayout">
              {slice.map((lead, idx) => {
                const effectiveAgent = bulkReassignments[lead.id] || reassignments[lead.id] || lead.assignedTo;
                const isBulkReassigned = !!bulkReassignments[lead.id];
                const isLocalReassigned = !!reassignments[lead.id];
                const isReassignSeg = lead.segment === 'REASSIGNED' || lead.segment === 'REASSIGNED_2';
                const isOpen   = reassignOpen === lead.id;
                const isChecked = selectedIds.has(lead.id);
                const accent = getRowAccent(lead.segment);

                return (
                  <motion.tr
                    key={lead.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.004 }}
                    className={cn(
                      'border-b border-white/5 transition-colors group',
                      isChecked ? 'bg-neon-green/[0.04]' : 'hover:bg-white/[0.03]',
                    )}
                  >
                    {/* Checkbox */}
                    <td className="py-2 px-3">
                      <button
                        onClick={() => onSelect(lead.id, !isChecked)}
                        className="text-zinc-600 hover:text-neon-green transition-colors"
                      >
                        {isChecked ? <CheckSquare size={13} className="text-neon-green" /> : <Square size={13} />}
                      </button>
                    </td>

                    {/* Color accent stripe */}
                    <td className="py-2 px-0 w-1">
                      <div className="w-[3px] h-6 rounded-full mx-auto" style={{ backgroundColor: accent + '70' }} />
                    </td>

                    {/* Lead: avatar + name + #crmId */}
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-3">
                        <InitialsAvatar name={lead.name} />
                        <div>
                          <div className="font-bold text-zinc-200 leading-tight whitespace-nowrap">{lead.name}</div>
                          <div className="text-[10px] text-zinc-600">#{lead.crmId}</div>
                        </div>
                      </div>
                    </td>

                    {/* Segment pill */}
                    <td className="py-2 px-4"><SegPill segKey={lead.segment} /></td>

                    {/* Channel */}
                    <td className="py-2 px-4"><ChannelBadge channel={lead.channel} /></td>

                    {/* Stage */}
                    <td className="py-2 px-4"><StageBadge stage={lead.stage} /></td>

                    {/* Email */}
                    <td className="py-2 px-4">
                      <span className="text-zinc-500 max-w-[140px] truncate block text-[10px]" title={lead.email}>
                        {lead.email}
                      </span>
                      <span className="text-[9px] text-zinc-700">{lead.phone}</span>
                    </td>

                    {/* Agent */}
                    <td className="py-2 px-4">
                      <span className={cn('whitespace-nowrap text-[11px]', (isBulkReassigned || isLocalReassigned) ? 'text-neon-green font-bold' : 'text-zinc-400')}>
                        {effectiveAgent}
                        {isBulkReassigned && <span className="ml-1 text-[9px] opacity-60">●</span>}
                      </span>
                    </td>

                    {/* Last Active */}
                    <td className="py-2 px-4 text-zinc-500 whitespace-nowrap">{lead.updatedAt}</td>

                    {/* Deposit */}
                    <td className="py-2 px-4">
                      {lead.depositAmount ? (
                        <span className="text-[11px] font-mono text-neon-green font-bold whitespace-nowrap">
                          {fmtDeposit(lead.depositAmount)}
                        </span>
                      ) : (
                        <span className="text-zinc-700 text-[10px]">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-2 px-4">
                      <div className="flex items-center gap-1.5">
                        <button title="View lead profile" className="p-1.5 rounded-lg border border-white/10 text-zinc-500 hover:text-blue-400 hover:border-blue-400/30 transition-all">
                          <Eye size={12} />
                        </button>
                        <button title="Open WhatsApp chat" className="p-1.5 rounded-lg border border-white/10 text-zinc-500 hover:text-[#25d366] hover:border-[#25d366]/30 transition-all">
                          <MessageCircle size={12} />
                        </button>

                        {/* Reassign — only for REASSIGNED / REASSIGNED_2 */}
                        {isReassignSeg && (
                          <div className="relative" onClick={(e) => e.stopPropagation()}>
                            <button
                              title="Reassign to agent"
                              onClick={() => setReassignOpen(isOpen ? null : lead.id)}
                              className={cn(
                                'p-1.5 rounded-lg border transition-all',
                                isOpen
                                  ? 'bg-purple-500/15 text-purple-400 border-purple-400/40'
                                  : 'border-white/10 text-zinc-500 hover:text-purple-400 hover:border-purple-400/30',
                              )}
                            >
                              <RefreshCw size={12} />
                            </button>
                            <AnimatePresence>
                              {isOpen && (
                                <motion.div
                                  initial={{ opacity: 0, y: -4, scale: 0.96 }}
                                  animate={{ opacity: 1, y: 0, scale: 1 }}
                                  exit={{ opacity: 0, y: -4, scale: 0.96 }}
                                  transition={{ duration: 0.1 }}
                                  className="absolute right-0 bottom-full mb-1.5 w-36 glass rounded-xl border border-white/15 shadow-2xl z-50 overflow-hidden"
                                >
                                  <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-600 border-b border-white/5">
                                    Assign to
                                  </div>
                                  {_REASSIGNAGENTS.map((agent) => (
                                    <button
                                      key={agent}
                                      onClick={() => {
                                        setReassignments((r) => ({ ...r, [lead.id]: agent }));
                                        setReassignOpen(null);
                                      }}
                                      className={cn(
                                        'w-full text-left px-3 py-2 text-[11px] font-mono hover:bg-white/5 transition-colors flex items-center justify-between',
                                        effectiveAgent === agent ? 'text-neon-green' : 'text-zinc-400',
                                      )}
                                    >
                                      <span>{agent}</span>
                                      {effectiveAgent === agent && <span className="text-[9px]">✓</span>}
                                    </button>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
            </AnimatePresence>
          </tbody>
        </table>
      </div>

      {searched.length === 0 && (
        <div className="text-center py-16 text-zinc-600 font-mono text-sm">
          {search ? `No leads match "${search}"` : 'No leads match the current filter.'}
        </div>
      )}

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-[10px] font-mono text-zinc-600">
            {page * PAGE_SIZE + 1}–{Math.min((page + 1) * PAGE_SIZE, searched.length)} of {searched.length.toLocaleString()} leads
          </span>
          <div className="flex items-center gap-2">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                const p = totalPages <= 7 ? i : Math.max(0, Math.min(page - 3, totalPages - 7)) + i;
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-6 h-6 rounded text-[10px] font-mono transition-all',
                      p === page
                        ? 'bg-neon-green/20 text-neon-green border border-neon-green/30'
                        : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5',
                    )}
                  >
                    {p + 1}
                  </button>
                );
              })}
            </div>
            <button
              disabled={page === totalPages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="p-1.5 rounded-lg border border-white/10 text-zinc-400 hover:border-white/20 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Filter Dropdown ──────────────────────────────────────────────────────────

function FilterDropdown({ activeFilter, onFilter }: { activeFilter: FilterValue; onFilter: (f: FilterValue) => void }) {
  const [open, setOpen] = useState(false);

  const groups = [
    { label: 'All',        options: [{ value: 'all' as FilterValue,                  label: 'All Leads',       icon: '👥' }] },
    { label: 'Compliance', options: [
      { value: 'compliance_approved' as FilterValue, label: 'Approved',       icon: '✅' },
      { value: 'compliance_review'   as FilterValue, label: 'In Review',      icon: '🔍' },
      { value: 'compliance_rejected' as FilterValue, label: 'Rejected (All)', icon: '❌' },
    ]},
    { label: 'Quick',      options: [{ value: 'reassigned' as FilterValue,           label: 'Reassigned',      icon: '🔄' }] },
    ...SEG_GROUPS.map((g) => ({
      label: g.label,
      options: SEG_META.filter((s) => s.group === g.key).map((s) => ({ value: s.key as FilterValue, label: s.label, icon: s.icon })),
    })),
  ];

  const activeLabel =
    activeFilter === 'all'                 ? 'All Leads'         :
    activeFilter === 'compliance_approved' ? '✅ Approved'        :
    activeFilter === 'compliance_review'   ? '🔍 In Review'       :
    activeFilter === 'compliance_rejected' ? '❌ Rejected (All)'  :
    activeFilter === 'reassigned'          ? '🔄 Reassigned'      :
    (() => { const s = segBy(activeFilter as SegmentKey); return s ? `${s.icon} ${s.label}` : activeFilter; })();

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-4 py-2 glass rounded-xl text-xs font-mono border border-white/10 hover:border-neon-green/30 transition-all"
      >
        <Filter size={13} className="text-zinc-400" />
        <span className="max-w-40 truncate">{activeLabel}</span>
        <ChevronDown size={13} className={cn('text-zinc-500 transition-transform', open && 'rotate-180')} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full mt-2 w-60 glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-y-auto max-h-96"
          >
            {groups.map((grp) => (
              <div key={grp.label}>
                <div className="px-3 py-1.5 text-[9px] font-mono uppercase tracking-widest text-zinc-600 border-b border-white/5 sticky top-0 bg-[#0d0d0d]/90">
                  {grp.label}
                </div>
                {grp.options.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { onFilter(opt.value); setOpen(false); }}
                    className={cn('w-full text-left px-3 py-2 text-xs font-mono flex items-center gap-2 hover:bg-white/5 transition-colors', activeFilter === opt.value && 'text-neon-green bg-neon-green/5')}
                  >
                    <span>{opt.icon}</span>
                    <span className="flex-1">{opt.label}</span>
                    {activeFilter === opt.value && <span className="text-neon-green text-[10px]">✓</span>}
                  </button>
                ))}
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Main PipelineView ────────────────────────────────────────────────────────

export const PipelineView: React.FC = () => {
  const [activeFilter, setActiveFilter]           = useState<FilterValue>('all');
  const [detailMode,   setDetailMode]             = useState<DetailMode>('table');
  const [selectedIds,  setSelectedIds]            = useState<Set<string>>(new Set());
  const [bulkReassignments, setBulkReassignments] = useState<Record<string, string>>({});

  const filteredLeads = useMemo(() => {
    if (activeFilter === 'all')                 return MOCK_LEADS;
    if (activeFilter === 'compliance_approved') return MOCK_LEADS.filter((l) => COMPLIANCE_APPROVED.includes(l.segment));
    if (activeFilter === 'compliance_review')   return MOCK_LEADS.filter((l) => COMPLIANCE_REVIEW.includes(l.segment));
    if (activeFilter === 'compliance_rejected') return MOCK_LEADS.filter((l) => COMPLIANCE_REJECTED.includes(l.segment));
    if (activeFilter === 'reassigned')          return MOCK_LEADS.filter((l) => l.segment === 'REASSIGNED' || l.segment === 'REASSIGNED_2');
    return MOCK_LEADS.filter((l) => l.segment === activeFilter);
  }, [activeFilter]);

  const handleSelect = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleSelectAll = useCallback((checked: boolean, visibleIds: string[]) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of visibleIds) checked ? next.add(id) : next.delete(id);
      return next;
    });
  }, []);

  const handleBulkAssign = useCallback((agent: string) => {
    setBulkReassignments((prev) => {
      const next = { ...prev };
      for (const id of selectedIds) next[id] = agent;
      return next;
    });
    setSelectedIds(new Set());
  }, [selectedIds]);

  const activeLabel =
    activeFilter === 'all'                 ? null                :
    activeFilter === 'compliance_approved' ? '✅ Approved'        :
    activeFilter === 'compliance_review'   ? '🔍 In Review'       :
    activeFilter === 'compliance_rejected' ? '❌ Rejected (All)'  :
    activeFilter === 'reassigned'          ? '🔄 Reassigned'      :
    (() => { const s = segBy(activeFilter as SegmentKey); return s ? `${s.icon} ${s.label}` : activeFilter; })();

  return (
    <div className="space-y-5 animate-in fade-in duration-500">

      {/* ── Page Header ───────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-neon-green/10 flex items-center justify-center text-neon-green border border-neon-green/20">
            <Users size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold">Lead Pipeline</h2>
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-2">
              CRM GAMBA Sync
              <span className="text-neon-green font-bold text-sm">{MOCK_LEADS.length.toLocaleString()}</span>
              <span>total leads</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FilterDropdown activeFilter={activeFilter} onFilter={setActiveFilter} />
          <div className="flex glass rounded-xl border border-white/10 overflow-hidden">
            {([['kanban', LayoutGrid, 'Kanban'], ['table', Table2, 'Table']] as const).map(([mode, Icon, label]) => (
              <button
                key={mode}
                title={label}
                onClick={() => setDetailMode(mode)}
                className={cn('p-2 transition-colors', detailMode === mode ? 'bg-neon-green/20 text-neon-green' : 'text-zinc-500 hover:text-zinc-300')}
              >
                <Icon size={16} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Command Control ───────────────────────────────────────────────── */}
      <CommandControl
        selectedIds={selectedIds}
        onBulkAssign={handleBulkAssign}
        onClearSelection={() => setSelectedIds(new Set())}
        filteredCount={filteredLeads.length}
        activeFilter={activeFilter}
      />

      {/* ── Total Stats Bar ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {SEG_GROUPS.map((group) => {
          const groupTotal = _GROUP_TOTALS[group.key] || 0;
          const pct        = Math.round((groupTotal / MOCK_LEADS.length) * 100);
          return (
            <div key={group.key} className="glass rounded-xl px-4 py-3 flex flex-col gap-1 border border-white/5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: group.color }}>{group.label}</span>
                <span className="text-[10px] font-mono text-zinc-600">{pct}%</span>
              </div>
              <span className="text-xl font-black font-mono" style={{ color: group.color }}>{groupTotal.toLocaleString()}</span>
              <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: group.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Compliance Overview ──────────────────────────────────────────── */}
      <section>
        <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 mb-3 flex items-center gap-2">
          <CheckCircle2 size={11} className="text-neon-green" /> Compliance Overview
        </h3>
        <ComplianceOverview activeFilter={activeFilter} onFilter={setActiveFilter} />
      </section>

      {/* ── Segment Rail ─────────────────────────────────────────────────── */}
      <section className="glass rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[10px] font-mono uppercase tracking-widest text-zinc-500 flex items-center gap-2">
            <TrendingUp size={11} className="text-neon-green" /> Full Pipeline — All Segments
          </h3>
          <span className="text-[10px] font-mono text-zinc-600">Click a segment to filter below ↓</span>
        </div>
        <SegmentRail activeFilter={activeFilter} onFilter={setActiveFilter} />
      </section>

      {/* ── Detail Panel ─────────────────────────────────────────────────── */}
      <section className="glass rounded-2xl overflow-hidden">
        {/* Detail header */}
        <div className="px-5 py-3 border-b border-white/5 flex items-center gap-3 flex-wrap">
          {detailMode === 'kanban' ? (
            <LayoutGrid size={13} className="text-neon-green shrink-0" />
          ) : (
            <Table2 size={13} className="text-neon-green shrink-0" />
          )}
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-500">
            {detailMode === 'kanban' ? 'Kanban View' : 'Lead Table'}
          </span>

          {activeLabel && (
            <div className="flex items-center gap-2 ml-2">
              <span className="text-[10px] font-mono text-zinc-600">Filtering:</span>
              <button
                onClick={() => setActiveFilter('all')}
                className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-neon-green/10 text-neon-green text-[10px] font-mono border border-neon-green/20 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 transition-all"
              >
                {activeLabel}
                <X size={10} />
              </button>
              <span className="text-[10px] font-mono text-zinc-600">{filteredLeads.length.toLocaleString()} leads</span>
            </div>
          )}

          {!activeLabel && (
            <span className="text-[10px] font-mono text-zinc-600 ml-auto">
              Showing all {MOCK_LEADS.length.toLocaleString()} leads
            </span>
          )}
        </div>

        {/* Panel content */}
        <div className={detailMode === 'kanban' ? 'p-5' : ''}>
          {detailMode === 'kanban' ? (
            <KanbanPanel leads={filteredLeads} />
          ) : (
            <TablePanel
              leads={filteredLeads}
              selectedIds={selectedIds}
              onSelect={handleSelect}
              onSelectAll={handleSelectAll}
              bulkReassignments={bulkReassignments}
            />
          )}
        </div>
      </section>

    </div>
  );
};
