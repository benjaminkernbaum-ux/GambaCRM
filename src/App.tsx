import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Zap, Bot, ClipboardList, MessageCircle, BarChart2, Monitor, Rocket, CheckCircle2,
  AlertTriangle, X, DollarSign, Brain, Users, Bell, Search, Command, ArrowRight,
  Sparkles, TrendingUp, Shield, Settings, ChevronDown, ChevronRight as ChevRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, MOCK_LEADS, SEG_META } from './types';
import { PipelineView } from './PipelineView';
import { OverviewView } from './OverviewView';
import { AgentControlsView } from './AgentControlsView';
import { WhatsAppView } from './WhatsAppView';
import { EmailAnalyticsView } from './EmailAnalyticsView';
import { FullMonitorView } from './FullMonitorView';
import { RevenueView } from './RevenueView';
import { AIInsightsView } from './AIInsightsView';
import { ClientsView } from './ClientsView';
import { api } from './api';

type View = 'overview' | 'agents' | 'pipeline' | 'whatsapp' | 'email' | 'monitor' | 'revenue' | 'ai' | 'clients';

interface NavSection {
  label: string;
  items: { id: View; label: string; icon: React.ElementType; badge?: string; badgeColor?: string }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    label: 'Command Center',
    items: [
      { id: 'overview',  label: 'Overview',        icon: Zap },
      { id: 'revenue',   label: 'Revenue',         icon: DollarSign, badge: 'NEW', badgeColor: '#10b981' },
      { id: 'ai',        label: 'AI Insights',     icon: Brain, badge: 'AI', badgeColor: '#8b5cf6' },
    ],
  },
  {
    label: 'Operations',
    items: [
      { id: 'pipeline',  label: 'Lead Pipeline',   icon: ClipboardList },
      { id: 'clients',   label: 'Client Portfolio', icon: Users, badge: 'NEW', badgeColor: '#06b6d4' },
      { id: 'agents',    label: 'Agent Controls',  icon: Bot },
    ],
  },
  {
    label: 'Channels',
    items: [
      { id: 'whatsapp',  label: 'WhatsApp',        icon: MessageCircle },
      { id: 'email',     label: 'Email Analytics', icon: BarChart2 },
    ],
  },
  {
    label: 'System',
    items: [
      { id: 'monitor',   label: 'Full Monitor',    icon: Monitor },
    ],
  },
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
      style={{ background: '#080d18', border: `1px solid ${colors[toast.type]}44`, minWidth: 300 }}
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

// ─── Notification System ─────────────────────────────────────────────────────

interface Notification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'lead' | 'deposit' | 'alert' | 'ai';
  read: boolean;
  color: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 1, title: 'High-Intent Lead Detected', message: 'Carlos Silva (#540001) scored 95 — ready for deposit.', time: '2min ago', type: 'ai', read: false, color: '#f97316' },
  { id: 2, title: 'Deposit Received', message: 'R$12,500 from Ana Souza (#540002) via PIX.', time: '8min ago', type: 'deposit', read: false, color: '#10b981' },
  { id: 3, title: 'Churn Risk Alert', message: '5 leads in NO_ANSWER for >48h — escalation recommended.', time: '15min ago', type: 'alert', read: false, color: '#ef4444' },
  { id: 4, title: 'AI Model Updated', message: 'Lead scoring v2.5 deployed — accuracy 93%.', time: '1h ago', type: 'ai', read: true, color: '#8b5cf6' },
  { id: 5, title: 'New Lead Assigned', message: 'Pedro Lima (#540009) assigned to your pipeline.', time: '2h ago', type: 'lead', read: true, color: '#6366f1' },
];

