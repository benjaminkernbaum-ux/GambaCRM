import React, { useState } from 'react';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { Mail, TrendingUp, MousePointerClick, AlertCircle, Send, Eye, BarChart2 } from 'lucide-react';
import { MOCK_LEADS, SEG_META, AGENTS } from './types';

// ─── Derived data ─────────────────────────────────────────────────────────────

const emailLeads = MOCK_LEADS.filter((l) => l.channel === 'email');
const totalSent = emailLeads.length;

// Simulated rates
const deliveryRate = 97.4;
const openRate     = 34.2;
const clickRate    = 8.7;
const bounceRate   = 2.6;
const unsubRate    = 0.9;
const replyRate    = 5.1;

// Campaigns
const campaigns = [
  { name: 'Welcome Series',        sent: 312, delivered: 304, opened: 187, clicked: 43, bounced: 8,  date: '09:15' },
  { name: 'PIX Deposit Nudge',     sent: 189, delivered: 185, opened: 141, clicked: 67, bounced: 4,  date: '10:30' },
  { name: 'Docs Verification',     sent: 247, delivered: 241, opened: 98,  clicked: 24, bounced: 6,  date: '11:00' },
  { name: 'High Intent Follow-up', sent: 98,  delivered: 97,  opened: 89,  clicked: 38, bounced: 1,  date: '12:15' },
  { name: 'Failed Deposit Recovery', sent: 67, delivered: 65, opened: 41, clicked: 19, bounced: 2,  date: '13:00' },
  { name: 'Re-engagement Blast',   sent: 145, delivered: 141, opened: 52,  clicked: 11, bounced: 4,  date: '14:30' },
  { name: 'Margin Call Alert',     sent: 34,  delivered: 34,  opened: 34,  clicked: 28, bounced: 0,  date: '15:00' },
];

// Area chart — hourly open/click data
const hourlyData = [
  { hour: '08:00', opens: 28, clicks: 6,  sent: 45 },
  { hour: '09:00', opens: 54, clicks: 14, sent: 89 },
  { hour: '10:00', opens: 71, clicks: 18, sent: 112 },
  { hour: '11:00', opens: 63, clicks: 15, sent: 97 },
  { hour: '12:00', opens: 41, clicks: 9,  sent: 68 },
  { hour: '13:00', opens: 35, clicks: 7,  sent: 54 },
  { hour: '14:00', opens: 82, clicks: 21, sent: 124 },
  { hour: '15:00', opens: 95, clicks: 24, sent: 138 },
  { hour: '16:00', opens: 67, clicks: 17, sent: 101 },
];

// Top performing subject lines
const subjectLines = [
  { subject: '🔥 Your account is ready — first deposit bonus',  openRate: 62, clicks: 29 },
  { subject: '⚡ PIX instant deposit confirmed!',               openRate: 58, clicks: 24 },
  { subject: '🎯 High-priority: complete your verification',    openRate: 51, clicks: 18 },
  { subject: '📋 Action required: document submission',        openRate: 44, clicks: 12 },
  { subject: '💳 Your PIX key is registered and ready',        openRate: 41, clicks: 15 },
];

// Per-agent email stats
const agentEmailData = AGENTS.filter(a => a !== 'Unassigned').map((agent) => {
  const agentLeads = MOCK_LEADS.filter((l) => l.assignedTo === agent && l.channel === 'email');
  return {
    name: agent.split(' ')[0],
    Emails: agentLeads.length,
  };
});

// ─── Tooltip ──────────────────────────────────────────────────────────────────

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

// ─── Rate Gauge ───────────────────────────────────────────────────────────────

