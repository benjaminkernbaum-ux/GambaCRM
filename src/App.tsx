import React, { useState, useEffect, useCallback } from 'react';
import { Zap, Bot, ClipboardList, MessageCircle, BarChart2, Monitor, Rocket, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './types';
import { PipelineView } from './PipelineView';
import { OverviewView } from './OverviewView';
import { AgentControlsView } from './AgentControlsView';
import { WhatsAppView } from './WhatsAppView';
import { EmailAnalyticsView } from './EmailAnalyticsView';
import { FullMonitorView } from './FullMonitorView';
import { api } from './api';

type View = 'overview' | 'agents' | 'pipeline' | 'whatsapp' | 'email' | 'monitor';

const NAV: { id: View; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',        icon: Zap },
  { id: 'agents',    label: 'Agent Controls',  icon: Bot },
  { id: 'pipeline',  label: 'Lead Pipeline',   icon: ClipboardList },
  { id: 'whatsapp',  label: 'WhatsApp',        icon: MessageCircle },
  { id: 'email',     label: 'Email Analytics', icon: BarChart2 },
  { id: 'monitor',   label: 'Full Monitor',    icon: Monitor },
];

// ─── Toast ────────────────────────────────────────────────────────────────────

type ToastType = 'success' | 'error' | 'info';
interface Toast { id: number; type: ToastType; message: string }

function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 4000);
    return () => clearTimeout(t);
  }, []);
  const colors: Record<ToastType, string> = {
    success: '#10b981',
    error:   '#ef4444',
    info:    '#6366f1',
  };
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 60 }}
      className="flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl"
      style={{ background: '#080d18', border: `1px solid ${colors[toast.type]}44`, minWidth: 280 }}
    >
      {toast.type === 'success' && <CheckCircle2 size={15} style={{ color: '#10b981' }} />}
      {toast.type === 'error'   && <AlertTriangle size={15} style={{ color: '#ef4444' }} />}
      {toast.type === 'info'    && <Rocket size={15} style={{ color: '#6366f1' }} />}
      <span className="text-[12px] font-medium flex-1" style={{ color: '#e2e8f0', fontFamily: 'Space Grotesk, sans-serif' }}>
        {toast.message}
      </span>
      <button onClick={onDismiss} className="opacity-40 hover:opacity-100 transition-opacity">
        <X size={12} style={{ color: '#94a3b8' }} />
      </button>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeView, setActiveView] = useState<View>('pipeline');
  const [time, setTime]     = useState(new Date());
  const [uptime, setUptime] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  let toastId = 0;

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  // Live clock + uptime
  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setUptime((u) => u + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Check backend connectivity on mount
  useEffect(() => {
    api.agents().then((res) => setBackendOnline(res !== null));
  }, []);

  const fmtUptime = (s: number) => {
    const h   = Math.floor(s / 3600).toString().padStart(2, '0');
    const m   = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  // Launch Suite — mirrors original JS launchSuite()
  const handleLaunchSuite = async () => {
    setLaunching(true);
    addToast('info', 'Launching suite — starting all agents…');
    const res = await api.launchSuite();
    if (res?.ok) {
      addToast('success', res.message ?? 'Suite launched! CRM Sync + analytics tabs opened.');
    } else {
      // Backend offline → start agents client-side and navigate to controls
      addToast('info', 'Backend offline — navigating to Agent Controls.');
    }
    setLaunching(false);
    setActiveView('agents');
  };

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ background: 'var(--bg)', color: '#e2e8f0', fontFamily: 'Space Grotesk, sans-serif' }}
    >

      {/* ── Toast container ── */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2">
        <AnimatePresence>
          {toasts.map((t) => (
            <ToastItem key={t.id} toast={t} onDismiss={() => removeToast(t.id)} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="w-52 flex flex-col shrink-0"
        style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)' }}
      >
        {/* Branding */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              FX
            </div>
            <div>
              <div className="text-[13px] font-bold text-white leading-tight">FXGLOBE Nexus</div>
              <div
                className="text-[9px] tracking-widest uppercase"
                style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}
              >
                COMMAND CENTER
              </div>
              <div
                className="text-[9px] font-bold tracking-widest"
                style={{ color: '#6366f1', fontFamily: 'JetBrains Mono, monospace' }}
              >
                V8.0
              </div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <div
            className="text-[9px] tracking-widest uppercase px-3 mb-3"
            style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Navigation
          </div>
          {NAV.map((item) => {
            const active = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[13px] font-medium transition-all text-left',
                  active ? 'text-white' : 'hover:text-zinc-300',
                )}
                style={
                  active
                    ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)', color: '#fff' }
                    : { color: '#475569', border: '1px solid transparent' }
                }
              >
                <item.icon size={15} style={{ color: active ? '#818cf8' : '#334155' }} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Online Status */}
        <div className="px-4 py-4" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: backendOnline ? '#10b981' : backendOnline === null ? '#f59e0b' : '#ef4444' }}
            />
            <span
              className="text-[11px] font-semibold"
              style={{ color: backendOnline ? '#10b981' : backendOnline === null ? '#f59e0b' : '#ef4444' }}
            >
              {backendOnline ? 'Backend Connected' : backendOnline === null ? 'Connecting…' : 'Dashboard Online'}
            </span>
          </div>
          <div
            className="text-[10px]"
            style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}
          >
            Sync uptime: {fmtUptime(uptime)}
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header
          className="shrink-0 px-8 pt-6 pb-5 flex items-start justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <div
              className="text-[10px] tracking-[0.3em] uppercase mb-1.5"
              style={{ color: '#6366f1', fontFamily: 'JetBrains Mono, monospace' }}
            >
              FXGLOBE AI AUTOMATION SUITE
            </div>
            <h1 className="text-[2rem] font-bold tracking-tight leading-none">
              <span className="text-white">Operational </span>
              <span style={{ color: '#a78bfa' }}>Nexus.</span>
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div
                className="text-3xl font-bold text-white tracking-tight leading-none"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}
              >
                {timeStr}
              </div>
              <div className="text-[11px] mt-1" style={{ color: '#475569' }}>{dateStr}</div>
              <div className="text-[11px]" style={{ color: '#475569' }}>Account Manager · FXGLOBE</div>
            </div>

            {/* Launch Suite */}
            <motion.button
              id="launch-suite-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLaunchSuite}
              disabled={launching}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-70 transition-all"
              style={{
                background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                boxShadow: '0 0 24px rgba(99,102,241,0.35)',
              }}
            >
              {launching
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Rocket size={15} />
              }
              {launching ? 'Launching…' : 'Launch Suite'}
            </motion.button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeView === 'overview'  && <OverviewView />}
              {activeView === 'agents'    && <AgentControlsView onToast={addToast} />}
              {activeView === 'pipeline'  && <PipelineView />}
              {activeView === 'whatsapp'  && <WhatsAppView />}
              {activeView === 'email'     && <EmailAnalyticsView />}
{activeView === 'monitor'   && <FullMonitorView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
