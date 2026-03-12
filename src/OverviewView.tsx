import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { TrendingUp, Users, CheckCircle2, MessageCircle, AlertTriangle, Zap, Activity } from 'lucide-react';
import { MOCK_LEADS, SEG_META, AGENTS } from './types';

// ─── Data derivation ──────────────────────────────────────────────────────────

const total = MOCK_LEADS.length;
const hot = MOCK_LEADS.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length;
const verified = MOCK_LEADS.filter((l) => l.segment === 'DOCS_VERIFIED').length;
const activeWA = MOCK_LEADS.filter((l) => l.segment === 'SKIP_ACTIVE').length;
const failed = MOCK_LEADS.filter((l) => l.segment === 'FAILED_DEPOSIT').length;
const convRate = ((verified / total) * 100).toFixed(1);

const segChartData = SEG_META.slice(0, 10).map((s) => ({
  name: s.label.length > 14 ? s.label.slice(0, 13) + '…' : s.label,
  count: MOCK_LEADS.filter((l) => l.segment === s.key).length,
  color: s.color,
})).sort((a, b) => b.count - a.count).slice(0, 8);

const channelData = [
  { name: 'Email', value: MOCK_LEADS.filter((l) => l.channel === 'email').length, color: '#6366f1' },
  { name: 'WhatsApp', value: MOCK_LEADS.filter((l) => l.channel === 'wa').length, color: '#25d366' },
];

const agentData = AGENTS.filter((a) => a !== 'Unassigned').map((agent) => {
  const agentLeads = MOCK_LEADS.filter((l) => l.assignedTo === agent);
  return {
    name: agent,
    total: agentLeads.length,
    hot: agentLeads.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length,
    verified: agentLeads.filter((l) => l.segment === 'DOCS_VERIFIED').length,
  };
});

// Simulated hourly activity
const hourlyData = Array.from({ length: 12 }, (_, i) => ({
  hour: `${String(8 + i).padStart(2, '0')}:00`,
  leads: Math.floor(15 + Math.sin(i * 0.8) * 10 + Math.random() * 15),
  conversions: Math.floor(3 + Math.cos(i * 0.6) * 2 + Math.random() * 5),
}));

// Recent activity feed (derived from leads, last 10)
const recentActivity = MOCK_LEADS.slice(0, 12).map((l) => {
  const meta = SEG_META.find((s) => s.key === l.segment)!;
  return { name: l.name, label: meta.label, icon: meta.icon, color: meta.color, time: l.updatedAt };
});

// ─── KPI Card ─────────────────────────────────────────────────────────────────

function KPICard({
  label, value, sub, icon: Icon, color, trend,
}: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string; trend?: string;
}) {
  return (
    <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: color + '22', color }}
        >
          <Icon size={17} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ background: '#10b98122', color: '#10b981' }}>
            {trend}
          </span>
        )}
      </div>
      <div className="text-3xl font-black text-white leading-none mb-1">{value}</div>
      <div className="text-[11px] font-medium" style={{ color: '#64748b' }}>{label}</div>
      {sub && <div className="text-[10px] font-mono mt-1" style={{ color: '#334155' }}>{sub}</div>}
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
        <div key={p.name} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}</span></div>
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

  // Animate a "live" count slight variation
  const liveFeed = recentActivity[(tick % recentActivity.length)];

  return (
    <div className="p-6 space-y-6">

      {/* KPI Grid */}
      <div className="grid grid-cols-6 gap-4">
        <KPICard label="Total Leads"       value={total}       icon={Users}         color="#6366f1" trend="+12%" sub="All pipeline leads" />
        <KPICard label="Hot Leads"         value={hot}         icon={Zap}           color="#f97316" trend="+5%"  sub="High intent + PIX" />
        <KPICard label="Docs Verified"     value={verified}    icon={CheckCircle2}  color="#10b981"              sub={`${((verified/total)*100).toFixed(0)}% verified`} />
        <KPICard label="Active WhatsApp"   value={activeWA}    icon={MessageCircle} color="#25d366"              sub="Live conversations" />
        <KPICard label="Failed Deposits"   value={failed}      icon={AlertTriangle} color="#ef4444"              sub="Requires follow-up" />
        <KPICard label="Conv. Rate"        value={`${convRate}%`} icon={TrendingUp}  color="#8b5cf6"             sub="Docs verified / total" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Segment bar chart */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Leads by Segment
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={segChartData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
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

        {/* Channel pie */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Channel Split
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={channelData} dataKey="value" cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={4}>
                {channelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-2 mt-3">
            {channelData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: d.color }} />
                  <span style={{ color: '#94a3b8' }}>{d.name}</span>
                </div>
                <span className="font-bold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Hourly activity line chart */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Hourly Activity
          </div>
          <ResponsiveContainer width="100%" height={180}>
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

        {/* Live activity feed */}
        <div className="rounded-xl p-5 overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={13} style={{ color: '#6366f1' }} />
            <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>
              Live Feed
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse ml-auto" style={{ background: '#10b981' }} />
          </div>
          <div className="space-y-2.5">
            {recentActivity.slice(0, 8).map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-2.5 p-2 rounded-lg transition-all"
                style={{
                  background: i === tick % 8 ? item.color + '11' : 'transparent',
                  border: `1px solid ${i === tick % 8 ? item.color + '33' : 'transparent'}`,
                }}
              >
                <span className="text-base shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-semibold text-white truncate">{item.name}</div>
                  <div className="text-[10px]" style={{ color: item.color }}>{item.label}</div>
                </div>
                <span className="text-[10px] font-mono shrink-0" style={{ color: '#334155' }}>{item.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
