import React, { useState, useEffect } from 'react';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { MessageCircle, CheckCheck, Clock, XCircle, Users, Send, RefreshCw } from 'lucide-react';
import { MOCK_LEADS, SEG_META, AGENTS } from './types';

// ─── Derived data ─────────────────────────────────────────────────────────────

const waLeads = MOCK_LEADS.filter((l) => l.channel === 'wa');
const activeConvos = MOCK_LEADS.filter((l) => l.segment === 'SKIP_ACTIVE').length;
const noAnswer = MOCK_LEADS.filter((l) => l.segment === 'NO_ANSWER').length;
const successContact = MOCK_LEADS.filter((l) => l.segment === 'SUCCESSFUL_CONTACT').length;
const cooldown = MOCK_LEADS.filter((l) => l.segment === 'SKIP_COOLDOWN').length;

const waLeadsWithMeta = waLeads.slice(0, 80).map((l) => {
  const meta = SEG_META.find((s) => s.key === l.segment)!;
  return { ...l, meta };
});

// Status distribution for pie
const statusData = [
  { name: 'Active', value: activeConvos, color: '#25d366' },
  { name: 'No Answer', value: noAnswer, color: '#64748b' },
  { name: 'Contacted', value: successContact, color: '#06b6d4' },
  { name: 'Cooldown', value: cooldown, color: '#f59e0b' },
];

// WA leads per agent bar chart
const agentWAData = AGENTS.filter(a => a !== 'Unassigned').map((agent) => ({
  name: agent.split(' ')[0],
  WA: MOCK_LEADS.filter((l) => l.channel === 'wa' && l.assignedTo === agent).length,
}));

// Simulated message stats
const messageStats = [
  { hour: '08:00', sent: 42, delivered: 40, read: 35 },
  { hour: '09:00', sent: 67, delivered: 65, read: 58 },
  { hour: '10:00', sent: 89, delivered: 86, read: 79 },
  { hour: '11:00', sent: 74, delivered: 72, read: 64 },
  { hour: '12:00', sent: 51, delivered: 49, read: 42 },
  { hour: '13:00', sent: 38, delivered: 37, read: 30 },
  { hour: '14:00', sent: 95, delivered: 91, read: 84 },
  { hour: '15:00', sent: 112, delivered: 108, read: 97 },
];

// Templates
const templates = [
  { name: 'Welcome New Lead',     sent: 312, readRate: 78, category: 'Onboarding' },
  { name: 'PIX Payment Reminder', sent: 189, readRate: 91, category: 'Deposit' },
  { name: 'Docs Upload Request',  sent: 247, readRate: 83, category: 'Compliance' },
  { name: 'High Intent Follow-up',sent: 98,  readRate: 94, category: 'Hot Lead' },
  { name: 'Failed Deposit Alert', sent: 67,  readRate: 88, category: 'Recovery' },
  { name: 'Reactivation Message', sent: 145, readRate: 72, category: 'Re-engage' },
];

// ─── Tooltip ──────────────────────────────────────────────────────────────────

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

// ─── Conversation Row ─────────────────────────────────────────────────────────

