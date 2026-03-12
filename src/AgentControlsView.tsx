import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import {
  Bot, TrendingUp, CheckCircle2, Users, Zap, RefreshCw,
  ChevronDown, Play, Square, RotateCcw, MessageCircle,
  Mail, Database, Brain, Terminal, Wifi, WifiOff,
  AlertTriangle, ChevronRight, Loader2,
} from 'lucide-react';
import { MOCK_LEADS, AGENTS, SEG_META } from './types';

// ─── Per-agent stats ──────────────────────────────────────────────────────────

const agentStats = AGENTS.map((agent, idx) => {
  const leads  = MOCK_LEADS.filter((l) => l.assignedTo === agent);
  const hot      = leads.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length;
  const verified = leads.filter((l) => l.segment === 'DOCS_VERIFIED').length;
  const failed   = leads.filter((l) => l.segment === 'FAILED_DEPOSIT').length;
  const convRate = leads.length ? ((verified / leads.length) * 100).toFixed(1) : '0.0';
  const colors   = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f97316', '#64748b'];
  const topSegs  = {} as Record<string, number>;
  leads.forEach((l) => { topSegs[l.segment] = (topSegs[l.segment] || 0) + 1; });
  const topSeg   = Object.entries(topSegs).sort((a, b) => b[1] - a[1])[0];
  const topMeta  = topSeg ? SEG_META.find((s) => s.key === topSeg[0]) ?? null : null;
  return { name: agent, total: leads.length, hot, verified, failed, convRate, color: colors[idx % colors.length], topMeta, topCount: topSeg?.[1] ?? 0 };
}).sort((a, b) => b.total - a.total);

// ─── Types ────────────────────────────────────────────────────────────────────

type AgentStatus = 'running' | 'stopped' | 'loading' | 'error' | 'syncing';

interface AutoAgent {
  id: string;
  name: string;
  description: string;
  icon: React.ElementType;
  color: string;
  metrics: { label: string; value: string | number }[];
  logSeed: string[];
}

// ─── Automation agent definitions ─────────────────────────────────────────────

const AUTO_AGENTS: AutoAgent[] = [
  {
    id: 'whatsapp',
    name: 'WhatsApp Agent',
    description: 'Automated WA messaging · sequence & reply bot',
    icon: MessageCircle,
    color: '#25d366',
    metrics: [
      { label: 'Queue',    value: 38  },
      { label: 'Sent/hr',  value: 124 },
      { label: 'Read %',   value: '87%' },
      { label: 'Reply %',  value: '34%' },
    ],
    logSeed: [
      'Sending welcome sequence to Carlos Silva (#540001)',
      'PIX reminder dispatched → Ana Souza (#540002)',
      'High-intent follow-up sent → Pedro Lima (#540009)',
      'Auto-reply triggered: "Docs required" → Julia Costa',
      'Batch sent: 12 cooldown leads re-engaged',
      'Template "PIX_PAYMENT_NUDGE" delivered × 23',
      'Webhook received: message_read from #540041',
      'Sequence step 2 queued for 8 leads',
    ],
  },
  {
    id: 'email',
    name: 'Email CRM Agent',
    description: 'Campaign scheduler · drip sequences · analytics',
    icon: Mail,
    color: '#6366f1',
    metrics: [
      { label: 'Queued',   value: 94  },
      { label: 'Sent/hr',  value: 67  },
      { label: 'Open %',   value: '34%' },
      { label: 'Click %',  value: '9%'  },
    ],
    logSeed: [
      'Campaign "Welcome Series" dispatched × 47',
      'Drip sequence: step 3 sent to 18 leads',
      'Bounced email flagged → marcos7@yahoo.com.br',
      'A/B test variant B selected (62% open rate)',
      'Unsubscribe processed → beatriz12@gmail.com',
      'Retry queue flushed: 6 soft-bounce re-attempts',
      'New campaign scheduled: "Docs Verification" at 14:00',
      'SMTP connection pool: 4/5 healthy',
    ],
  },
  {
    id: 'gamba_sync',
    name: 'GAMBA CRM Sync',
    description: 'Bi-directional sync · lead import · segment push',
    icon: Database,
    color: '#f97316',
    metrics: [
      { label: 'Synced',   value: 719 },
      { label: 'Pending',  value: 12  },
      { label: 'Conflicts',value: 2   },
      { label: 'Last sync',value: '3m ago' },
    ],
    logSeed: [
      'Full sync initiated: 719 records fetched',
      'Segment update pushed: HIGH_INTENT_DEPOSIT × 22',
      'New leads imported: 7 from GAMBA portal',
      'Conflict resolved: assignedTo mismatch → Rafael',
      'Webhook push: deposit_confirmed → #540044',
      'Incremental sync: 12 changed records detected',
      'Stage update: STAGE_2 → STAGE_3 for 9 leads',
      'CRM token refresh: OK (expires in 47m)',
    ],
  },
  {
    id: 'lead_ai',
    name: 'Lead Scoring AI',
    description: 'ML scoring · segment prediction · priority ranking',
    icon: Brain,
    color: '#8b5cf6',
    metrics: [
      { label: 'Scored',   value: 719 },
      { label: 'Hot flags', value: 43  },
      { label: 'Accuracy', value: '91%' },
      { label: 'Model',    value: 'v2.4' },
    ],
    logSeed: [
      'Batch scoring complete: 719 leads processed',
      'High-intent flag raised → Lucas Ferreira (#540019)',
      'Risk alert: stop-out probability 87% → Ricardo Gomes',
      'Model retrain triggered: 14 new labeled samples',
      'Segment predicted: PIX_READY → 6 leads upgraded',
      'Deposit probability >80%: 22 leads flagged',
      'Feature extraction: phone_activity weight increased',
      'Inference latency: avg 42ms (within threshold)',
    ],
  },
];

