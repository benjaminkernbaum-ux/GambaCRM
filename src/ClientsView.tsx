import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Users, Search, X, Heart, TrendingUp, TrendingDown,
  Shield, Star, Clock, DollarSign, ArrowUpRight, ArrowDownRight,
  Crown, Gem, Award, UserCheck, UserX, AlertTriangle,
  ChevronRight, ExternalLink, Globe, Phone, Mail,
} from 'lucide-react';
import { MOCK_LEADS, SEG_META, PipelineLead } from './types';

// ─── Client Health Scoring ───────────────────────────────────────────────────

function computeHealthScore(lead: PipelineLead): number {
  const segScores: Record<string, number> = {
    HIGH_INTENT_DEPOSIT: 95, PIX_READY: 90, DOCS_VERIFIED: 85,
    SUCCESSFUL_CONTACT: 70, WELCOME_NEW_REG: 60, NEW_LEAD: 50,
    DOCS_UNDER_REVIEW: 65, DOCS_PENDING: 55, NO_ANSWER: 25,
    SKIP_ACTIVE: 80, SKIP_COOLDOWN: 30, SKIP_CLOSED: 10,
    FAILED_DEPOSIT: 35, MARGIN_CALL: 20, STOP_OUT: 10,
    REASSIGNED: 40, REASSIGNED_2: 35,
    REJECT_SCREENSHOT: 45, REJECT_MISSING_SIDE: 45,
    REJECT_BW: 45, REJECT_NAME_MISMATCH: 45, REJECT_EXPIRED: 40,
  };
  const base = segScores[lead.segment] ?? 50;
  const depBonus = lead.depositAmount ? Math.min((lead.depositAmount / 50000) * 15, 15) : 0;
  const channelBonus = lead.channel === 'wa' ? 5 : 0;
  const stageBonus = lead.stage === 'STAGE_3' ? 5 : lead.stage === 'STAGE_2' ? 3 : 0;
  return Math.min(Math.round(base + depBonus + channelBonus + stageBonus), 100);
}

type ClientTier = 'platinum' | 'gold' | 'silver' | 'bronze';
function getTier(score: number): ClientTier {
  if (score >= 80) return 'platinum';
  if (score >= 60) return 'gold';
  if (score >= 40) return 'silver';
  return 'bronze';
}

const tierConfig: Record<ClientTier, { label: string; color: string; icon: React.ElementType; bg: string }> = {
  platinum: { label: 'Platinum', color: '#e2e8f0', icon: Crown, bg: 'linear-gradient(135deg, #334155, #1e293b)' },
  gold: { label: 'Gold', color: '#f59e0b', icon: Award, bg: 'linear-gradient(135deg, #78350f, #451a03)' },
  silver: { label: 'Silver', color: '#94a3b8', icon: Star, bg: 'linear-gradient(135deg, #1e293b, #0f172a)' },
  bronze: { label: 'Bronze', color: '#b45309', icon: Shield, bg: 'linear-gradient(135deg, #451a03, #1c1917)' },
};

// ─── Enrich leads with scores ────────────────────────────────────────────────

interface EnrichedClient extends PipelineLead {
  healthScore: number;
  tier: ClientTier;
  ltv: number;
  riskLevel: 'low' | 'medium' | 'high';
}

const clients: EnrichedClient[] = MOCK_LEADS.map((l) => {
  const healthScore = computeHealthScore(l);
  const tier = getTier(healthScore);
  const ltv = (l.depositAmount ?? 0) + Math.floor(healthScore * 50 + Math.random() * 2000);
  const riskLevel = healthScore >= 60 ? 'low' : healthScore >= 35 ? 'medium' : 'high';
  return { ...l, healthScore, tier, ltv, riskLevel };
});

// Stats
const totalClients = clients.length;
const avgHealth = Math.round(clients.reduce((s, c) => s + c.healthScore, 0) / totalClients);
const highRisk = clients.filter((c) => c.riskLevel === 'high').length;
const platinum = clients.filter((c) => c.tier === 'platinum').length;
const gold = clients.filter((c) => c.tier === 'gold').length;
const totalLTV = clients.reduce((s, c) => s + c.ltv, 0);
const avgLTV = Math.round(totalLTV / totalClients);

// Tier distribution
const tierData = (['platinum', 'gold', 'silver', 'bronze'] as ClientTier[]).map((t) => ({
  name: tierConfig[t].label,
  value: clients.filter((c) => c.tier === t).length,
  color: tierConfig[t].color,
}));

// Health distribution
const healthDist = [
  { range: '0-20', count: clients.filter((c) => c.healthScore <= 20).length, color: '#ef4444' },
  { range: '21-40', count: clients.filter((c) => c.healthScore > 20 && c.healthScore <= 40).length, color: '#f59e0b' },
  { range: '41-60', count: clients.filter((c) => c.healthScore > 40 && c.healthScore <= 60).length, color: '#6366f1' },
  { range: '61-80', count: clients.filter((c) => c.healthScore > 60 && c.healthScore <= 80).length, color: '#8b5cf6' },
  { range: '81-100', count: clients.filter((c) => c.healthScore > 80).length, color: '#10b981' },
];