function ConvoRow({ lead }: { lead: (typeof waLeadsWithMeta)[0] }) {
  const messages = [
    'Hello! Ready to get started?',
    'Your docs are pending review.',
    'PIX payment confirmed!',
    'Following up on your deposit.',
    'Welcome to FXGLOBE!',
  ];
  const msg = messages[parseInt(lead.id) % messages.length];
  return (
    <div
      className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-white/[0.02] group"
      style={{ borderBottom: '1px solid #1a1a3522' }}
    >
      {/* Avatar */}
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black shrink-0"
        style={{ background: lead.meta.color + '22', color: lead.meta.color, border: `1px solid ${lead.meta.color}44` }}
      >
        {lead.name.slice(0, 2).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-semibold text-white">{lead.name}</span>
          <span className="text-[9px] font-mono" style={{ color: '#334155' }}>#{lead.crmId}</span>
        </div>
        <div className="text-[11px] truncate" style={{ color: '#475569' }}>{msg}</div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
          style={{ background: lead.meta.color + '22', color: lead.meta.color, border: `1px solid ${lead.meta.color}44` }}
        >
          {lead.meta.icon} {lead.meta.label}
        </span>
        <span className="text-[10px] font-mono" style={{ color: '#334155' }}>{lead.updatedAt}</span>
        <button
          className="px-2.5 py-1 rounded-lg text-[10px] font-semibold opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: '#25d36622', color: '#25d366', border: '1px solid #25d36644' }}
        >
          <Send size={10} className="inline mr-1" />Reply
        </button>
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function WhatsAppView() {
  const [tab, setTab] = useState<'conversations' | 'templates'>('conversations');
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 2500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 space-y-5">

      {/* KPIs */}
      <div className="grid grid-cols-5 gap-4">
        {[
          { label: 'WA Leads',      value: waLeads.length, icon: MessageCircle, color: '#25d366' },
          { label: 'Active Convos', value: activeConvos,   icon: CheckCheck,    color: '#10b981' },
          { label: 'No Answer',     value: noAnswer,       icon: XCircle,       color: '#64748b' },
          { label: 'Contacted',     value: successContact, icon: Users,         color: '#06b6d4' },
          { label: 'Cooldown',      value: cooldown,       icon: Clock,         color: '#f59e0b' },
        ].map((k) => (
          <div key={k.label} className="rounded-xl p-4" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-3" style={{ background: k.color + '22', color: k.color }}>
              <k.icon size={15} />
            </div>
            <div className="text-2xl font-black text-white leading-none mb-1">{k.value}</div>
            <div className="text-[11px]" style={{ color: '#64748b' }}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-3 gap-4">

        {/* Message activity line */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#25d366' }}>
            Message Activity
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={messageStats} barSize={16} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="sent"      name="Sent"      fill="#25d36644" radius={[3,3,0,0]} />
              <Bar dataKey="delivered" name="Delivered" fill="#06b6d4"   radius={[3,3,0,0]} />
              <Bar dataKey="read"      name="Read"      fill="#25d366"   radius={[3,3,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Status pie */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-3" style={{ color: '#25d366' }}>
            Status Breakdown
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={statusData} dataKey="value" cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3}>
                {statusData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip content={<ChartTip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-2">
            {statusData.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ background: d.color }} />
                  <span style={{ color: '#64748b' }}>{d.name}</span>
                </div>
                <span className="font-bold text-white">{d.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tabs: conversations / templates */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
        <div className="flex items-center gap-1 p-3" style={{ borderBottom: '1px solid #1a1a35' }}>
          {(['conversations', 'templates'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-[11px] font-semibold capitalize transition-all"
              style={tab === t ? { background: '#25d36622', color: '#25d366' } : { color: '#475569' }}
            >
              {t}
            </button>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#25d366' }} />
            <span className="text-[10px] font-mono" style={{ color: '#25d366' }}>Live</span>
          </div>
        </div>

        {tab === 'conversations' ? (
          <div className="max-h-80 overflow-y-auto">
            {waLeadsWithMeta.slice(0, 30).map((lead) => (
              <ConvoRow key={lead.id} lead={lead} />
            ))}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {templates.map((tpl) => (
              <div
                key={tpl.name}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02] transition-colors"
                style={{ border: '1px solid #1a1a35' }}
              >
                <div className="flex-1">
                  <div className="text-[12px] font-semibold text-white">{tpl.name}</div>
                  <div className="text-[10px] font-mono" style={{ color: '#334155' }}>{tpl.category}</div>
                </div>
                <div className="text-right">
                  <div className="text-[12px] font-bold text-white">{tpl.sent}</div>
                  <div className="text-[10px]" style={{ color: '#475569' }}>sent</div>
                </div>
                <div className="text-right w-16">
                  <div className="text-[12px] font-bold" style={{ color: tpl.readRate > 85 ? '#10b981' : '#f59e0b' }}>
                    {tpl.readRate}%
                  </div>
                  <div className="text-[10px]" style={{ color: '#475569' }}>read rate</div>
                </div>
                <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: '#1a1a35' }}>
                  <div className="h-full rounded-full" style={{ width: `${tpl.readRate}%`, background: tpl.readRate > 85 ? '#10b981' : '#f59e0b' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