function RateGauge({ label, value, color, icon: Icon }: { label: string; value: number; color: string; icon: React.ElementType }) {
  return (
    <div className="rounded-xl p-4" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: color + '22', color }}>
          <Icon size={13} />
        </div>
        <span className="text-[11px]" style={{ color: '#64748b' }}>{label}</span>
      </div>
      <div className="text-2xl font-black mb-2" style={{ color }}>{value}%</div>
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: '#1a1a35' }}>
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(value, 100)}%`, background: color }} />
      </div>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function EmailAnalyticsView() {
  const [tab, setTab] = useState<'campaigns' | 'subjects'>('campaigns');

  return (
    <div className="p-6 space-y-5">

      {/* Top KPIs */}
      <div className="grid grid-cols-6 gap-3">
        <RateGauge label="Delivery Rate"    value={deliveryRate} color="#10b981" icon={Send} />
        <RateGauge label="Open Rate"        value={openRate}     color="#6366f1" icon={Eye} />
        <RateGauge label="Click Rate"       value={clickRate}    color="#8b5cf6" icon={MousePointerClick} />
        <RateGauge label="Reply Rate"       value={replyRate}    color="#06b6d4" icon={Mail} />
        <RateGauge label="Bounce Rate"      value={bounceRate}   color="#ef4444" icon={AlertCircle} />
        <RateGauge label="Unsub Rate"       value={unsubRate}    color="#f59e0b" icon={TrendingUp} />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-3 gap-4">

        {/* Opens / Clicks area chart */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Opens & Clicks Over Time
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={hourlyData}>
              <defs>
                <linearGradient id="emailGrad1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="emailGrad2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="hour" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="sent"   name="Sent"   stroke="#475569" fill="none"            strokeWidth={1} strokeDasharray="4 3" />
              <Area type="monotone" dataKey="opens"  name="Opens"  stroke="#6366f1" fill="url(#emailGrad1)" strokeWidth={2} />
              <Area type="monotone" dataKey="clicks" name="Clicks" stroke="#10b981" fill="url(#emailGrad2)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Agent email bar */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Emails by Agent
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={agentEmailData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="Emails" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Campaigns / Subject lines */}
      <div className="rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
        <div className="flex items-center gap-1 p-3" style={{ borderBottom: '1px solid #1a1a35' }}>
          {(['campaigns', 'subjects'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-4 py-2 rounded-lg text-[11px] font-semibold capitalize transition-all"
              style={tab === t ? { background: '#6366f122', color: '#818cf8' } : { color: '#475569' }}
            >
              {t === 'subjects' ? 'Top Subject Lines' : 'Campaigns'}
            </button>
          ))}
          <div className="ml-auto text-[11px] font-mono" style={{ color: '#334155' }}>
            Total: <span className="text-white font-bold">{totalSent}</span> emails
          </div>
        </div>

        {tab === 'campaigns' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-[12px]">
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a35' }}>
                  {['Campaign', 'Sent', 'Delivered', 'Opened', 'Clicked', 'Bounced', 'Open Rate', 'Click Rate'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-mono tracking-widest uppercase" style={{ color: '#334155' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {campaigns.map((c) => {
                  const openRateC = ((c.opened / c.sent) * 100).toFixed(1);
                  const clickRateC = ((c.clicked / c.sent) * 100).toFixed(1);
                  return (
                    <tr key={c.name} className="hover:bg-white/[0.02] transition-colors" style={{ borderBottom: '1px solid #1a1a3522' }}>
                      <td className="px-4 py-3 font-semibold text-white">{c.name}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#94a3b8' }}>{c.sent}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#10b981' }}>{c.delivered}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#6366f1' }}>{c.opened}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#8b5cf6' }}>{c.clicked}</td>
                      <td className="px-4 py-3 font-mono" style={{ color: '#ef4444' }}>{c.bounced}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold" style={{ color: parseFloat(openRateC) > 40 ? '#10b981' : '#f59e0b' }}>{openRateC}%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-bold" style={{ color: parseFloat(clickRateC) > 15 ? '#8b5cf6' : '#475569' }}>{clickRateC}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {subjectLines.map((s, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/[0.02]" style={{ border: '1px solid #1a1a35' }}>
                <span className="text-[11px] font-mono shrink-0" style={{ color: '#334155' }}>#{i + 1}</span>
                <div className="flex-1 text-[12px] text-white font-medium">{s.subject}</div>
                <div className="flex items-center gap-4 shrink-0">
                  <div className="text-right">
                    <div className="text-[12px] font-bold" style={{ color: '#6366f1' }}>{s.openRate}%</div>
                    <div className="text-[10px]" style={{ color: '#334155' }}>opens</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[12px] font-bold" style={{ color: '#8b5cf6' }}>{s.clicks}</div>
                    <div className="text-[10px]" style={{ color: '#334155' }}>clicks</div>
                  </div>
                  <div className="h-1.5 w-24 rounded-full overflow-hidden" style={{ background: '#1a1a35' }}>
                    <div className="h-full rounded-full" style={{ width: `${s.openRate}%`, background: '#6366f1' }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