// ─── Log console ──────────────────────────────────────────────────────────────

function LogConsole({ agentId, seed, running }: { agentId: string; seed: string[]; running: boolean }) {
  const [lines, setLines] = useState<{ text: string; ts: string }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!running) return;
    let idx = 0;
    const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false });
    // Initial burst
    setLines(seed.slice(0, 3).map((t, i) => ({ text: t, ts: now() })));
    idx = 3;
    const t = setInterval(() => {
      const text = seed[idx % seed.length];
      setLines((l) => [...l.slice(-19), { text, ts: now() }]);
      idx++;
    }, 2200 + Math.random() * 1800);
    return () => clearInterval(t);
  }, [running, agentId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  return (
    <div
      className="rounded-lg p-3 font-mono text-[10px] h-28 overflow-y-auto space-y-0.5"
      style={{ background: '#05050f', border: '1px solid #1a1a35' }}
    >
      {lines.length === 0 ? (
        <span style={{ color: '#334155' }}>— agent stopped —</span>
      ) : (
        lines.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0" style={{ color: '#334155' }}>{l.ts}</span>
            <span style={{ color: '#94a3b8' }}>{l.text}</span>
          </div>
        ))
      )}
      <div ref={endRef} />
    </div>
  );
}

// ─── Automation Agent Card ────────────────────────────────────────────────────

