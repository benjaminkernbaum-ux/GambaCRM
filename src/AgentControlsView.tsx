import React, { useState, useEffect, useRef } from 'react';
import {
  PieChart, Pie, Cell as PieCell, Tooltip as ReTooltip, ResponsiveContainer,
} from 'recharts';
import {
  Bot, TrendingUp, CheckCircle2, Zap, RefreshCw,
  Play, Square, RotateCcw, MessageCircle,
  Mail, Database, Brain, Terminal, Wifi, WifiOff, Loader2,
  ChevronRight, User, Flame, AlertTriangle,
} from 'lucide-react';
import { MOCK_LEADS, SEG_META } from './types';
import { api, AgentProcess } from './api';

// ─── Benjamin's stats (all leads = single agent) ──────────────────────────────

const myLeads   = MOCK_LEADS; // all leads belong to Benjamin
const myHot     = myLeads.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length;
const myVerified= myLeads.filter((l) => l.segment === 'DOCS_VERIFIED').length;
const myFailed  = myLeads.filter((l) => l.segment === 'FAILED_DEPOSIT').length;
const myWA      = myLeads.filter((l) => l.segment === 'SKIP_ACTIVE').length;
const myConv    = ((myVerified / myLeads.length) * 100).toFixed(1);

// Segment pie data (top 6)
const segPieData = SEG_META.slice(0, 6).map((s) => ({
  name: s.label,
  value: myLeads.filter((l) => l.segment === s.key).length,
  color: s.color,
})).filter((d) => d.value > 0).sort((a, b) => b.value - a.value);

// ─── Automation agent definitions ─────────────────────────────────────────────
// IDs MUST match dashboard_server.py agent keys exactly

interface AutoAgent {
  id:          'crm_sync' | 'whatsapp_sync' | 'wa_reply' | 'lead_ai';
  name:        string;
  description: string;
  script:      string;
  icon:        React.ElementType;
  color:       string;
  metrics:     { label: string; value: string | number }[];
  logSeed:     string[];
}

