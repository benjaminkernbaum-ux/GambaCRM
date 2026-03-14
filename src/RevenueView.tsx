import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart,
} from 'recharts';
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight,
  CreditCard, Wallet, Target, BarChart2, PiggyBank, Banknote,
  CircleDollarSign, ArrowRight, Calendar, Gem, Trophy, Crown,
} from 'lucide-react';
import { MOCK_LEADS, SEG_META } from './types';

// ─── Revenue Data ────────────────────────────────────────────────────────────

const DEPOSIT_LEADS = MOCK_LEADS.filter((l) => l.depositAmount !== undefined);
const totalRevenue = DEPOSIT_LEADS.reduce((s, l) => s + (l.depositAmount ?? 0), 0);
const avgDeposit = totalRevenue / (DEPOSIT_LEADS.length || 1);
const maxDeposit = Math.max(...DEPOSIT_LEADS.map((l) => l.depositAmount ?? 0));
const totalFTDs = MOCK_LEADS.filter((l) => l.segment === 'DOCS_VERIFIED' && l.depositAmount).length;
const conversionValue = totalRevenue / (MOCK_LEADS.length || 1);

// Monthly revenue simulation
const monthlyRevenue = [
  { month: 'Set', revenue: 487200, deposits: 89, ftds: 34, target: 500000 },
  { month: 'Out', revenue: 612400, deposits: 112, ftds: 41, target: 550000 },
  { month: 'Nov', revenue: 534800, deposits: 97, ftds: 38, target: 550000 },
  { month: 'Dez', revenue: 728300, deposits: 134, ftds: 52, target: 600000 },
  { month: 'Jan', revenue: 691500, deposits: 127, ftds: 49, target: 650000 },
  { month: 'Fev', revenue: 845600, deposits: 156, ftds: 61, target: 700000 },
  { month: 'Mar', revenue: totalRevenue, deposits: DEPOSIT_LEADS.length, ftds: totalFTDs, target: 750000 },
];

// Revenue by segment
const revenueBySegment = SEG_META.filter((s) => s.group === 'hot' || s.group === 'compliance' || s.group === 'risk')
  .map((s) => {
    const leads = MOCK_LEADS.filter((l) => l.segment === s.key && l.depositAmount);
    const rev = leads.reduce((sum, l) => sum + (l.depositAmount ?? 0), 0);
    return { name: s.label, revenue: rev, count: leads.length, color: s.color, icon: s.icon };
  }).filter((d) => d.revenue > 0).sort((a, b) => b.revenue - a.revenue);

// Deposit distribution
const depositBuckets = [
  { range: 'R$500-2K', count: 0, color: '#3b82f6' },
  { range: 'R$2K-5K', count: 0, color: '#6366f1' },
  { range: 'R$5K-10K', count: 0, color: '#8b5cf6' },
  { range: 'R$10K-25K', count: 0, color: '#a78bfa' },
  { range: 'R$25K-50K', count: 0, color: '#f97316' },
];
DEPOSIT_LEADS.forEach((l) => {
  const a = l.depositAmount ?? 0;
  if (a < 2000) depositBuckets[0].count++;
  else if (a < 5000) depositBuckets[1].count++;
  else if (a < 10000) depositBuckets[2].count++;
  else if (a < 25000) depositBuckets[3].count++;
  else depositBuckets[4].count++;
});

// Hourly deposit flow
const hourlyDeposits = Array.from({ length: 12 }, (_, i) => ({
  hour: `${String(8 + i).padStart(2, '0')}:00`,
  deposits: Math.floor(3 + Math.sin(i * 0.9) * 4 + Math.random() * 6),
  value: Math.floor(8000 + Math.sin(i * 0.7) * 5000 + Math.random() * 12000),
  ftds: Math.floor(1 + Math.random() * 3),
}));

// Top depositors
const topDepositors = [...DEPOSIT_LEADS]
  .sort((a, b) => (b.depositAmount ?? 0) - (a.depositAmount ?? 0))
  .slice(0, 8);

// LTV cohorts
const ltvCohorts = [
  { cohort: 'Jan 2026', clients: 89, ltv: 4200, retention: 78 },
  { cohort: 'Fev 2026', clients: 112, ltv: 3800, retention: 82 },
  { cohort: 'Mar 2026', clients: 134, ltv: 5100, retention: 71 },
];

