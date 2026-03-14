import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  TrendingUp, Users, CheckCircle2, MessageCircle, AlertTriangle, Zap,
  Activity, DollarSign, Brain, ArrowUpRight, ArrowDownRight, Crown,
  Target, Sparkles, CreditCard, Heart,
} from 'lucide-react';
import { MOCK_LEADS, SEG_META, AGENTS } from './types';

// ─── Data derivation ──────────────────────────────────────────────────────────

const total = MOCK_LEADS.length;
const hot = MOCK_LEADS.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length;
const verified = MOCK_LEADS.filter((l) => l.segment === 'DOCS_VERIFIED').length;
const activeWA = MOCK_LEADS.filter((l) => l.segment === 'SKIP_ACTIVE').length;
const failed = MOCK_LEADS.filter((l) => l.segment === 'FAILED_DEPOSIT').length;
const convRate = ((verified / total) * 100).toFixed(1);
const newLeads = MOCK_LEADS.filter((l) => l.segment === 'NEW_LEAD').length;
const depositsTotal = MOCK_LEADS.filter((l) => l.depositAmount).reduce((s, l) => s + (l.depositAmount ?? 0), 0);
const avgDeposit = depositsTotal / (MOCK_LEADS.filter((l) => l.depositAmount).length || 1);

function fmtBRL(v: number) {
  if (v >= 1000000) return `R$${(v / 1000000).toFixed(1)}M`;
  if (v >= 1000) return `R$${(v / 1000).toFixed(0)}K`;
  return `R$${v.toFixed(0)}`;
}

const segChartData = SEG_META.slice(0, 10).map((s) => ({
  name: s.label.length > 14 ? s.label.slice(0, 13) + '...' : s.label,
  count: MOCK_LEADS.filter((l) => l.segment === s.key).length,
  color: s.color,
})).sort((a, b) => b.count - a.count).slice(0, 8);

const channelData = [
  { name: 'Email', value: MOCK_LEADS.filter((l) => l.channel === 'email').length, color: '#6366f1' },
  { name: 'WhatsApp', value: MOCK_LEADS.filter((l) => l.channel === 'wa').length, color: '#25d366' },
];

// Simulated hourly activity
const hourlyData = Array.from({ length: 12 }, (_, i) => ({
  hour: `${String(8 + i).padStart(2, '0')}:00`,
  leads: Math.floor(15 + Math.sin(i * 0.8) * 10 + Math.random() * 15),
  conversions: Math.floor(3 + Math.cos(i * 0.6) * 2 + Math.random() * 5),
  revenue: Math.floor(5000 + Math.sin(i * 0.9) * 3000 + Math.random() * 8000),
}));

// Revenue trend (last 7 days)
const revenueTrend = [
  { day: 'Seg', revenue: 42000, target: 35000 },
  { day: 'Ter', revenue: 38000, target: 35000 },
  { day: 'Qua', revenue: 55000, target: 40000 },
  { day: 'Qui', revenue: 48000, target: 40000 },
  { day: 'Sex', revenue: 62000, target: 45000 },
  { day: 'Sab', revenue: 31000, target: 25000 },
  { day: 'Hoje', revenue: depositsTotal > 0 ? Math.round(depositsTotal / 10) : 58000, target: 45000 },
];

// Recent activity feed (derived from leads, last 12)
const recentActivity = MOCK_LEADS.slice(0, 12).map((l) => {
  const meta = SEG_META.find((s) => s.key === l.segment)!;
  return { name: l.name, label: meta.label, icon: meta.icon, color: meta.color, time: l.updatedAt, deposit: l.depositAmount };
});

