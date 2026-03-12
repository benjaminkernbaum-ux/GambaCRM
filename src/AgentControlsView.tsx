import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Bot, TrendingUp, CheckCircle2, AlertCircle, Users, Zap, RefreshCw, ChevronDown } from 'lucide-react';
import { MOCK_LEADS, AGENTS, SEG_META } from './types';

// ─── Per-agent stats ──────────────────────────────────────────────────────────

const agentStats = AGENTS.map((agent, idx) => {
  const leads = MOCK_LEADS.filter((l) => l.assignedTo === agent);
  const hot = leads.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length;
  const verified = leads.filter((l) => l.segment === 'DOCS_VERIFIED').length;
  const failed = leads.filter((l) => l.segment === 'FAILED_DEPOSIT').length;
  const waActive = leads.filter((l) => l.segment === 'SKIP_ACTIVE').length;
  const convRate = leads.length ? ((verified / leads.length) * 100).toFixed(1) : '0.0';
  const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#64748b'];
  return {
    name: agent,
    total: leads.length,
    hot,
    verified,
    failed,
    waActive,
    convRate,
    color: colors[idx % colors.length],
    active: agent !== 'Unassigned',
  };
}).sort((a, b) => b.total - a.total);

const topSegmentPerAgent = AGENTS.map((agent) => {
  const leads = MOCK_LEADS.filter((l) => l.assignedTo === agent);
  const segCounts: Record<string, number> = {};
  leads.forEach((l) => { segCounts[l.segment] = (segCounts[l.segment] || 0) + 1; });
  const topSeg = Object.entries(segCounts).sort((a, b) => b[1] - a[1])[0];
  if (!topSeg) return { agent, meta: null, count: 0 };
  const meta = SEG_META.find((s) => s.key === topSeg[0]);
  return { agent, meta, count: topSeg[1] };
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function StatPill({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="text-center">
      <div className="text-lg font-black" style={{ color }}>{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#334155' }}>{label}</div>
    </div>
  );
}

// ─── Reassign Modal ───────────────────────────────────────────────────────────

function ReassignDropdown({ currentAgent, onSelect }: { currentAgent: string; onSelect: (a: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
        style={{ background: '#6366f122', border: '1px solid #6366f144', color: '#818cf8' }}
      >
        <RefreshCw size={11} /> Reassign <ChevronDown size={10} />
      </button>
      {open && (
        <div
          className="absolute top-full mt-1 right-0 z-50 rounded-xl py-1 w-36"
          style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}
        >
          {AGENTS.filter((a) => a !== currentAgent).map((a) => (
            <button
              key={a}
              className="w-full text-left px-3 py-2 text-[11px] font-medium hover:bg-white/5"
              style={{ color: '#94a3b8' }}
              onClick={() => { onSelect(a); setOpen(false); }}
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AgentControlsView() {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AGENTS.map((a) => [a, a !== 'Unassigned']))
  );

  const toggleAgent = (name: string) => {
    setActiveStates((s) => ({ ...s, [name]: !s[name] }));
  };

  const barData = agentStats.map((a) => ({
    name: a.name.split(' ')[0],
    Total: a.total,
    Hot: a.hot,
    Verified: a.verified,
    color: a.color,
  }));

  return (
    <div className="p-6 space-y-6">

      {/* Header KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Agents', value: AGENTS.length - 1, icon: Bot, color: '#6366f1' },
          { label: 'Active Now', value: Object.values(activeStates).filter(Boolean).length - (activeStates['Unassigned'] ? 1 : 0), icon: CheckCircle2, color: '#10b981' },
          { label: 'Total Leads', value: MOCK_LEADS.length, icon: Users, color: '#8b5cf6' },
          { label: 'Avg Conv. Rate', value: (agentStats.filter(a => a.name !== 'Unassigned').reduce((s, a) => s + parseFloat(a.convRate), 0) / (AGENTS.length - 1)).toFixed(1) + '%', icon: TrendingUp, color: '#f97316' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: k.color + '22', color: k.color }}>
                <k.icon size={17} />
              </div>
            </div>
            <div className="text-3xl font-black text-white leading-none mb-1">{k.value}</div>
            <div className="text-[11px]" style={{ color: '#64748b' }}>{k.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4">

        {/* Agent cards */}
        <div className="col-span-2 space-y-3">
          <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>Agent Roster</div>
          {agentStats.map((agent) => {
            const isActive = activeStates[agent.name] ?? false;
            return (
              <div
                key={agent.name}
                className="rounded-xl p-4"
                style={{ background: '#0d0d22', border: `1px solid ${isActive ? '#1a1a35' : '#1a1a3566'}` }}
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-black shrink-0"
                    style={{ background: agent.color + '22', color: agent.color, border: `1px solid ${agent.color}44` }}
                  >
                    {agent.name.slice(0, 2).toUpperCase()}
                  </div>

                  {/* Name + role */}
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-white text-[13px]">{agent.name}</div>
                    <div className="text-[10px] font-mono" style={{ color: '#475569' }}>
                      Account Manager · {agent.total} leads
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center gap-6">
                    <StatPill value={agent.hot}     label="Hot"      color="#f97316" />
                    <StatPill value={agent.verified} label="Verified" color="#10b981" />
                    <StatPill value={agent.failed}   label="Failed"   color="#ef4444" />
                    <StatPill value={agent.convRate + '%'} label="Conv" color="#8b5cf6" />
                  </div>

                  {/* Active toggle */}
                  <button
                    onClick={() => toggleAgent(agent.name)}
                    className="relative w-11 h-6 rounded-full transition-all shrink-0"
                    style={{ background: isActive ? '#10b981' : '#1a1a35' }}
                  >
                    <div
                      className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                      style={{ left: isActive ? '22px' : '2px' }}
                    />
                  </button>

                  <ReassignDropdown currentAgent={agent.name} onSelect={() => {}} />
                </div>

                {/* Top segment */}
                {topSegmentPerAgent.find(t => t.agent === agent.name)?.meta && (
                  <div className="mt-2 pt-2 flex items-center gap-2" style={{ borderTop: '1px solid #1a1a35' }}>
                    <span className="text-[10px]" style={{ color: '#334155' }}>Top segment:</span>
                    <span className="text-sm">{topSegmentPerAgent.find(t => t.agent === agent.name)!.meta!.icon}</span>
                    <span className="text-[10px] font-medium" style={{ color: topSegmentPerAgent.find(t => t.agent === agent.name)!.meta!.color }}>
                      {topSegmentPerAgent.find(t => t.agent === agent.name)!.meta!.label}
                    </span>
                    <span className="text-[10px] font-mono ml-1" style={{ color: '#475569' }}>
                      ({topSegmentPerAgent.find(t => t.agent === agent.name)!.count})
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bar chart */}
        <div className="space-y-4">
          <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
              Lead Distribution
            </div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barData} layout="vertical" barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={55} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="Total" radius={[0, 4, 4, 0]} name="Total">
                  {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* System status */}
          <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
              System Status
            </div>
            <div className="space-y-3">
              {[
                { label: 'WhatsApp Bot',    status: 'Operational', color: '#10b981' },
                { label: 'Email Agent',     status: 'Operational', color: '#10b981' },
                { label: 'CRM Sync',        status: 'Syncing…',    color: '#f59e0b' },
                { label: 'Lead Scoring AI', status: 'Operational', color: '#10b981' },
                { label: 'Notifications',   status: 'Operational', color: '#10b981' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-[11px]">
                  <span style={{ color: '#64748b' }}>{s.label}</span>
                  <span className="flex items-center gap-1.5 font-semibold" style={{ color: s.color }}>
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: s.color }} />
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
