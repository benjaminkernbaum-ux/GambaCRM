import React, { useState } from 'react';
import { Users, Menu, X, RefreshCcw } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from './types';
import { PipelineView } from './PipelineView';

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-zinc-950 text-zinc-100 overflow-hidden font-sans">

      {/* Sidebar */}
      <aside className={cn(
        'flex flex-col bg-zinc-950 border-r border-white/5 transition-all duration-300 flex-shrink-0',
        sidebarOpen ? 'w-56' : 'w-16',
      )}>
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-white/5 gap-3">
          <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30 shrink-0">
            <RefreshCcw size={16} className="text-purple-400" />
          </div>
          {sidebarOpen && (
            <div>
              <div className="text-sm font-black tracking-tight">GAMBA CRM</div>
              <div className="text-[9px] font-mono text-zinc-600 uppercase tracking-widest">Lead Pipeline</div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1">
          <button className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all text-sm',
            'bg-purple-500/15 text-purple-300 border border-purple-500/20',
          )}>
            <Users size={17} className="shrink-0" />
            {sidebarOpen && <span className="font-medium">Lead Pipeline</span>}
            {sidebarOpen && (
              <span className="ml-auto text-[9px] font-mono bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded-full">
                LIVE
              </span>
            )}
          </button>
        </nav>

        {/* Agent badge */}
        {sidebarOpen && (
          <div className="p-3 border-t border-white/5">
            <div className="flex items-center gap-2 px-2 py-2 rounded-xl bg-white/5 border border-white/5">
              <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center text-[11px] font-black text-purple-300">B</div>
              <div>
                <div className="text-xs font-bold">Benjamin</div>
                <div className="text-[9px] text-neon-green font-mono">Supervisor</div>
              </div>
            </div>
          </div>
        )}
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-white/5 bg-zinc-950/80 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen((o) => !o)}
              className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 transition-colors"
            >
              {sidebarOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <div>
              <h1 className="text-sm font-bold text-zinc-200">Lead Pipeline</h1>
              <p className="text-[10px] font-mono text-zinc-600">CRM GAMBA · Automação de Leads</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neon-green/10 border border-neon-green/20">
              <div className="w-1.5 h-1.5 rounded-full bg-neon-green animate-pulse" />
              <span className="text-[10px] font-mono text-neon-green font-bold">SYNC ATIVO</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 scrollbar-hide">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.18 }}
          >
            <PipelineView />
          </motion.div>
        </main>
      </div>
    </div>
  );
}