function fmtBRL(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(v);
}

function fmtCompact(v: number) {
  if (v >= 1000000) return `R$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}K`;
  return fmtBRL(v);
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="font-bold text-white mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? p.stroke ?? '#94a3b8' }}>
          {p.name}: <span className="font-bold">{typeof p.value === 'number' && p.value > 100 ? fmtBRL(p.value) : p.value}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Revenue KPI Card ────────────────────────────────────────────────────────

function RevenueKPI({
  label, value, sub, icon: Icon, color, trend, trendUp,
}: {
  label: string; value: string; sub?: string;
  icon: React.ElementType; color: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="rounded-xl p-5 relative overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="absolute top-0 right-0 w-24 h-24 opacity-[0.04]" style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: color + '18', color, border: `1px solid ${color}33` }}>
          <Icon size={18} />
        </div>
        {trend && (
          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: (trendUp ? '#10b981' : '#ef4444') + '18', color: trendUp ? '#10b981' : '#ef4444' }}>
            {trendUp ? <ArrowUpRight size={10} /> : <ArrowDownRight size={10} />}
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-white leading-none mb-1" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      <div className="text-[11px] font-medium" style={{ color: '#64748b' }}>{label}</div>
      {sub && <div className="text-[10px] font-mono mt-1" style={{ color: '#334155' }}>{sub}</div>}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function RevenueView() {
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  const prevMonth = monthlyRevenue[monthlyRevenue.length - 2];
  const currentMonth = monthlyRevenue[monthlyRevenue.length - 1];
  const revenueGrowth = ((currentMonth.revenue - prevMonth.revenue) / prevMonth.revenue * 100).toFixed(1);
  const targetPct = ((currentMonth.revenue / currentMonth.target) * 100).toFixed(0);

  return (
    <div className="p-6 space-y-5">

      {/* KPI Row */}
      <div className="grid grid-cols-6 gap-3">
        <RevenueKPI label="Total Revenue"     value={fmtCompact(totalRevenue)}          icon={CircleDollarSign} color="#10b981" trend={`+${revenueGrowth}%`} trendUp sub="This month" />
        <RevenueKPI label="Avg. Deposit"       value={fmtBRL(Math.round(avgDeposit))}    icon={Wallet}          color="#6366f1" trend="+8.3%" trendUp    sub="Per client" />
        <RevenueKPI label="Total FTDs"         value={String(totalFTDs)}                  icon={CreditCard}      color="#8b5cf6" trend="+12"   trendUp    sub="First-time deposits" />
        <RevenueKPI label="Max Deposit"        value={fmtBRL(maxDeposit)}                 icon={Crown}           color="#f97316" sub="Highest single deposit" />
        <RevenueKPI label="LTV / Client"       value={fmtBRL(Math.round(conversionValue))} icon={Gem}             color="#06b6d4" trend="+5.2%" trendUp   sub="Lifetime value avg" />
        <RevenueKPI label="Target Progress"    value={`${targetPct}%`}                    icon={Target}          color={Number(targetPct) >= 100 ? '#10b981' : '#f59e0b'} sub={`${fmtCompact(currentMonth.target)} goal`} />
      </div>

      {/* Revenue trend + Target */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#10b981' }}>
              Revenue vs Target
            </div>
            <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
              {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="px-3 py-1 rounded-md text-[10px] font-semibold capitalize transition-all"
                  style={period === p ? { background: '#10b981', color: '#fff' } : { color: '#475569' }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <ComposedChart data={monthlyRevenue}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="month" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#revGrad)" strokeWidth={2.5} />
              <Line type="monotone" dataKey="target" name="Target" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="6 4" dot={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Deposit distribution */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#8b5cf6' }}>
            Deposit Distribution
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={depositBuckets} dataKey="count" cx="50%" cy="50%" innerRadius={40} outerRadius={62} paddingAngle={3}>
                {depositBuckets.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {depositBuckets.map((d) => (
              <div key={d.range} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span style={{ color: '#64748b' }}>{d.range}</span>
                </div>
                <span className="font-bold font-mono" style={{ color: d.color }}>{d.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Middle row: Hourly flow + Revenue by segment */}
      <div className="grid grid-cols-3 gap-4">

        {/* Hourly deposit flow */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Hourly Deposit Flow
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={hourlyDeposits} barSize={18} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="left" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<ChartTip />} />
              <Bar yAxisId="left" dataKey="deposits" name="Deposits" fill="#6366f1" radius={[3, 3, 0, 0]} />
              <Bar yAxisId="left" dataKey="ftds" name="FTDs" fill="#10b981" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue by segment */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#f97316' }}>
            Revenue by Segment
          </div>
          <div className="space-y-3">
            {revenueBySegment.slice(0, 6).map((s) => {
              const maxRev = revenueBySegment[0]?.revenue ?? 1;
              const pct = (s.revenue / maxRev) * 100;
              return (
                <div key={s.name}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{s.icon}</span>
                      <span className="text-[11px] font-medium" style={{ color: '#94a3b8' }}>{s.name}</span>
                    </div>
                    <span className="text-[11px] font-mono font-bold" style={{ color: s.color }}>{fmtCompact(s.revenue)}</span>
                  </div>
                  <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a35' }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
                  </div>
                  <div className="text-[9px] font-mono mt-0.5" style={{ color: '#334155' }}>{s.count} deposits</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bottom: Top depositors + LTV Cohorts */}
      <div className="grid grid-cols-3 gap-4">

        {/* Top depositors */}
        <div className="col-span-2 rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1a1a35' }}>
            <Trophy size={13} style={{ color: '#f59e0b' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#f59e0b' }}>Top Depositors</span>
            <div className="w-2 h-2 rounded-full animate-pulse ml-1" style={{ background: '#10b981' }} />
          </div>
          <div className="divide-y" style={{ borderColor: '#1a1a3522' } as any}>
            {topDepositors.map((lead, i) => {
              const meta = SEG_META.find((s) => s.key === lead.segment);
              const medals = ['🥇', '🥈', '🥉'];
              return (
                <div key={lead.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02] transition-colors">
                  <span className="text-lg w-6 text-center shrink-0">
                    {i < 3 ? medals[i] : <span className="text-[11px] font-mono" style={{ color: '#334155' }}>#{i + 1}</span>}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black shrink-0"
                    style={{ background: (meta?.color ?? '#6366f1') + '22', color: meta?.color ?? '#6366f1', border: `1px solid ${(meta?.color ?? '#6366f1')}44` }}>
                    {lead.name.split(' ').map((p) => p[0]).join('').slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-white">{lead.name}</div>
                    <div className="text-[10px] font-mono" style={{ color: '#334155' }}>#{lead.crmId}</div>
                  </div>
                  <span className="text-[9px] px-2 py-0.5 rounded-full font-bold"
                    style={{ background: (meta?.color ?? '#475569') + '22', color: meta?.color ?? '#475569', border: `1px solid ${(meta?.color ?? '#475569')}33` }}>
                    {meta?.icon} {meta?.label}
                  </span>
                  <div className="text-right shrink-0">
                    <div className="text-[14px] font-black font-mono" style={{ color: '#10b981' }}>
                      {fmtBRL(lead.depositAmount ?? 0)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* LTV Cohorts */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-4">
            <PiggyBank size={13} style={{ color: '#06b6d4' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#06b6d4' }}>LTV Cohorts</span>
          </div>
          <div className="space-y-4">
            {ltvCohorts.map((c) => (
              <div key={c.cohort} className="rounded-xl p-4" style={{ background: '#05050f', border: '1px solid #1a1a3566' }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Calendar size={11} style={{ color: '#06b6d4' }} />
                    <span className="text-[11px] font-semibold text-white">{c.cohort}</span>
                  </div>
                  <span className="text-[10px] font-mono" style={{ color: '#334155' }}>{c.clients} clients</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-[16px] font-black font-mono" style={{ color: '#10b981' }}>{fmtBRL(c.ltv)}</div>
                    <div className="text-[9px]" style={{ color: '#475569' }}>Avg LTV</div>
                  </div>
                  <div>
                    <div className="text-[16px] font-black font-mono" style={{ color: '#8b5cf6' }}>{c.retention}%</div>
                    <div className="text-[9px]" style={{ color: '#475569' }}>Retention</div>
                  </div>
                </div>
                <div className="h-1 rounded-full mt-2 overflow-hidden" style={{ background: '#1a1a35' }}>
                  <div className="h-full rounded-full" style={{ width: `${c.retention}%`, background: `linear-gradient(90deg, #06b6d4, #8b5cf6)` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
