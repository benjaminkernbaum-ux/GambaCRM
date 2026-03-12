import React, { useState, useEffect } from 'react';
import { Zap, Bot, ClipboardList, MessageCircle, BarChart2, Monitor, Rocket } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './types';
import { PipelineView } from './PipelineView';
import { OverviewView } from './OverviewView';
import { AgentControlsView } from './AgentControlsView';
import { WhatsAppView } from './WhatsAppView';
import { EmailAnalyticsView } from './EmailAnalyticsView';
import { FullMonitorView } from './FullMonitorView';

type View = 'overview' | 'agents' | 'pipeline' | 'whatsapp' | 'email' | 'monitor';

const NAV = [
  { id: 'overview'  as View, label: 'Overview',       icon: Zap },
  { id: 'agents'    as View, label: 'Agent Controls', icon: Bot },
  { id: 'pipeline'  as View, label: 'Lead Pipeline',  icon: ClipboardList },
  { id: 'whatsapp'  as View, label: 'WhatsApp',       icon: MessageCircle },
  { id: 'email'     as View, label: 'Email Analytics',icon: BarChart2 },
  { id: 'monitor'   as View, label: 'Full Monitor',   icon: Monitor },
];

export default function App() {
  const [activeView, setActiveView] = useState<View>('pipeline');
  const [time, setTime]   = useState(new Date());
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const t = setInterval(() => {
      setTime(new Date());
      setUptime((u) => u + 1);
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const fmtUptime = (s: number) => {
    const h = Math.floor(s / 3600).toString().padStart(2, '0');
    const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
    const sec = (s % 60).toString().padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  const timeStr = time.toLocaleTimeString('en-GB', { hour12: false });
  const dateStr = time.toLocaleDateString('en-US', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div className="flex h-screen overflow-hidden font-sans" style={{ background: '#05050f', color: '#e2e8f0' }}>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="w-52 flex flex-col shrink-0" style={{ background: '#07071a', borderRight: '1px solid #1a1a35' }}>

        {/* Branding */}
        <div className="px-5 pt-6 pb-5" style={{ borderBottom: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-sm font-black text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}
            >
              B
            </div>
            <div>
              <div className="text-[13px] font-black text-white leading-tight">Benjamin's Nexus</div>
              <div className="text-[9px] font-mono tracking-widest uppercase" style={{ color: '#475569' }}>COMMAND CENTER</div>
              <div className="text-[9px] font-mono font-bold tracking-widest" style={{ color: '#6366f1' }}>V8.0</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-0.5 overflow-y-auto">
          <div className="text-[9px] font-mono tracking-widest uppercase px-3 mb-3" style={{ color: '#334155' }}>
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
        <div className="px-4 py-4" style={{ borderTop: '1px solid #1a1a35' }}>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#10b981' }} />
            <span className="text-[11px] font-semibold" style={{ color: '#10b981' }}>Dashboard Online</span>
          </div>
          <div className="text-[10px] font-mono" style={{ color: '#334155' }}>
            Sync uptime: {fmtUptime(uptime)}
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header
          className="shrink-0 px-8 pt-6 pb-5 flex items-start justify-between"
          style={{ borderBottom: '1px solid #1a1a35' }}
        >
          <div>
            <div
              className="text-[10px] font-mono tracking-[0.3em] uppercase mb-1.5"
              style={{ color: '#6366f1' }}
            >
              FXGLOBE AI AUTOMATION SUITE
            </div>
            <h1 className="text-[2rem] font-black tracking-tight leading-none">
              <span className="text-white">Operational </span>
              <span style={{ color: '#a78bfa' }}>Nexus.</span>
            </h1>
          </div>

          <div className="flex items-center gap-5">
            <div className="text-right">
              <div className="text-3xl font-black font-mono text-white tracking-tight leading-none">
                {timeStr}
              </div>
              <div className="text-[11px] mt-1" style={{ color: '#475569' }}>{dateStr}</div>
              <div className="text-[11px]" style={{ color: '#475569' }}>Benjamin · Account Manager</div>
            </div>
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}
            >
              <Rocket size={15} />
              Launch Suite
            </motion.button>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto scrollbar-hide" style={{ background: '#05050f' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeView}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              {activeView === 'overview'  && <OverviewView />}
              {activeView === 'agents'   && <AgentControlsView />}
              {activeView === 'pipeline' && <PipelineView />}
              {activeView === 'whatsapp' && <WhatsAppView />}
              {activeView === 'email'    && <EmailAnalyticsView />}
              {activeView === 'monitor'  && <FullMonitorView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