const AUTO_AGENTS: AutoAgent[] = [
  {
    id:          'crm_sync',
    name:        'CRM Email Sync',
    description: 'live_crm_email_sync.py · bi-directional CRM ↔ email sync',
    script:      'live_crm_email_sync.py',
    icon:        Mail,
    color:       '#6366f1',
    metrics: [
      { label: 'Synced',   value: 719 },
      { label: 'Queued',   value: 94  },
      { label: 'Sent/hr',  value: 67  },
      { label: 'Open %',   value: '34%' },
    ],
    logSeed: [
      'Campaign "Welcome Series" dispatched × 47',
      'Drip sequence: step 3 sent to 18 leads',
      'CRM token refresh: OK (expires in 47m)',
      'Bounce flagged → marcos7@yahoo.com.br',
      'A/B test variant B selected (62% open rate)',
      'Retry queue flushed: 6 soft-bounce re-attempts',
      'New campaign scheduled: "Docs Verification" 14:00',
      'SMTP connection pool: 4/5 healthy',
      'Segment push: DOCS_VERIFIED × 128 → CRM updated',
    ],
  },
  {
    id:          'whatsapp_sync',
    name:        'WhatsApp Sync',
    description: 'live_crm_whatsapp_sync.py · WA bridge ↔ CRM segment push',
    script:      'live_crm_whatsapp_sync.py',
    icon:        MessageCircle,
    color:       '#25d366',
    metrics: [
      { label: 'Queue',    value: 38  },
      { label: 'Sent/hr',  value: 124 },
      { label: 'Read %',   value: '87%' },
      { label: 'Reply %',  value: '34%' },
    ],
    logSeed: [
      'Welcome sequence sent → Carlos Silva (#540001)',
      'PIX reminder dispatched → Ana Souza (#540002)',
      'High-intent follow-up → Pedro Lima (#540009)',
      'Auto-reply triggered: "Docs required"',
      'Batch sent: 12 cooldown leads re-engaged',
      'Template PIX_PAYMENT_NUDGE delivered × 23',
      'Webhook: message_read from #540041',
      'Sequence step 2 queued for 8 leads',
      'Node.js WA bridge probe :3000 → OK',
    ],
  },
  {
    id:          'wa_reply',
    name:        'WA Reply Agent',
    description: 'wa_reply_agent.py · AI-powered auto-reply to inbound WA messages',
    script:      'wa_reply_agent.py',
    icon:        Brain,
    color:       '#8b5cf6',
    metrics: [
      { label: 'Replied',  value: 43  },
      { label: 'Pending',  value: 7   },
      { label: 'Acc %',    value: '91%' },
      { label: 'Model',    value: 'GPT-4' },
    ],
    logSeed: [
      'Inbound: "Preciso enviar o PIX como faço?" → classifying…',
      'Intent: DEPOSIT_HELP — reply drafted & sent',
      'Inbound: "Meus docs foram aprovados?" → DOCS_QUERY',
      'CRM lookup: #540019 → DOCS_UNDER_REVIEW → replied',
      'Escalation flag raised → assigning to Rafael',
      'Batch processed: 12 new messages',
      'Gemini call: 42ms latency (within threshold)',
      'Conversation closed: satisfied_resolution #540044',
      'Model context refreshed: 14 new training samples',
    ],
  },
  {
    id:          'lead_ai',
    name:        'Lead Scoring AI',
    description: 'ML segment prediction · deposit probability · priority ranking',
    script:      'lead_scoring_ai.py',
    icon:        Database,
    color:       '#f97316',
    metrics: [
      { label: 'Scored',    value: 719 },
      { label: 'Hot flags', value: 43  },
      { label: 'Accuracy',  value: '91%' },
      { label: 'Model',     value: 'v2.4' },
    ],
    logSeed: [
      'Batch scoring complete: 719 leads processed',
      'High-intent flag → Lucas Ferreira (#540019)',
      'Risk alert: stop-out 87% → Ricardo Gomes',
      'Model retrain: 14 new labeled samples ingested',
      'PIX_READY prediction: 6 leads upgraded',
      'Deposit probability >80%: 22 leads flagged',
      'Feature extraction: phone_activity weight +12%',
      'Inference latency: avg 42ms (within threshold)',
    ],
  },
];

// ─── Log console ──────────────────────────────────────────────────────────────