function AutoAgentCard({ agent }: { agent: AutoAgent }) {
  const [status, setStatus] = useState<AgentStatus>(
    agent.id === 'gamba_sync' ? 'stopped' : 'running'
  );
  const [logOpen, setLogOpen] = useState(false);

  const handleStart = () => {
    setStatus('loading');
    setTimeout(() => setStatus('running'), 1400);
  };
  const handleStop = () => {
    setStatus('loading');
    setTimeout(() => setStatus('stopped'), 900);
  };
  const handleRestart = () => {
    setStatus('loading');
    setTimeout(() => setStatus('running'), 1800);
  };
  const handleSync = () => {
    setStatus('syncing');
    setTimeout(() => setStatus('running'), 2500);
  };

  const isRunning = status === 'running' || status === 'syncing';
  const isLoading = status === 'loading' || status === 'syncing';

  const statusLabel: Record<AgentStatus, string> = {
    running: 'Running',
    stopped: 'Stopped',
    loading: 'Starting…',
    error:   'Error',
    syncing: 'Syncing…',
  };
  const statusColor: Record<AgentStatus, string> = {
    running: '#10b981',
    stopped: '#475569',
    loading: '#f59e0b',
    error:   '#ef4444',
    syncing: '#06b6d4',
  };

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 transition-all"
      style={{
        background: '#0d0d22',
        border: `1px solid ${isRunning ? agent.color + '44' : '#1a1a35'}`,
        boxShadow: isRunning ? `0 0 20px ${agent.color}0d` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ background: agent.color + '22', color: agent.color, border: `1px solid ${agent.color}44` }}
          >
            <agent.icon size={18} />
          </div>
          <div>
            <div className="font-bold text-white text-[13px] leading-tight">{agent.name}</div>
            <div className="text-[10px]" style={{ color: '#475569' }}>{agent.description}</div>
          </div>
        </div>

        {/* Status badge */}
        <div
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
          style={{ background: statusColor[status] + '18', color: statusColor[status], border: `1px solid ${statusColor[status]}33` }}
        >
          {isLoading
            ? <Loader2 size={10} className="animate-spin" />
            : <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'animate-pulse' : ''}`} style={{ background: statusColor[status] }} />
          }
          {statusLabel[status]}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        {agent.metrics.map((m) => (
          <div key={m.label} className="rounded-lg p-2.5 text-center" style={{ background: '#05050f', border: '1px solid #1a1a3566' }}>
            <div className="text-[13px] font-black" style={{ color: isRunning ? agent.color : '#475569' }}>{m.value}</div>
            <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#334155' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {status === 'stopped' || status === 'error' ? (
          <button
            onClick={handleStart}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50"
            style={{ background: agent.color, color: '#fff', boxShadow: `0 0 14px ${agent.color}55` }}
          >
            <Play size={13} />
            Launch Agent
          </button>
        ) : (
          <button
            onClick={handleStop}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50"
            style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#f87171' }}
          >
            <Square size={12} />
            Stop
          </button>
        )}

        <button
          onClick={handleRestart}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50"
          style={{ background: '#1a1a35', border: '1px solid #1a1a35', color: '#64748b' }}
        >
          <RotateCcw size={12} className={isLoading ? 'animate-spin' : ''} />
          Restart
        </button>

        {agent.id === 'gamba_sync' && (
          <button
            onClick={handleSync}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50"
            style={{ background: '#f9731622', border: '1px solid #f9731644', color: '#f97316' }}
          >
            <RefreshCw size={12} className={status === 'syncing' ? 'animate-spin' : ''} />
            Force Sync
          </button>
        )}

        {/* Log toggle */}
        <button
          onClick={() => setLogOpen((o) => !o)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all"
          style={{ background: '#1a1a35', color: '#475569' }}
        >
          <Terminal size={11} />
          Logs
          <ChevronRight size={10} className={`transition-transform ${logOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Log console */}
      {logOpen && <LogConsole agentId={agent.id} seed={agent.logSeed} running={isRunning} />}
    </div>
  );
}

// ─── Human agent row ──────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="text-center min-w-[44px]">
      <div className="text-[15px] font-black" style={{ color }}>{value}</div>
      <div className="text-[9px] font-mono uppercase tracking-wider" style={{ color: '#334155' }}>{label}</div>
    </div>
  );
}

