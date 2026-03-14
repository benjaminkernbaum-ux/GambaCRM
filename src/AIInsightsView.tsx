import React, { useState, useEffect } from 'react';
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ScatterChart, Scatter, ZAxis, Cell,
} from 'recharts';
import {
  Brain, Sparkles, TrendingUp, Target, Zap, AlertTriangle,
  ArrowUpRight, ArrowRight, Lightbulb, Cpu, Activity,
  ShieldCheck, Eye, Star, Award, Flame, CircleDot,
} from 'lucide-react';
import { MOCK_LEADS, SEG_META, SegmentKey } from './types';

// ─── AI Predictions Data ─────────────────────────────────────────────────────

// Lead scoring distribution
const scoringDistribution = [
  { score: '0-20', count: 89, color: '#ef4444' },
  { score: '21-40', count: 143, color: '#f59e0b' },
  { score: '41-60', count: 201, color: '#6366f1' },
  { score: '61-80', count: 178, color: '#8b5cf6' },
  { score: '81-100', count: 108, color: '#10b981' },
];

// Conversion probability by segment (radar)
const segmentRadarData = [
  { segment: 'High Intent', score: 92, benchmark: 70 },
  { segment: 'PIX Ready', score: 88, benchmark: 65 },
  { segment: 'Docs Verified', score: 75, benchmark: 60 },
  { segment: 'New Lead', score: 42, benchmark: 40 },
  { segment: 'Successful Contact', score: 68, benchmark: 55 },
  { segment: 'No Answer', score: 18, benchmark: 25 },
];

// AI model performance over time
const modelPerformance = [
  { week: 'W1', accuracy: 84, precision: 81, recall: 79 },
  { week: 'W2', accuracy: 86, precision: 83, recall: 82 },
  { week: 'W3', accuracy: 87, precision: 85, recall: 83 },
  { week: 'W4', accuracy: 89, precision: 87, recall: 85 },
  { week: 'W5', accuracy: 91, precision: 89, recall: 87 },
  { week: 'W6', accuracy: 91, precision: 90, recall: 88 },
  { week: 'W7', accuracy: 93, precision: 91, recall: 90 },
  { week: 'W8', accuracy: 92, precision: 91, recall: 89 },
];

// Churn risk predictions
const churnRisk = [
  { segment: 'No Answer', risk: 87, leads: 25, color: '#ef4444', action: 'Escalate to phone' },
  { segment: 'Failed Deposit', risk: 72, leads: 14, color: '#f97316', action: 'Retry deposit flow' },
  { segment: 'Cooldown', risk: 64, leads: 22, color: '#f59e0b', action: 'Re-engagement sequence' },
  { segment: 'Docs Pending', risk: 41, leads: 27, color: '#6366f1', action: 'Reminder campaign' },
  { segment: 'New Registration', risk: 35, leads: 38, color: '#8b5cf6', action: 'Welcome drip' },
];

// Conversion predictions scatter (score vs deposit probability)
const conversionScatter = MOCK_LEADS.slice(0, 100).map((l, i) => {
  const segMeta = SEG_META.find((s) => s.key === l.segment);
  const baseScore = l.segment === 'HIGH_INTENT_DEPOSIT' ? 85 :
    l.segment === 'PIX_READY' ? 80 :
    l.segment === 'DOCS_VERIFIED' ? 70 :
    l.segment === 'SUCCESSFUL_CONTACT' ? 55 :
    l.segment === 'NEW_LEAD' ? 40 :
    l.segment === 'FAILED_DEPOSIT' ? 30 : 20;
  return {
    score: baseScore + Math.floor(Math.random() * 15 - 7),
    probability: baseScore + Math.floor(Math.random() * 20 - 10),
    size: (l.depositAmount ?? 2000) / 500,
    color: segMeta?.color ?? '#475569',
    name: l.name,
    segment: segMeta?.label ?? l.segment,
  };
});

// AI Recommendations
const recommendations = [
  {
    priority: 'critical',
    title: '22 leads com alta probabilidade de deposito',
    description: 'Leads HIGH_INTENT com score >85 aguardando contato. Conversao estimada: 78%.',
    impact: '+R$180K receita potencial',
    action: 'Atribuir ao agente agora',
    icon: Flame,
    color: '#f97316',
  },
  {
    priority: 'high',
    title: 'Campanha PIX Nudge com performance excepcional',
    description: 'Open rate 91% vs benchmark 34%. Expandir para 45 leads DOCS_VERIFIED.',
    impact: '+15% taxa de conversao',
    action: 'Expandir campanha',
    icon: Sparkles,
    color: '#8b5cf6',
  },
  {
    priority: 'high',
    title: '14 leads FAILED_DEPOSIT com retry window aberto',
    description: 'Janela de 24h para re-tentativa de deposito. ML detectou pattern de horario ideal: 14h-16h.',
    impact: 'Recuperar R$42K',
    action: 'Agendar retentativa',
    icon: Target,
    color: '#10b981',
  },
  {
    priority: 'medium',
    title: 'Modelo de scoring atualizado para v2.5',
    description: 'Novo modelo treinado com 14 samples adicionais. Accuracy subiu de 91% para 93%.',
    impact: '+2.1% accuracy',
    action: 'Aprovar deploy',
    icon: Brain,
    color: '#6366f1',
  },
  {
    priority: 'medium',
    title: '25 leads NO_ANSWER com risco de churn 87%',
    description: 'Escalar para canal telefonico. Agendamento automatico disponivel via AI.',
    impact: 'Reter 18 leads estimados',
    action: 'Escalar para telefone',
    icon: AlertTriangle,
    color: '#ef4444',
  },
];

