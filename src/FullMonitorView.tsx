import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  Activity, Cpu, Server, Wifi, AlertTriangle,
  CheckCircle2, MessageCircle, Mail, Users, Zap, Bot,
} from 'lucide-react';
import { MOCK_LEADS, SEG_META, AGENTS } from './types';

// ─── Derived data ─────────────────────────────────────────────────────────────

const total = MOCK_LEADS.length;
const hot   = MOCK_LEADS.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length;
const wa    = MOCK_LEADS.filter((l) => l.channel === 'wa').length;
const email = MOCK_LEADS.filter((l) => l.channel === 'email').length;
const waActive = MOCK_LEADS.filter((l) => l.segment === 'SKIP_ACTIVE').length;

// Simulated system metrics (refreshed every 3s)
function genMetrics() {
  return {
    cpu:     Math.floor(18 + Math.random() * 30),
    mem:     Math.floor(42 + Math.random() * 20),
    api:     Math.floor(90 + Math.random() * 10),
    latency: Math.floor(60 + Math.random() * 80),
  };
}

// Simulated event feed
const ALL_EVENTS = MOCK_LEADS.slice(0, 40).map((l) => {
  const meta = SEG_META.find((s) => s.key === l.segment)!;
  const types = ['Lead moved to', 'Status updated:', 'Message sent to', 'Doc reviewed for', 'Deposit attempt by'];
  const type = types[parseInt(l.id) % types.length];
  return { id: l.id, name: l.name, type, label: meta.label, icon: meta.icon, color: meta.color, time: l.updatedAt, channel: l.channel };
});

// System services
const SERVICES = [
  { name: 'WhatsApp Bot',       status: 'online',   uptime: '99.97%', requests: 1842, color: '#25d366' },
  { name: 'Email Agent',        status: 'online',   uptime: '99.91%', requests: 1134, color: '#6366f1' },
  { name: 'CRM Sync Worker',    status: 'degraded', uptime: '98.40%', requests: 567,  color: '#f59e0b' },
  { name: 'Lead Scoring AI',    status: 'online',   uptime: '99.99%', requests: 2210, color: '#10b981' },
  { name: 'Notification Bus',   status: 'online',   uptime: '99.95%', requests: 893,  color: '#8b5cf6' },
  { name: 'Document OCR',       status: 'online',   uptime: '99.88%', requests: 445,  color: '#06b6d4' },
  { name: 'Deposit Monitor',    status: 'online',   uptime: '100%',   requests: 321,  color: '#f97316' },
  { name: 'Analytics Ingestor', status: 'offline',  uptime: '94.10%', requests: 0,    color: '#ef4444' },
];

// Chart data
const throughputData = Array.from({ length: 20 }, (_, i) => ({
  t: i,
  WA:    Math.floor(12 + Math.sin(i * 0.7) * 8 + Math.random() * 10),
  Email: Math.floor(8  + Math.cos(i * 0.5) * 5 + Math.random() * 8),
}));

// ─── Tooltip ──────────────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.stroke ?? '#94a3b8' }}>{p.name}: <span className="font-bold">{p.value}</span></div>
      ))}
    </div>
  );
}

// ─── Metric Gauge ─────────────────────────────────────────────────────────────