function NotificationPanel({ notifications, onClose, onMarkRead }: {
  notifications: Notification[];
  onClose: () => void;
  onMarkRead: (id: number) => void;
}) {
  const unread = notifications.filter((n) => !n.read).length;
  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ duration: 0.15 }}
      className="absolute right-0 top-full mt-2 w-96 rounded-xl z-[200] overflow-hidden"
      style={{ background: '#080d18', border: '1px solid #1a1a35', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
    >
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid #1a1a35' }}>
        <div className="flex items-center gap-2">
          <Bell size={13} style={{ color: '#6366f1' }} />
          <span className="text-[12px] font-bold text-white">Notifications</span>
          {unread > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold" style={{ background: '#ef444422', color: '#ef4444' }}>
              {unread} new
            </span>
          )}
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10" style={{ color: '#475569' }}>
          <X size={12} />
        </button>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map((n) => (
          <div
            key={n.id}
            className="px-4 py-3 flex items-start gap-3 hover:bg-white/[0.02] transition-colors cursor-pointer"
            style={{
              borderBottom: '1px solid #1a1a3522',
              background: n.read ? 'transparent' : n.color + '06',
            }}
            onClick={() => onMarkRead(n.id)}
          >
            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
              style={{ background: n.color + '18', color: n.color }}>
              {n.type === 'ai' && <Brain size={12} />}
              {n.type === 'deposit' && <DollarSign size={12} />}
              {n.type === 'alert' && <AlertTriangle size={12} />}
              {n.type === 'lead' && <Users size={12} />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-white">{n.title}</span>
                {!n.read && <div className="w-1.5 h-1.5 rounded-full" style={{ background: '#6366f1' }} />}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#64748b' }}>{n.message}</div>
              <div className="text-[9px] font-mono mt-1" style={{ color: '#334155' }}>{n.time}</div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Command Palette ─────────────────────────────────────────────────────────

function CommandPalette({
  onClose, onNavigate,
}: {
  onClose: () => void;
  onNavigate: (view: View) => void;
}) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const allItems = NAV_SECTIONS.flatMap((s) => s.items);
  const filtered = query
    ? allItems.filter((item) => item.label.toLowerCase().includes(query.toLowerCase()))
    : allItems;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh]"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: -10, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -10, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        className="w-[520px] rounded-xl overflow-hidden"
        style={{ background: '#080d18', border: '1px solid #1a1a35', boxShadow: '0 24px 80px rgba(0,0,0,0.6)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3" style={{ borderBottom: '1px solid #1a1a35' }}>
          <Search size={15} style={{ color: '#6366f1' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, commands..."
            className="flex-1 bg-transparent text-[13px] outline-none text-white placeholder:text-[#334155]"
          />
          <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#1a1a35', color: '#475569' }}>ESC</kbd>
        </div>
        <div className="py-2 max-h-80 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="px-4 py-6 text-center text-[12px]" style={{ color: '#334155' }}>No results found</div>
          )}
          {filtered.map((item) => (
            <button
              key={item.id}
              onClick={() => { onNavigate(item.id); onClose(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
            >
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#1a1a35' }}>
                <item.icon size={14} style={{ color: '#6366f1' }} />
              </div>
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-white">{item.label}</div>
              </div>
              {item.badge && (
                <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: (item.badgeColor ?? '#6366f1') + '22', color: item.badgeColor ?? '#6366f1' }}>
                  {item.badge}
                </span>
              )}
              <ArrowRight size={11} style={{ color: '#334155' }} />
            </button>
          ))}
        </div>
        <div className="px-4 py-2 flex items-center gap-4 text-[9px] font-mono" style={{ borderTop: '1px solid #1a1a35', color: '#334155' }}>
          <span>Navigate <kbd className="px-1 rounded" style={{ background: '#1a1a35' }}>Enter</kbd></span>
          <span>Close <kbd className="px-1 rounded" style={{ background: '#1a1a35' }}>Esc</kbd></span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────

export default function App() {
  const [activeView, setActiveView] = useState<View>('overview');
  const [time, setTime]     = useState(new Date());
  const [uptime, setUptime] = useState(0);
  const [launching, setLaunching] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  let toastId = 0;

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = ++toastId;
    setToasts((t) => [...t, { id, type, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const markNotificationRead = useCallback((id: number) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
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

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette((v) => !v);
      }
      if (e.key === 'Escape') {
        setShowCommandPalette(false);
        setShowNotifications(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
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

  const handleLaunchSuite = async () => {
    setLaunching(true);
    addToast('info', 'Launching suite — starting all agents...');
    const res = await api.launchSuite();
    if (res?.ok) {
      addToast('success', res.message ?? 'Suite launched! CRM Sync + analytics tabs opened.');
    } else {
      addToast('info', 'Backend offline — navigating to Agent Controls.');
    }
    setLaunching(false);
    setActiveView('agents');
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const toggleSection = (label: string) => {
    setCollapsedSections((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  // Quick stats for sidebar
  const totalLeads = MOCK_LEADS.length;
  const hotLeads = MOCK_LEADS.filter((l) => l.segment === 'HIGH_INTENT_DEPOSIT' || l.segment === 'PIX_READY').length;

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

      {/* ── Command Palette ── */}
      <AnimatePresence>
        {showCommandPalette && (
          <CommandPalette
            onClose={() => setShowCommandPalette(false)}
            onNavigate={setActiveView}
          />
        )}
      </AnimatePresence>

      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside
        className="w-56 flex flex-col shrink-0"
        style={{ background: 'var(--sidebar)', borderRight: '1px solid var(--border)' }}
      >
        {/* Branding */}
        <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black text-white shrink-0"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px #6366f133' }}
            >
              FX
            </div>
            <div>
              <div className="text-[13px] font-bold text-white leading-tight">FXGLOBE Nexus</div>
              <div className="text-[9px] tracking-widest uppercase"
                style={{ color: '#475569', fontFamily: 'JetBrains Mono, monospace' }}>
                COMMAND CENTER
              </div>
              <div className="flex items-center gap-2">
                <div className="text-[9px] font-bold tracking-widest"
                  style={{ color: '#6366f1', fontFamily: 'JetBrains Mono, monospace' }}>
                  V9.0
                </div>
                <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{ background: '#10b98118', color: '#10b981', border: '1px solid #10b98133' }}>
                  PRO
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Search */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => setShowCommandPalette(true)}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-[11px] transition-all hover:bg-white/[0.04]"
            style={{ background: '#0a0e1a', border: '1px solid var(--border)', color: '#334155' }}
          >
            <Search size={12} />
            <span className="flex-1 text-left">Search...</span>
            <kbd className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ background: '#1a1a35', color: '#475569' }}>
              ⌘K
            </kbd>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto scrollbar-hide">
          {NAV_SECTIONS.map((section) => {
            const isCollapsed = collapsedSections[section.label];
            return (
              <div key={section.label} className="mb-1">
                <button
                  onClick={() => toggleSection(section.label)}
                  className="w-full flex items-center gap-1 px-3 py-1.5 text-left group"
                >
                  <ChevRight
                    size={9}
                    className={`transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                    style={{ color: '#1e293b' }}
                  />
                  <span className="text-[9px] tracking-[0.2em] uppercase font-semibold"
                    style={{ color: '#1e293b', fontFamily: 'JetBrains Mono, monospace' }}>
                    {section.label}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.15 }}
                      className="overflow-hidden"
                    >
                      {section.items.map((item) => {
                        const active = activeView === item.id;
                        return (
                          <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={cn(
                              'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12px] font-medium transition-all text-left mb-0.5',
                              active ? 'text-white' : 'hover:text-zinc-300 hover:bg-white/[0.03]',
                            )}
                            style={
                              active
                                ? { background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.28)', color: '#fff' }
                                : { color: '#475569', border: '1px solid transparent' }
                            }
                          >
                            <item.icon size={14} style={{ color: active ? '#818cf8' : '#334155' }} />
                            <span className="flex-1">{item.label}</span>
                            {item.badge && (
                              <span className="text-[7px] font-bold px-1.5 py-0.5 rounded-full"
                                style={{ background: (item.badgeColor ?? '#6366f1') + '22', color: item.badgeColor ?? '#6366f1' }}>
                                {item.badge}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        {/* Sidebar Stats */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="rounded-lg p-2 text-center" style={{ background: '#0a0e1a', border: '1px solid var(--border)' }}>
              <div className="text-[14px] font-black font-mono" style={{ color: '#6366f1' }}>{totalLeads}</div>
              <div className="text-[8px] uppercase tracking-wider" style={{ color: '#334155' }}>Leads</div>
            </div>
            <div className="rounded-lg p-2 text-center" style={{ background: '#0a0e1a', border: '1px solid var(--border)' }}>
              <div className="text-[14px] font-black font-mono" style={{ color: '#f97316' }}>{hotLeads}</div>
              <div className="text-[8px] uppercase tracking-wider" style={{ color: '#334155' }}>Hot</div>
            </div>
          </div>
        </div>

        {/* Online Status */}
        <div className="px-4 py-3" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: backendOnline ? '#10b981' : backendOnline === null ? '#f59e0b' : '#ef4444' }}
            />
            <span
              className="text-[10px] font-semibold"
              style={{ color: backendOnline ? '#10b981' : backendOnline === null ? '#f59e0b' : '#ef4444' }}
            >
              {backendOnline ? 'Backend Connected' : backendOnline === null ? 'Connecting...' : 'Dashboard Online'}
            </span>
          </div>
          <div className="text-[9px]" style={{ color: '#334155', fontFamily: 'JetBrains Mono, monospace' }}>
            Sync uptime: {fmtUptime(uptime)}
          </div>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header
          className="shrink-0 px-8 pt-5 pb-4 flex items-center justify-between"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div>
            <div className="text-[10px] tracking-[0.3em] uppercase mb-1"
              style={{ color: '#6366f1', fontFamily: 'JetBrains Mono, monospace' }}>
              FXGLOBE AI AUTOMATION SUITE
            </div>
            <h1 className="text-[1.75rem] font-bold tracking-tight leading-none">
              <span className="text-white">Operational </span>
              <span style={{ color: '#a78bfa' }}>Nexus.</span>
            </h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Quick stats */}
            <div className="hidden xl:flex items-center gap-3 mr-2">
              {[
                { label: 'Pipeline', value: totalLeads, color: '#6366f1' },
                { label: 'Hot', value: hotLeads, color: '#f97316' },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg"
                  style={{ background: s.color + '0a', border: `1px solid ${s.color}22` }}>
                  <span className="text-[14px] font-black font-mono" style={{ color: s.color }}>{s.value}</span>
                  <span className="text-[9px] uppercase tracking-wider" style={{ color: '#475569' }}>{s.label}</span>
                </div>
              ))}
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v) => !v)}
                className="relative p-2 rounded-lg transition-all hover:bg-white/[0.05]"
                style={{ color: '#475569' }}
              >
                <Bell size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white"
                    style={{ background: '#ef4444', boxShadow: '0 0 8px #ef444488' }}>
                    {unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <NotificationPanel
                    notifications={notifications}
                    onClose={() => setShowNotifications(false)}
                    onMarkRead={markNotificationRead}
                  />
                )}
              </AnimatePresence>
            </div>

            {/* Clock */}
            <div className="text-right">
              <div className="text-2xl font-bold text-white tracking-tight leading-none"
                style={{ fontFamily: 'JetBrains Mono, monospace' }}>
                {timeStr}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: '#475569' }}>{dateStr}</div>
              <div className="text-[10px]" style={{ color: '#475569' }}>Account Manager · FXGLOBE</div>
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
              {launching ? 'Launching...' : 'Launch Suite'}
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
              {activeView === 'revenue'   && <RevenueView />}
              {activeView === 'ai'        && <AIInsightsView />}
              {activeView === 'clients'   && <ClientsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