// AI quick insights
const aiInsights = [
  { text: '22 leads com alta probabilidade de conversao detectados', color: '#f97316', icon: '🔥' },
  { text: 'Modelo de scoring atualizado: accuracy 93%', color: '#8b5cf6', icon: '🧠' },
  { text: '5 leads em risco de churn — acao recomendada', color: '#ef4444', icon: '⚠️' },
  { text: 'Campanha PIX Nudge superou benchmark em 57%', color: '#10b981', icon: '📈' },
];

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, icon: Icon, color, trend, trendUp,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="rounded-xl p-4 relative overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="absolute top-0 right-0 w-20 h-20 opacity-[0.04]" style={{ background: `radial-gradient(circle, ${color}, transparent)` }} />
      <div className="flex items-start justify-between mb-2.5">
        <div className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: color + '18', color, border: `1px solid ${color}33` }}>
          <Icon size={16} />
        </div>
        {trend && (
          <span className="flex items-center gap-0.5 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ background: (trendUp !== false ? '#10b981' : '#ef4444') + '18', color: trendUp !== false ? '#10b981' : '#ef4444' }}>
            {trendUp !== false ? <ArrowUpRight size={9} /> : <ArrowDownRight size={9} />}
            {trend}
          </span>
        )}
      </div>
      <div className="text-2xl font-black text-white leading-none mb-0.5" style={{ fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      <div className="text-[10px] font-medium" style={{ color: '#64748b' }}>{label}</div>
      {sub && <div className="text-[9px] font-mono mt-0.5" style={{ color: '#334155' }}>{sub}</div>}
    </div>
  );
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="font-bold text-white mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? p.stroke ?? '#94a3b8' }}>{p.name}: <span className="font-bold">{p.value}</span></div>
      ))}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function OverviewView() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 space-y-5">

      {/* KPI Grid - 8 cards */}
      <div className="grid grid-cols-4 gap-3">
        <KPICard label="Total Leads"       value={total}             icon={Users}         color="#6366f1" trend="+12%"  sub="All pipeline" />
        <KPICard label="Hot Leads"         value={hot}               icon={Zap}           color="#f97316" trend="+5%"   sub="High intent + PIX" />
        <KPICard label="Docs Verified"     value={verified}          icon={CheckCircle2}  color="#10b981" trend="+8%"   sub={`${((verified/total)*100).toFixed(0)}% verified`} />
        <KPICard label="Revenue"           value={fmtBRL(depositsTotal)} icon={DollarSign} color="#10b981" trend="+22.7%" sub="Total deposits" />
        <KPICard label="Active WhatsApp"   value={activeWA}          icon={MessageCircle} color="#25d366"               sub="Live conversations" />
        <KPICard label="Failed Deposits"   value={failed}            icon={AlertTriangle} color="#ef4444" trend="-3" trendUp={false} sub="Requires follow-up" />
        <KPICard label="Conv. Rate"        value={`${convRate}%`}    icon={TrendingUp}    color="#8b5cf6"               sub="Docs verified / total" />
        <KPICard label="Avg Deposit"       value={fmtBRL(Math.round(avgDeposit))} icon={CreditCard} color="#06b6d4"     sub="Per client" />
      </div>

      {/* Charts row 1: Segment chart + Revenue trend + Channel pie */}
      <div className="grid grid-cols-12 gap-4">

        {/* Segment bar chart */}
        <div className="col-span-5 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Leads by Segment
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={segChartData} barSize={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {segChartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue trend */}
        <div className="col-span-4 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#10b981' }}>
              Revenue Trend
            </div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: '#10b98118', color: '#10b981' }}>
              <ArrowUpRight size={9} /> +22.7%
            </span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={revenueTrend}>
              <defs>
                <linearGradient id="ovRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v/1000).toFixed(0)}K`} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="revenue" name="Revenue" stroke="#10b981" fill="url(#ovRevGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="target" name="Target" stroke="#f59e0b44" fill="none" strokeWidth={1} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Channel pie + AI Insights */}
        <div className="col-span-3 space-y-4">
          <div className="rounded-xl p-4" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="text-[11px] font-mono tracking-widest uppercase mb-3" style={{ color: '#6366f1' }}>
              Channel Split
            </div>
            <ResponsiveContainer width="100%" height={110}>
              <PieChart>
                <Pie data={channelData} dataKey="value" cx="50%" cy="50%" innerRadius={32} outerRadius={50} paddingAngle={4}>
                  {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip content={<ChartTip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5 mt-2">
              {channelData.map((d) => (
                <div key={d.name} className="flex items-center justify-between text-[10px]">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                    <span style={{ color: '#94a3b8' }}>{d.name}</span>
                  </div>
                  <span className="font-bold text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-12 gap-4">

        {/* Hourly activity line chart */}
        <div className="col-span-5 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Hourly Activity
          </div>
          <ResponsiveContainer width="100%" height={170}>
            <LineChart data={hourlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Line type="monotone" dataKey="leads" stroke="#6366f1" strokeWidth={2} dot={false} name="Leads" />
              <Line type="monotone" dataKey="conversions" stroke="#10b981" strokeWidth={2} dot={false} name="Conversions" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* AI Insights preview */}
        <div className="col-span-4 rounded-xl p-5 relative overflow-hidden" style={{
          background: 'linear-gradient(135deg, #0d0d22 0%, #150a28 100%)',
          border: '1px solid #8b5cf633',
        }}>
          <div className="absolute inset-0 opacity-5"
            style={{ background: 'radial-gradient(ellipse at 50% 0%, #8b5cf6, transparent 70%)' }} />
          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <Brain size={13} style={{ color: '#8b5cf6' }} />
              <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#8b5cf6' }}>
                AI Insights
              </div>
              <Sparkles size={10} style={{ color: '#a78bfa' }} className="animate-pulse" />
            </div>
            <div className="space-y-2.5">
              {aiInsights.map((insight, i) => (
                <div
                  key={i}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg transition-all"
                  style={{
                    background: i === tick % aiInsights.length ? insight.color + '0a' : 'transparent',
                    border: `1px solid ${i === tick % aiInsights.length ? insight.color + '22' : 'transparent'}`,
                  }}
                >
                  <span className="text-sm shrink-0 mt-0.5">{insight.icon}</span>
                  <span className="text-[11px] leading-snug" style={{ color: '#94a3b8' }}>{insight.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live activity feed */}
        <div className="col-span-3 rounded-xl p-4 overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-3">
            <Activity size={12} style={{ color: '#6366f1' }} />
            <div className="text-[10px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>
              Live Feed
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse ml-auto" style={{ background: '#10b981' }} />
          </div>
          <div className="space-y-2">
            {recentActivity.slice(0, 7).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2 p-1.5 rounded-lg transition-all"
                style={{
                  background: i === tick % 7 ? item.color + '0a' : 'transparent',
                  border: `1px solid ${i === tick % 7 ? item.color + '22' : 'transparent'}`,
                }}
              >
                <span className="text-sm shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-semibold text-white truncate">{item.name}</div>
                  <div className="text-[9px]" style={{ color: item.color }}>{item.label}</div>
                </div>
                {item.deposit && (
                  <span className="text-[8px] font-bold font-mono" style={{ color: '#10b981' }}>
                    R${(item.deposit/1000).toFixed(0)}K
                  </span>
                )}
                <span className="text-[9px] font-mono shrink-0" style={{ color: '#334155' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