function LogConsole({
  agentId, seed, running, liveLog,
}: {
  agentId: string; seed: string[]; running: boolean; liveLog?: string;
}) {
  const [lines, setLines] = useState<{ text: string; ts: string }[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  const now = () => new Date().toLocaleTimeString('en-GB', { hour12: false });

  useEffect(() => {
    setLines([]);
    if (!running) return;
    setLines(seed.slice(0, 3).map((t) => ({ text: t, ts: now() })));
    let idx = 3;
    const t = setInterval(() => {
      const text = seed[idx % seed.length];
      setLines((l) => [...l.slice(-24), { text, ts: now() }]);
      idx++;
    }, 2000 + Math.random() * 1500);
    return () => clearInterval(t);
  }, [running, agentId]);

  // Append live log from backend when available
  useEffect(() => {
    if (liveLog) setLines((l) => [...l.slice(-24), { text: liveLog, ts: now() }]);
  }, [liveLog]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [lines]);

  return (
    <div
      className="rounded-lg p-3 h-28 overflow-y-auto space-y-0.5"
      style={{ background: '#02040a', border: '1px solid var(--border)', fontFamily: 'JetBrains Mono, monospace', fontSize: 10 }}
    >
      {lines.length === 0
        ? <span style={{ color: '#334155' }}>— agent stopped —</span>
        : lines.map((l, i) => (
          <div key={i} className="flex gap-2">
            <span className="shrink-0" style={{ color: '#334155' }}>{l.ts}</span>
            <span style={{ color: '#94a3b8' }}>{l.text}</span>
          </div>
        ))
      }
      <div ref={endRef} />
    </div>
  );
}

// ─── Automation Agent Card ────────────────────────────────────────────────────

type LocalStatus = 'running' | 'stopped' | 'loading' | 'error';

function AutoAgentCard({
  agent, backendStatus, onToast,
}: {
  agent: AutoAgent;
  backendStatus: AgentProcess | null;
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}) {
  // Determine initial state from backend if available
  const initialStatus: LocalStatus =
    backendStatus !== null
      ? (backendStatus.running ? 'running' : 'stopped')
      : (agent.id === 'wa_reply' ? 'stopped' : 'running');

  const [status, setStatus] = useState<LocalStatus>(initialStatus);
  const [logOpen, setLogOpen] = useState(false);

  // Sync from backend polling
  useEffect(() => {
    if (backendStatus === null) return;
    setStatus(backendStatus.running ? 'running' : 'stopped');
  }, [backendStatus?.running]);

  const isRunning = status === 'running';
  const isLoading = status === 'loading';

  const handleStart = async () => {
    setStatus('loading');
    const res = await api.start(agent.id);
    if (res?.ok || res === null) {
      // null = backend offline, optimistic update
      setStatus('running');
      onToast('success', `${agent.name} started${res === null ? ' (offline mode)' : ''}`);
    } else {
      setStatus('error');
      onToast('error', `Failed to start ${agent.name}`);
    }
  };

  const handleStop = async () => {
    setStatus('loading');
    const res = await api.stop(agent.id);
    if (res?.ok || res === null) {
      setStatus('stopped');
      onToast('info', `${agent.name} stopped`);
    } else {
      setStatus('running');
      onToast('error', `Failed to stop ${agent.name}`);
    }
  };

  const handleRestart = async () => {
    setStatus('loading');
    onToast('info', `Restarting ${agent.name}…`);
    const res = await api.restart(agent.id);
    if (res?.ok || res === null) {
      setStatus('running');
      onToast('success', `${agent.name} restarted`);
    } else {
      setStatus('error');
      onToast('error', `Failed to restart ${agent.name}`);
    }
  };

  const statusLabel: Record<LocalStatus, string> = {
    running: 'Running',
    stopped: 'Stopped',
    loading: 'Loading…',
    error:   'Error',
  };
  const statusColor: Record<LocalStatus, string> = {
    running: '#10b981',
    stopped: '#475569',
    loading: '#f59e0b',
    error:   '#ef4444',
  };

  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-4 transition-all"
      style={{
        background: 'var(--card)',
        border: `1px solid ${isRunning ? agent.color + '44' : 'var(--border)'}`,
        boxShadow: isRunning ? `0 0 22px ${agent.color}0e` : 'none',
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
            <div className="text-[10px]" style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
              {agent.script}
            </div>
            <div className="text-[10px]" style={{ color: '#334155' }}>{agent.description}</div>
          </div>
        </div>

        {/* Status + uptime */}
        <div className="flex flex-col items-end gap-1">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold"
            style={{
              background: statusColor[status] + '18',
              color: statusColor[status],
              border: `1px solid ${statusColor[status]}33`,
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            {isLoading
              ? <Loader2 size={10} className="animate-spin" />
              : <div className={`w-1.5 h-1.5 rounded-full ${isRunning ? 'animate-pulse' : ''}`} style={{ background: statusColor[status] }} />
            }
            {statusLabel[status]}
          </div>
          {backendStatus?.uptime && (
            <div className="text-[9px]" style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
              ↑ {backendStatus.uptime}
            </div>
          )}
          {backendStatus?.pid && (
            <div className="text-[9px]" style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
              PID {backendStatus.pid}
            </div>
          )}
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-2">
        {agent.metrics.map((m) => (
          <div
            key={m.label}
            className="rounded-lg p-2.5 text-center"
            style={{ background: '#02040a', border: '1px solid var(--border)' }}
          >
            <div
              className="text-[14px] font-bold"
              style={{ color: isRunning ? agent.color : '#475569', fontFamily: 'JetBrains Mono, monospace' }}
            >
              {m.value}
            </div>
            <div className="text-[9px] uppercase tracking-wider" style={{ color: '#334155' }}>{m.label}</div>
          </div>
        ))}
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* ▶ Start / ■ Stop */}
        {!isRunning ? (
          <button
            id={`btn-start-${agent.id}`}
            onClick={handleStart}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50"
            style={{ background: agent.color, color: '#fff', boxShadow: `0 0 14px ${agent.color}55` }}
          >
            <Play size={12} />
            Start {agent.name.split(' ')[0]}
          </button>
        ) : (
          <button
            id={`btn-stop-${agent.id}`}
            onClick={handleStop}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-bold transition-all disabled:opacity-50"
            style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#f87171' }}
          >
            <Square size={11} />
            Stop
          </button>
        )}

        {/* ↺ Restart */}
        <button
          id={`btn-restart-${agent.id}`}
          onClick={handleRestart}
          disabled={isLoading}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50"
          style={{ background: 'var(--border)', color: '#64748b' }}
        >
          <RotateCcw size={11} className={isLoading ? 'animate-spin' : ''} />
          Restart
        </button>

        {/* Force Sync for crm_sync */}
        {agent.id === 'crm_sync' && (
          <button
            onClick={handleRestart}
            disabled={isLoading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-[12px] font-semibold transition-all disabled:opacity-50"
            style={{ background: '#6366f122', border: '1px solid #6366f144', color: '#818cf8' }}
          >
            <RefreshCw size={11} className={isLoading ? 'animate-spin' : ''} />
            Force Sync
          </button>
        )}

        {/* Logs toggle */}
        <button
          onClick={() => setLogOpen((o) => !o)}
          className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold transition-all"
          style={{ background: 'var(--border)', color: '#475569' }}
        >
          <Terminal size={11} />
          Logs
          <ChevronRight size={10} className={`transition-transform ${logOpen ? 'rotate-90' : ''}`} />
        </button>
      </div>

      {/* Log console */}
      {logOpen && (
        <LogConsole
          agentId={agent.id}
          seed={agent.logSeed}
          running={isRunning}
          liveLog={backendStatus?.lastLog}
        />
      )}
    </div>
  );
}

// ─── Stat pill ────────────────────────────────────────────────────────────────

function StatPill({ value, label, color }: { value: string | number; label: string; color: string }) {
  return (
    <div className="rounded-xl p-4 text-center" style={{ background: '#02040a', border: '1px solid var(--border)' }}>
      <div className="text-2xl font-bold mb-0.5" style={{ color, fontFamily: 'JetBrains Mono, monospace' }}>{value}</div>
      <div className="text-[10px] uppercase tracking-wider" style={{ color: '#334155' }}>{label}</div>
    </div>
  );
}

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.payload.color }}>{p.name}: <span className="font-bold">{p.value}</span></div>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AgentControlsView({
  onToast,
}: {
  onToast: (type: 'success' | 'error' | 'info', msg: string) => void;
}) {
  const [backendAgents, setBackendAgents] = useState<Record<string, AgentProcess> | null>(null);

  useEffect(() => {
    const poll = async () => {
      const res = await api.agents();
      if (res) setBackendAgents(res);
    };
    poll();
    const t = setInterval(poll, 5000);
    return () => clearInterval(t);
  }, []);

  const runningAutoCount = backendAgents
    ? AUTO_AGENTS.filter(a => backendAgents[a.id]?.running).length
    : AUTO_AGENTS.filter(a => a.id !== 'wa_reply').length;

  return (
    <div className="p-6 space-y-6">

      {/* ── Benjamin's Stats ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Profile card */}
        <div className="rounded-xl p-6 flex items-center gap-5" style={{ background: 'var(--card)', border: '1px solid #6366f144', boxShadow: '0 0 24px #6366f10d' }}>
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center text-xl font-black shrink-0"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: '#fff' }}
          >
            BE
          </div>
          <div>
            <div className="text-white font-bold text-lg leading-tight">Benjamin</div>
            <div className="text-[11px] mb-2" style={{ color: '#475569' }}>Account Manager · FXGLOBE</div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
              <span className="text-[11px] font-semibold" style={{ color: '#10b981' }}>Online</span>
            </div>
          </div>
        </div>

        {/* KPI grid */}
        <div className="col-span-2 grid grid-cols-5 gap-3">
          <StatPill value={myLeads.length}    label="Total Leads"  color="#6366f1" />
          <StatPill value={myHot}             label="Hot Leads"    color="#f97316" />
          <StatPill value={myVerified}        label="Verified"     color="#10b981" />
          <StatPill value={myFailed}          label="Failed Dep."  color="#ef4444" />
          <StatPill value={`${myConv}%`}      label="Conv. Rate"   color="#8b5cf6" />
        </div>
      </div>

      {/* ── Automation Agents ── */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bot size={13} style={{ color: '#6366f1' }} />
          <div className="text-[11px] tracking-widest uppercase" style={{ color: '#6366f1', fontFamily: 'JetBrains Mono, monospace' }}>
            Automation Agents
          </div>
          <div className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#10b98122', color: '#10b981', fontFamily: 'JetBrains Mono, monospace' }}>
            {runningAutoCount} / {AUTO_AGENTS.length} running
          </div>
          {backendAgents && (
            <div className="ml-2 px-2 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#6366f122', color: '#818cf8', fontFamily: 'JetBrains Mono, monospace' }}>
              ● Backend Connected
            </div>
          )}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {AUTO_AGENTS.map((agent) => (
            <AutoAgentCard
              key={agent.id}
              agent={agent}
              backendStatus={backendAgents?.[agent.id] ?? null}
              onToast={onToast}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom row: Segment breakdown + Integrations ── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Segment pie */}
        <div className="rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] tracking-widest uppercase mb-4" style={{ color: '#6366f1', fontFamily: 'JetBrains Mono, monospace' }}>
            My Top Segments
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={segPieData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3}>
                {segPieData.map((d, i) => <PieCell key={i} fill={d.color} />)}
              </Pie>
              <ReTooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {segPieData.slice(0, 4).map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[10px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span style={{ color: '#64748b' }}>{d.name}</span>
                </div>
                <span className="font-bold" style={{ color: d.color, fontFamily: 'JetBrains Mono, monospace' }}>{d.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Integrations */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: 'var(--card)', border: '1px solid var(--border)' }}>
          <div className="text-[11px] tracking-widest uppercase mb-4" style={{ color: '#6366f1', fontFamily: 'JetBrains Mono, monospace' }}>
            Integrations
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'GAMBA CRM API',   ok: true,                   ping: '42ms'  },
              { label: 'WhatsApp Cloud',  ok: true,                   ping: '88ms'  },
              { label: 'SMTP Relay',      ok: true,                   ping: '31ms'  },
              { label: 'AI / Gemini',     ok: true,                   ping: '67ms'  },
              { label: 'Node WA Bridge',  ok: backendAgents !== null, ping: backendAgents ? 'OK' : 'offline' },
              { label: 'Python Backend',  ok: backendAgents !== null, ping: backendAgents ? 'OK' : 'offline' },
            ].map((s) => (
              <div
                key={s.label}
                className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: '#02040a', border: `1px solid ${s.ok ? '#10b98122' : '#ef444422'}` }}
              >
                <div className="flex items-center gap-2">
                  {s.ok ? <Wifi size={12} style={{ color: '#10b981' }} /> : <WifiOff size={12} style={{ color: '#ef4444' }} />}
                  <span className="text-[11px]" style={{ color: '#64748b' }}>{s.label}</span>
                </div>
                <span className="text-[11px] font-bold" style={{ color: s.ok ? '#10b981' : '#ef4444', fontFamily: 'JetBrains Mono, monospace' }}>
                  {s.ok ? s.ping : 'offline'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