function ReassignDropdown({ currentAgent }: { currentAgent: string }) {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all"
        style={{ background: '#6366f122', border: '1px solid #6366f144', color: '#818cf8' }}
      >
        <RefreshCw size={11} />
        {selected ?? 'Reassign'}
        <ChevronDown size={10} />
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
              onClick={() => { setSelected(a); setOpen(false); }}
            >
              {a}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Chart tooltip ────────────────────────────────────────────────────────────

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

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentControlsView() {
  const [activeStates, setActiveStates] = useState<Record<string, boolean>>(
    () => Object.fromEntries(AGENTS.map((a) => [a, a !== 'Unassigned']))
  );
  const toggleAgent = (name: string) => setActiveStates((s) => ({ ...s, [name]: !s[name] }));

  const activeCount = Object.entries(activeStates).filter(([k, v]) => v && k !== 'Unassigned').length;
  const avgConv = (agentStats.filter(a => a.name !== 'Unassigned').reduce((s, a) => s + parseFloat(a.convRate), 0) / (AGENTS.length - 1)).toFixed(1);

  const barData = agentStats.map((a) => ({
    name: a.name.split(' ')[0],
    Total: a.total,
    color: a.color,
  }));

  return (
    <div className="p-6 space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Human Agents',  value: AGENTS.length - 1,      icon: Users,         color: '#6366f1' },
          { label: 'Active Now',    value: activeCount,             icon: CheckCircle2,  color: '#10b981' },
          { label: 'Total Leads',   value: MOCK_LEADS.length,       icon: Zap,           color: '#8b5cf6' },
          { label: 'Avg Conv Rate', value: `${avgConv}%`,           icon: TrendingUp,    color: '#f97316' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: k.color + '22', color: k.color }}>
              <k.icon size={17} />
            </div>
            <div className="text-3xl font-black text-white leading-none mb-1">{k.value}</div>
            <div className="text-[11px]" style={{ color: '#64748b' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Automation Agents ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot size={13} style={{ color: '#6366f1' }} />
          <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>
            Automation Agents
          </div>
          <div className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#10b98122', color: '#10b981' }}>
            3 / 4 running
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {AUTO_AGENTS.map((agent) => (
            <AutoAgentCard key={agent.id} agent={agent} />
          ))}
        </div>
      </div>

      {/* ── Human Agent Roster ── */}
      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Users size={13} style={{ color: '#6366f1' }} />
            <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>Human Agent Roster</div>
          </div>
          <div className="space-y-2.5">
            {agentStats.map((agent) => {
              const isActive = activeStates[agent.name] ?? false;
              return (
                <div
                  key={agent.name}
                  className="rounded-xl p-4 transition-all"
                  style={{
                    background: '#0d0d22',
                    border: `1px solid ${isActive ? '#1a1a35' : '#1a1a3555'}`,
                    opacity: isActive ? 1 : 0.5,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-[12px] font-black shrink-0"
                      style={{ background: agent.color + '22', color: agent.color, border: `1px solid ${agent.color}44` }}
                    >
                      {agent.name.slice(0, 2).toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-white text-[13px]">{agent.name}</div>
                      <div className="text-[10px] font-mono flex items-center gap-2" style={{ color: '#475569' }}>
                        Account Manager · {agent.total} leads
                        {agent.topMeta && (
                          <span>· Top: <span style={{ color: agent.topMeta.color }}>{agent.topMeta.icon} {agent.topMeta.label}</span></span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-5">
                      <StatPill value={agent.hot}               label="Hot"      color="#f97316" />
                      <StatPill value={agent.verified}          label="Verified" color="#10b981" />
                      <StatPill value={agent.failed}            label="Failed"   color="#ef4444" />
                      <StatPill value={agent.convRate + '%'}    label="Conv"     color="#8b5cf6" />
                    </div>

                    {/* Toggle */}
                    <button
                      onClick={() => toggleAgent(agent.name)}
                      className="relative w-10 h-5 rounded-full transition-all shrink-0"
                      style={{ background: isActive ? '#10b981' : '#1a1a35' }}
                    >
                      <div
                        className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all"
                        style={{ left: isActive ? '20px' : '2px' }}
                      />
                    </button>

                    <ReassignDropdown currentAgent={agent.name} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Bar chart */}
          <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
              Lead Distribution
            </div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData} layout="vertical" barSize={9}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" horizontal={false} />
                <XAxis type="number" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} width={52} />
                <Tooltip content={<ChartTip />} />
                <Bar dataKey="Total" radius={[0, 4, 4, 0]} name="Total">
                  {barData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Connectivity status */}
          <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
              Integrations
            </div>
            <div className="space-y-3">
              {[
                { label: 'GAMBA CRM API',   ok: true,  ping: '42ms' },
                { label: 'WhatsApp Cloud',  ok: true,  ping: '88ms' },
                { label: 'SMTP Relay',      ok: true,  ping: '31ms' },
                { label: 'AI Scoring API',  ok: true,  ping: '67ms' },
                { label: 'Webhook Bus',     ok: false, ping: '—' },
              ].map((s) => (
                <div key={s.label} className="flex items-center justify-between text-[11px]">
                  <div className="flex items-center gap-2">
                    {s.ok
                      ? <Wifi size={12} style={{ color: '#10b981' }} />
                      : <WifiOff size={12} style={{ color: '#ef4444' }} />
                    }
                    <span style={{ color: '#64748b' }}>{s.label}</span>
                  </div>
                  <span className="font-mono font-bold" style={{ color: s.ok ? '#10b981' : '#ef4444' }}>
                    {s.ok ? s.ping : 'offline'}
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