// Retention trend
const retentionTrend = [
  { month: 'Out', active: 412, churned: 18 },
  { month: 'Nov', active: 465, churned: 22 },
  { month: 'Dez', active: 534, churned: 15 },
  { month: 'Jan', active: 589, churned: 28 },
  { month: 'Fev', active: 648, churned: 19 },
  { month: 'Mar', active: totalClients, churned: highRisk },
];

function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="font-bold text-white mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? p.stroke ?? '#94a3b8' }}>
          {p.name}: <span className="font-bold">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Health Badge ────────────────────────────────────────────────────────────

function HealthBadge({ score }: { score: number }) {
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#6366f1' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-1.5">
      <div className="relative w-8 h-8">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1a1a35" strokeWidth="3" />
          <circle cx="18" cy="18" r="14" fill="none" stroke={color} strokeWidth="3"
            strokeDasharray={`${score * 0.88} 88`} strokeLinecap="round" />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[9px] font-black" style={{ color }}>{score}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function ClientsView() {
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState<ClientTier | 'all'>('all');
  const [riskFilter, setRiskFilter] = useState<'all' | 'low' | 'medium' | 'high'>('all');
  const [sortBy, setSortBy] = useState<'health' | 'ltv' | 'name'>('health');
  const [selectedClient, setSelectedClient] = useState<EnrichedClient | null>(null);

  const filtered = useMemo(() => {
    let result = clients;
    if (tierFilter !== 'all') result = result.filter((c) => c.tier === tierFilter);
    if (riskFilter !== 'all') result = result.filter((c) => c.riskLevel === riskFilter);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((c) =>
        c.name.toLowerCase().includes(q) || c.crmId.includes(q) || c.email.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => {
      if (sortBy === 'health') return b.healthScore - a.healthScore;
      if (sortBy === 'ltv') return b.ltv - a.ltv;
      return a.name.localeCompare(b.name);
    });
  }, [clients, tierFilter, riskFilter, search, sortBy]);

  return (
    <div className="p-6 space-y-5">

      {/* KPI Cards */}
      <div className="grid grid-cols-6 gap-3">
        {[
          { label: 'Total Clients', value: totalClients, icon: Users, color: '#6366f1', trend: '+14%' },
          { label: 'Avg Health', value: avgHealth, icon: Heart, color: avgHealth >= 60 ? '#10b981' : '#f59e0b' },
          { label: 'Platinum Tier', value: platinum, icon: Crown, color: '#e2e8f0', sub: `${Math.round(platinum/totalClients*100)}% of total` },
          { label: 'Gold Tier', value: gold, icon: Award, color: '#f59e0b' },
          { label: 'High Risk', value: highRisk, icon: AlertTriangle, color: '#ef4444', sub: 'Needs attention' },
          { label: 'Avg LTV', value: fmtBRL(avgLTV), icon: Gem, color: '#06b6d4' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4 relative overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="flex items-start justify-between mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: k.color + '18', color: k.color }}>
                <k.icon size={15} />
              </div>
              {k.trend && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                  style={{ background: '#10b98118', color: '#10b981' }}>
                  <ArrowUpRight size={8} />{k.trend}
                </span>
              )}
            </div>
            <div className="text-2xl font-black text-white leading-none mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>
              {k.value}
            </div>
            <div className="text-[10px]" style={{ color: '#64748b' }}>{k.label}</div>
            {k.sub && <div className="text-[9px] font-mono mt-0.5" style={{ color: '#334155' }}>{k.sub}</div>}
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">
        {/* Retention trend */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#10b981' }}>
            Client Retention Trend
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={retentionTrend}>
              <defs>
                <linearGradient id="retGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="active" name="Active" stroke="#10b981" fill="url(#retGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="churned" name="Churned" stroke="#ef4444" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Tier + Health distribution */}
        <div className="space-y-4">
          <div className="rounded-xl p-4" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: '#f59e0b' }}>Tier Distribution</div>
            <ResponsiveContainer width="100%" height={100}>
              <PieChart>
                <Pie data={tierData} dataKey="value" cx="50%" cy="50%" innerRadius={28} outerRadius={45} paddingAngle={3}>
                  {tierData.map((d, i) => <Cell key={i} fill={d.color} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-center gap-4 mt-1">
              {tierData.map((d) => (
                <div key={d.name} className="flex items-center gap-1 text-[9px]">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span style={{ color: '#64748b' }}>{d.name}</span>
                  <span className="font-bold" style={{ color: d.color }}>{d.value}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl p-4" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="text-[10px] font-mono tracking-widest uppercase mb-3" style={{ color: '#8b5cf6' }}>Health Distribution</div>
            <div className="space-y-2">
              {healthDist.map((h) => (
                <div key={h.range} className="flex items-center gap-2">
                  <span className="text-[9px] font-mono w-10" style={{ color: '#475569' }}>{h.range}</span>
                  <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: '#1a1a35' }}>
                    <div className="h-full rounded-full" style={{ width: `${(h.count / totalClients) * 100 * 5}%`, background: h.color, maxWidth: '100%' }} />
                  </div>
                  <span className="text-[9px] font-mono font-bold w-6 text-right" style={{ color: h.color }}>{h.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filter toolbar + Client list */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>

        {/* Filters */}
        <div className="px-4 py-3 flex items-center gap-3 flex-wrap" style={{ borderBottom: '1px solid #1a1a35' }}>
          {/* Search */}
          <div className="relative flex-1 min-w-40">
            <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: '#334155' }} />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-8 pr-3 py-1.5 rounded-lg text-[11px] outline-none placeholder:text-[#334155]"
              style={{ background: '#05050f', border: '1px solid #1a1a35', color: '#94a3b8' }} />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: '#475569' }}>
                <X size={10} />
              </button>
            )}
          </div>

          {/* Tier filter */}
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
            {(['all', 'platinum', 'gold', 'silver', 'bronze'] as const).map((t) => (
              <button key={t} onClick={() => setTierFilter(t)}
                className="px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition-all"
                style={tierFilter === t
                  ? { background: t === 'all' ? '#6366f1' : tierConfig[t as ClientTier]?.color ?? '#6366f1', color: t === 'platinum' ? '#0f172a' : '#fff' }
                  : { color: '#475569' }}>
                {t === 'all' ? 'All' : t}
              </button>
            ))}
          </div>

          {/* Risk filter */}
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
            {(['all', 'low', 'medium', 'high'] as const).map((r) => {
              const rColors = { all: '#6366f1', low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
              return (
                <button key={r} onClick={() => setRiskFilter(r)}
                  className="px-2.5 py-1 rounded-md text-[10px] font-semibold capitalize transition-all"
                  style={riskFilter === r ? { background: rColors[r], color: '#fff' } : { color: '#475569' }}>
                  {r === 'all' ? 'All Risk' : r}
                </button>
              );
            })}
          </div>

          {/* Sort */}
          <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
            {([['health', 'Health'], ['ltv', 'LTV'], ['name', 'Name']] as const).map(([k, label]) => (
              <button key={k} onClick={() => setSortBy(k as any)}
                className="px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all"
                style={sortBy === k ? { background: '#8b5cf6', color: '#fff' } : { color: '#475569' }}>
                {label}
              </button>
            ))}
          </div>

          <span className="text-[11px] font-mono ml-auto" style={{ color: '#475569' }}>
            <span className="text-white font-bold">{filtered.length}</span> clients
          </span>
        </div>

        {/* Client table */}
        <div className="overflow-x-auto max-h-[420px] overflow-y-auto">
          <table className="w-full text-[12px]">
            <thead className="sticky top-0" style={{ background: '#0d0d22' }}>
              <tr style={{ borderBottom: '1px solid #1a1a35' }}>
                {['Client', 'Health', 'Tier', 'Segment', 'LTV', 'Risk', 'Channel', 'Last Active'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 50).map((client) => {
                const segMeta = SEG_META.find((s) => s.key === client.segment);
                const tier = tierConfig[client.tier];
                const riskColors = { low: '#10b981', medium: '#f59e0b', high: '#ef4444' };
                return (
                  <tr key={client.id}
                    className="group hover:bg-white/[0.02] cursor-pointer transition-colors"
                    style={{ borderBottom: '1px solid #1a1a3522' }}
                    onClick={() => setSelectedClient(client)}>
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                          style={{ background: (segMeta?.color ?? '#6366f1') + '22', color: segMeta?.color ?? '#6366f1', border: `1px solid ${(segMeta?.color ?? '#6366f1')}44` }}>
                          {client.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white text-[11px] leading-tight">{client.name}</div>
                          <div className="text-[9px] font-mono" style={{ color: '#334155' }}>#{client.crmId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-2.5"><HealthBadge score={client.healthScore} /></td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold"
                        style={{ background: tier.color + '18', color: tier.color, border: `1px solid ${tier.color}33` }}>
                        <tier.icon size={9} /> {tier.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold" style={{ color: segMeta?.color }}>
                        {segMeta?.icon} {segMeta?.label}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[11px] font-bold font-mono" style={{ color: '#10b981' }}>{fmtBRL(client.ltv)}</span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold capitalize"
                        style={{ background: riskColors[client.riskLevel] + '18', color: riskColors[client.riskLevel] }}>
                        {client.riskLevel}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={client.channel === 'wa'
                          ? { background: '#25d36618', color: '#25d366' }
                          : { background: '#6366f118', color: '#818cf8' }}>
                        {client.channel === 'wa' ? 'WA' : 'Email'}
                      </span>
                    </td>
                    <td className="px-4 py-2.5">
                      <span className="text-[10px] font-mono" style={{ color: '#475569' }}>{client.updatedAt}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {filtered.length > 50 && (
          <div className="px-4 py-2 text-center text-[10px] font-mono" style={{ color: '#334155', borderTop: '1px solid #1a1a35' }}>
            Showing 50 of {filtered.length} clients
          </div>
        )}
      </div>
    </div>
  );
}