function MetricGauge({ label, value, unit, color, icon: Icon }: {
  label: string; value: number; unit: string; color: string; icon: React.ElementType;
}) {
  const pct = Math.min(value, 100);
  return (
    <div className="rounded-xl p-4" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon size={13} style={{ color }} />
          <span className="text-[10px] font-mono" style={{ color: '#475569' }}>{label}</span>
        </div>
        <span className="text-[10px] font-mono" style={{ color }}>{value}{unit}</span>
      </div>
      {/* Circular-ish progress via conic */}
      <div className="relative w-14 h-14 mx-auto mb-2">
        <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
          <circle cx="18" cy="18" r="14" fill="none" stroke="#1a1a35" strokeWidth="3" />
          <circle
            cx="18" cy="18" r="14" fill="none"
            stroke={color} strokeWidth="3"
            strokeDasharray={`${pct * 0.88} 88`}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-[11px] font-black" style={{ color }}>{value}</span>
        </div>
      </div>
      <div className="text-center text-[9px] font-mono" style={{ color: '#334155' }}>{unit}</div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function FullMonitorView() {
  const [metrics, setMetrics] = useState(genMetrics);
  const [events, setEvents] = useState(ALL_EVENTS.slice(0, 15));
  const [eventIdx, setEventIdx] = useState(15);

  useEffect(() => {
    const t = setInterval(() => {
      setMetrics(genMetrics());
      // Push new event into feed
      setEventIdx((i) => {
        const next = i % ALL_EVENTS.length;
        setEvents((ev) => [ALL_EVENTS[next], ...ev.slice(0, 14)]);
        return next + 1;
      });
    }, 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 space-y-5">

      {/* Top row — KPIs + system metrics */}
      <div className="grid grid-cols-8 gap-3">
        {/* KPI cards */}
        {[
          { label: 'Total Leads',    value: total,    color: '#6366f1', icon: Users },
          { label: 'Hot Leads',      value: hot,      color: '#f97316', icon: Zap },
          { label: 'Active WA',      value: waActive, color: '#25d366', icon: MessageCircle },
          { label: 'Email Leads',    value: email,    color: '#818cf8', icon: Mail },
        ].map((k) => (
          <div key={k.label} className="col-span-1 rounded-xl p-4" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2" style={{ background: k.color + '22', color: k.color }}>
              <k.icon size={13} />
            </div>
            <div className="text-2xl font-black text-white leading-none mb-0.5">{k.value}</div>
            <div className="text-[10px]" style={{ color: '#475569' }}>{k.label}</div>
          </div>
        ))}
        {/* System metrics */}
        <MetricGauge label="CPU"     value={metrics.cpu}     unit="%" color="#6366f1" icon={Cpu} />
        <MetricGauge label="Memory"  value={metrics.mem}     unit="%" color="#8b5cf6" icon={Server} />
        <MetricGauge label="API"     value={metrics.api}     unit="%" color="#10b981" icon={Wifi} />
        <MetricGauge label="Latency" value={metrics.latency} unit="ms" color="#f59e0b" icon={Activity} />
      </div>

      {/* Mid row — throughput chart + services */}
      <div className="grid grid-cols-3 gap-4">

        {/* Throughput chart */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-4">
            <Activity size={13} style={{ color: '#6366f1' }} />
            <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>
              Live Throughput
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse ml-1" style={{ background: '#10b981' }} />
            <div className="ml-auto flex items-center gap-4 text-[10px] font-mono">
              <span style={{ color: '#25d366' }}>● WA</span>
              <span style={{ color: '#6366f1' }}>● Email</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={throughputData}>
              <defs>
                <linearGradient id="tpGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#25d366" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#25d366" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="tpGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="t" hide />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="WA"    stroke="#25d366" fill="url(#tpGrad1)" strokeWidth={2} />
              <Area type="monotone" dataKey="Email" stroke="#6366f1" fill="url(#tpGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Services */}
        <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="px-4 py-3 text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1', borderBottom: '1px solid #1a1a35' }}>
            Services
          </div>
          <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
            {SERVICES.map((s) => (
              <div key={s.name} className="flex items-center gap-3 px-4 py-2.5">
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{
                    background: s.status === 'online' ? '#10b981' : s.status === 'degraded' ? '#f59e0b' : '#ef4444',
                    boxShadow: s.status === 'online' ? '0 0 6px #10b981' : 'none',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-medium text-white truncate">{s.name}</div>
                  <div className="text-[9px] font-mono" style={{ color: '#334155' }}>{s.uptime} uptime</div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-[11px] font-mono text-white">{s.requests.toLocaleString()}</div>
                  <div className="text-[9px]" style={{ color: s.color }}>{s.status}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom row — Agent status + live event feed */}
      <div className="grid grid-cols-3 gap-4">

        {/* Agent status grid */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-4">
            <Bot size={13} style={{ color: '#6366f1' }} />
            <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>Agents Online</div>
          </div>
          <div className="space-y-3">
            {AGENTS.filter(a => a !== 'Unassigned').map((agent, i) => {
              const leads = MOCK_LEADS.filter((l) => l.assignedTo === agent).length;
              const colors = ['#6366f1', '#8b5cf6', '#06b6d4', '#10b981', '#f97316'];
              const color = colors[i % colors.length];
              return (
                <div key={agent} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
                    style={{ background: color + '22', color, border: `1px solid ${color}44` }}
                  >
                    {agent.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[12px] font-semibold text-white">{agent}</div>
                    <div className="h-1.5 rounded-full mt-1 overflow-hidden" style={{ background: '#1a1a35' }}>
                      <div className="h-full rounded-full" style={{ width: `${(leads / total) * 100 * 3}%`, background: color, maxWidth: '100%' }} />
                    </div>
                  </div>
                  <span className="text-[11px] font-mono font-bold shrink-0" style={{ color }}>{leads}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Live event feed */}
        <div className="col-span-2 rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1a1a35' }}>
            <Activity size={13} style={{ color: '#6366f1' }} />
            <div className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>
              Event Stream
            </div>
            <div className="w-2 h-2 rounded-full animate-pulse ml-1" style={{ background: '#10b981' }} />
            <span className="ml-auto text-[10px] font-mono" style={{ color: '#334155' }}>Live</span>
          </div>
          <div className="divide-y overflow-hidden" style={{ borderColor: '#1a1a3522' } as any}>
            {events.map((ev, i) => (
              <div
                key={`${ev.id}-${i}`}
                className="flex items-center gap-3 px-4 py-2.5 transition-all"
                style={{
                  background: i === 0 ? ev.color + '0a' : 'transparent',
                  borderBottom: '1px solid #1a1a3522',
                  opacity: 1 - i * 0.055,
                }}
              >
                <span className="text-base shrink-0">{ev.icon}</span>
                <div className="flex-1 min-w-0 text-[11px]">
                  <span style={{ color: '#64748b' }}>{ev.type} </span>
                  <span className="font-semibold text-white">{ev.name}</span>
                  <span style={{ color: '#475569' }}> → </span>
                  <span style={{ color: ev.color }}>{ev.label}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className="px-1.5 py-0.5 rounded text-[9px] font-bold"
                    style={ev.channel === 'wa'
                      ? { background: '#25d36622', color: '#25d366' }
                      : { background: '#6366f122', color: '#818cf8' }}
                  >
                    {ev.channel === 'wa' ? 'WA' : 'EMAIL'}
                  </span>
                  <span className="text-[10px] font-mono" style={{ color: '#334155' }}>{ev.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