// Feature importance
const featureImportance = [
  { feature: 'Deposit History', importance: 0.28, color: '#10b981' },
  { feature: 'WA Response Time', importance: 0.22, color: '#25d366' },
  { feature: 'Doc Status', importance: 0.18, color: '#6366f1' },
  { feature: 'Phone Activity', importance: 0.14, color: '#8b5cf6' },
  { feature: 'Email Opens', importance: 0.10, color: '#f97316' },
  { feature: 'Session Duration', importance: 0.08, color: '#06b6d4' },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function ChartTip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
      <div className="font-bold text-white mb-1">{label}</div>
      {payload.map((p: any) => (
        <div key={p.name} style={{ color: p.color ?? p.stroke ?? '#94a3b8' }}>
          {p.name}: <span className="font-bold">{p.value}{typeof p.value === 'number' && p.value <= 100 ? '%' : ''}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export function AIInsightsView() {
  const [tick, setTick] = useState(0);
  const [activeRec, setActiveRec] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 4000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="p-6 space-y-5">

      {/* AI Header Banner */}
      <div className="rounded-xl p-5 relative overflow-hidden" style={{
        background: 'linear-gradient(135deg, #0d0d22 0%, #1a0a2e 50%, #0d0d22 100%)',
        border: '1px solid #8b5cf633',
      }}>
        <div className="absolute inset-0 opacity-10"
          style={{ background: 'radial-gradient(ellipse at 30% 50%, #8b5cf6, transparent 60%), radial-gradient(ellipse at 70% 50%, #6366f1, transparent 60%)' }} />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', boxShadow: '0 0 30px #8b5cf644' }}>
              <Brain size={24} color="#fff" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">AI Intelligence Engine</div>
              <div className="text-[11px]" style={{ color: '#a78bfa' }}>Model v2.4 · 719 leads scored · Last updated 3min ago</div>
            </div>
          </div>
          <div className="flex items-center gap-6">
            {[
              { label: 'Accuracy', value: '93%', color: '#10b981' },
              { label: 'Precision', value: '91%', color: '#6366f1' },
              { label: 'Recall', value: '90%', color: '#8b5cf6' },
              { label: 'F1 Score', value: '90.5%', color: '#06b6d4' },
            ].map((m) => (
              <div key={m.label} className="text-center">
                <div className="text-xl font-black font-mono" style={{ color: m.color }}>{m.value}</div>
                <div className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>{m.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* KPI + Score Distribution */}
      <div className="grid grid-cols-3 gap-4">

        {/* Scoring distribution */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#8b5cf6' }}>
            Lead Score Distribution
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={scoringDistribution} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="score" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Bar dataKey="count" name="Leads" radius={[4, 4, 0, 0]}>
                {scoringDistribution.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Radar: Conversion probability */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#6366f1' }}>
            Conversion Probability
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <RadarChart data={segmentRadarData}>
              <PolarGrid stroke="#1a1a35" />
              <PolarAngleAxis dataKey="segment" tick={{ fill: '#475569', fontSize: 9 }} />
              <Radar name="Score" dataKey="score" stroke="#6366f1" fill="#6366f1" fillOpacity={0.2} strokeWidth={2} />
              <Radar name="Benchmark" dataKey="benchmark" stroke="#475569" fill="none" strokeDasharray="4 4" strokeWidth={1} />
              <Tooltip content={<ChartTip />} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Model performance */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="text-[11px] font-mono tracking-widest uppercase mb-4" style={{ color: '#10b981' }}>
            Model Performance
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={modelPerformance}>
              <defs>
                <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" vertical={false} />
              <XAxis dataKey="week" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis domain={[70, 100]} tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="accuracy" name="Accuracy" stroke="#10b981" fill="url(#aiGrad)" strokeWidth={2} />
              <Area type="monotone" dataKey="precision" name="Precision" stroke="#6366f1" fill="none" strokeWidth={1.5} />
              <Area type="monotone" dataKey="recall" name="Recall" stroke="#8b5cf6" fill="none" strokeWidth={1.5} strokeDasharray="4 3" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* AI Recommendations + Churn Risk */}
      <div className="grid grid-cols-3 gap-4">

        {/* Recommendations */}
        <div className="col-span-2 rounded-xl overflow-hidden" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1a1a35' }}>
            <Lightbulb size={13} style={{ color: '#f59e0b' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#f59e0b' }}>AI Recommendations</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-bold ml-2"
              style={{ background: '#f59e0b18', color: '#f59e0b' }}>{recommendations.length} actions</span>
          </div>
          <div className="divide-y" style={{ borderColor: '#1a1a3522' } as any}>
            {recommendations.map((rec, i) => {
              const priorityColors = { critical: '#ef4444', high: '#f97316', medium: '#6366f1', low: '#475569' };
              const pColor = priorityColors[rec.priority as keyof typeof priorityColors];
              return (
                <div key={i} className="px-5 py-4 hover:bg-white/[0.02] transition-colors"
                  style={{ borderLeft: `3px solid ${rec.color}` }}>
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                      style={{ background: rec.color + '18', color: rec.color }}>
                      <rec.icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase"
                          style={{ background: pColor + '22', color: pColor }}>{rec.priority}</span>
                        <span className="text-[12px] font-bold text-white">{rec.title}</span>
                      </div>
                      <div className="text-[11px] mb-2" style={{ color: '#64748b' }}>{rec.description}</div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] font-bold font-mono" style={{ color: '#10b981' }}>
                          <ArrowUpRight size={10} className="inline" /> {rec.impact}
                        </span>
                        <button className="text-[10px] font-bold px-3 py-1 rounded-lg transition-all"
                          style={{ background: rec.color + '18', color: rec.color, border: `1px solid ${rec.color}33` }}>
                          {rec.action} <ArrowRight size={9} className="inline ml-0.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Churn Risk */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck size={13} style={{ color: '#ef4444' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#ef4444' }}>Churn Risk</span>
          </div>
          <div className="space-y-3">
            {churnRisk.map((c) => (
              <div key={c.segment} className="rounded-xl p-3" style={{ background: '#05050f', border: `1px solid ${c.color}22` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-semibold text-white">{c.segment}</span>
                  <span className="text-[12px] font-black font-mono" style={{ color: c.color }}>{c.risk}%</span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden mb-2" style={{ background: '#1a1a35' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${c.risk}%`, background: c.color }} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-mono" style={{ color: '#334155' }}>{c.leads} leads</span>
                  <span className="text-[9px]" style={{ color: '#475569' }}>{c.action}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Feature importance + Scatter */}
      <div className="grid grid-cols-3 gap-4">

        {/* Feature importance */}
        <div className="rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-4">
            <Star size={13} style={{ color: '#f59e0b' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#f59e0b' }}>Feature Importance</span>
          </div>
          <div className="space-y-3">
            {featureImportance.map((f) => (
              <div key={f.feature}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px]" style={{ color: '#94a3b8' }}>{f.feature}</span>
                  <span className="text-[11px] font-mono font-bold" style={{ color: f.color }}>{(f.importance * 100).toFixed(0)}%</span>
                </div>
                <div className="h-2 rounded-full overflow-hidden" style={{ background: '#1a1a35' }}>
                  <div className="h-full rounded-full transition-all" style={{ width: `${f.importance * 100 * 3.5}%`, background: `linear-gradient(90deg, ${f.color}88, ${f.color})` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scatter: Score vs Probability */}
        <div className="col-span-2 rounded-xl p-5" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-4">
            <CircleDot size={13} style={{ color: '#6366f1' }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>Score vs Deposit Probability</span>
            <span className="text-[9px] ml-2" style={{ color: '#334155' }}>Each dot = 1 lead · Size = deposit amount</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <ScatterChart>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a3566" />
              <XAxis dataKey="score" name="Lead Score" tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Lead Score', position: 'bottom', fill: '#334155', fontSize: 9 }} />
              <YAxis dataKey="probability" name="Deposit Prob." tick={{ fill: '#334155', fontSize: 10 }} axisLine={false} tickLine={false} label={{ value: 'Deposit Prob.', angle: -90, position: 'left', fill: '#334155', fontSize: 9 }} />
              <ZAxis dataKey="size" range={[20, 120]} />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0]?.payload;
                  return (
                    <div className="rounded-lg px-3 py-2 text-[11px]" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
                      <div className="font-bold text-white">{d?.name}</div>
                      <div style={{ color: '#6366f1' }}>Score: {d?.score}</div>
                      <div style={{ color: '#10b981' }}>Probability: {d?.probability}%</div>
                      <div style={{ color: '#94a3b8' }}>{d?.segment}</div>
                    </div>
                  );
                }}
              />
              <Scatter data={conversionScatter} isAnimationActive={false}>
                {conversionScatter.map((d, i) => <Cell key={i} fill={d.color} fillOpacity={0.6} />)}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
