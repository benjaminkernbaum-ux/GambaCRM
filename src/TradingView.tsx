import React, { useEffect, useRef, useState } from 'react';
import { TrendingUp, BarChart2, Globe, RefreshCw, ExternalLink, Activity } from 'lucide-react';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadScript(src: string): Promise<void> {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
    const s = document.createElement('script');
    s.src = src; s.async = true;
    s.onload = () => resolve();
    document.head.appendChild(s);
  });
}

// ─── Advanced Chart ───────────────────────────────────────────────────────────

const PAIRS = [
  { symbol: 'FX:EURUSD', label: 'EUR/USD' },
  { symbol: 'FX:GBPUSD', label: 'GBP/USD' },
  { symbol: 'FX:USDBRL', label: 'USD/BRL' },
  { symbol: 'FX:GBPBRL', label: 'GBP/BRL' },
  { symbol: 'FX:XAUUSD', label: 'Gold' },
  { symbol: 'CRYPTO:BTCUSD', label: 'BTC/USD' },
];

function AdvancedChart() {
  const [activePair, setActivePair] = useState(PAIRS[0]);
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetRef    = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!widgetRef.current) return;
    widgetRef.current.innerHTML = '';

    loadScript('https://s3.tradingview.com/tv.js').then(() => {
      if (!widgetRef.current) return;
      // @ts-ignore
      new (window as any).TradingView.widget({
        container_id:  widgetRef.current.id,
        symbol:        activePair.symbol,
        interval:      'D',
        timezone:      'America/Sao_Paulo',
        theme:         'dark',
        style:         '1',
        locale:        'br',
        toolbar_bg:    '#05050f',
        enable_publishing: false,
        hide_top_toolbar:  false,
        hide_legend:       false,
        save_image:        false,
        backgroundColor:   '#05050f',
        gridColor:         '#1a1a35',
        width:  '100%',
        height: 460,
        studies: ['RSI@tv-basicstudies', 'MACD@tv-basicstudies'],
        withdateranges: true,
        allow_symbol_change: true,
        watchlist: PAIRS.map((p) => p.symbol),
        details: true,
        hotlist: false,
        calendar: false,
      });
    });
  }, [activePair]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
      {/* Header + pair selector */}
      <div className="flex items-center gap-3 px-5 py-3" style={{ borderBottom: '1px solid #1a1a35' }}>
        <TrendingUp size={14} style={{ color: '#6366f1' }} />
        <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>Live Chart</span>
        <div className="flex items-center gap-1 ml-3 flex-wrap">
          {PAIRS.map((p) => (
            <button
              key={p.symbol}
              onClick={() => setActivePair(p)}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all"
              style={
                activePair.symbol === p.symbol
                  ? { background: '#6366f1', color: '#fff' }
                  : { background: '#1a1a35', color: '#475569' }
              }
            >
              {p.label}
            </button>
          ))}
        </div>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${activePair.symbol}`}
          target="_blank" rel="noreferrer"
          className="ml-auto flex items-center gap-1 text-[10px] font-semibold"
          style={{ color: '#334155' }}
        >
          Open in TradingView <ExternalLink size={10} />
        </a>
      </div>
      {/* Widget */}
      <div ref={containerRef}>
        <div id="tv-advanced-chart" ref={widgetRef} />
      </div>
    </div>
  );
}

// ─── Ticker Tape ──────────────────────────────────────────────────────────────

function TickerTape() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'FX:EURUSD',      title: 'EUR/USD' },
        { proName: 'FX:GBPUSD',      title: 'GBP/USD' },
        { proName: 'FX:USDBRL',      title: 'USD/BRL' },
        { proName: 'FX:GBPBRL',      title: 'GBP/BRL' },
        { proName: 'FX:XAUUSD',      title: 'Gold'    },
        { proName: 'CRYPTO:BTCUSD',  title: 'BTC'     },
        { proName: 'CRYPTO:ETHUSD',  title: 'ETH'     },
        { proName: 'NASDAQ:SPY',     title: 'S&P 500' },
      ],
      showSymbolLogo: true,
      colorTheme: 'dark',
      isTransparent: true,
      displayMode: 'adaptive',
      locale: 'br',
    });
    ref.current.appendChild(script);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#05050f', border: '1px solid #1a1a35', minHeight: 56 }}>
      <div className="tradingview-widget-container" ref={ref}>
        <div className="tradingview-widget-container__widget" />
      </div>
    </div>
  );
}

// ─── Market Overview ──────────────────────────────────────────────────────────

function MarketOverview() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      dateRange: '1D',
      showChart: true,
      locale: 'br',
      largeChartUrl: '',
      isTransparent: true,
      showSymbolLogo: true,
      showFloatingTooltip: true,
      width: '100%',
      height: 420,
      plotLineColorGrowing: '#6366f1',
      plotLineColorFalling: '#ef4444',
      gridLineColor:        '#1a1a35',
      scaleFontColor:       '#475569',
      belowLineFillColorGrowing:       '#6366f111',
      belowLineFillColorFalling:       '#ef444411',
      belowLineFillColorGrowingBottom: 'transparent',
      belowLineFillColorFallingBottom: 'transparent',
      symbolActiveColor: '#6366f122',
      tabs: [
        {
          title: 'Forex',
          symbols: [
            { s: 'FX:EURUSD', d: 'EUR/USD' },
            { s: 'FX:GBPUSD', d: 'GBP/USD' },
            { s: 'FX:USDBRL', d: 'USD/BRL' },
            { s: 'FX:GBPBRL', d: 'GBP/BRL' },
            { s: 'FX:USDJPY', d: 'USD/JPY' },
            { s: 'FX:XAUUSD', d: 'Gold'    },
          ],
          originalTitle: 'Forex',
        },
        {
          title: 'Crypto',
          symbols: [
            { s: 'CRYPTO:BTCUSD', d: 'Bitcoin'  },
            { s: 'CRYPTO:ETHUSD', d: 'Ethereum' },
            { s: 'CRYPTO:SOLUSD', d: 'Solana'   },
          ],
          originalTitle: 'Crypto',
        },
        {
          title: 'Indices',
          symbols: [
            { s: 'FOREXCOM:SPXUSD', d: 'S&P 500' },
            { s: 'FOREXCOM:NSXUSD', d: 'Nasdaq'  },
            { s: 'BMFBOVESPA:IBOV', d: 'Bovespa' },
          ],
          originalTitle: 'Indices',
        },
      ],
    });
    wrapper.appendChild(inner);
    wrapper.appendChild(script);
    ref.current.appendChild(wrapper);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1a1a35' }}>
        <Globe size={14} style={{ color: '#6366f1' }} />
        <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#6366f1' }}>Market Overview</span>
        <div className="w-2 h-2 rounded-full animate-pulse ml-auto" style={{ background: '#10b981' }} />
      </div>
      <div ref={ref} />
    </div>
  );
}

// ─── Economic Calendar ────────────────────────────────────────────────────────

function EconomicCalendar() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = '';
    const wrapper = document.createElement('div');
    wrapper.className = 'tradingview-widget-container';
    const inner = document.createElement('div');
    inner.className = 'tradingview-widget-container__widget';
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      isTransparent: true,
      width: '100%',
      height: 420,
      locale: 'br',
      importanceFilter: '0,1',
      countryFilter: 'us,eu,gb,br,jp',
    });
    wrapper.appendChild(inner);
    wrapper.appendChild(script);
    ref.current.appendChild(wrapper);
  }, []);

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: '#05050f', border: '1px solid #1a1a35' }}>
      <div className="px-5 py-3 flex items-center gap-2" style={{ borderBottom: '1px solid #1a1a35' }}>
        <Activity size={14} style={{ color: '#f97316' }} />
        <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: '#f97316' }}>Economic Calendar</span>
      </div>
      <div ref={ref} />
    </div>
  );
}

// ─── Main TradingView page ─────────────────────────────────────────────────────

export function TradingViewPage() {
  const [tab, setTab] = useState<'chart' | 'market' | 'calendar'>('chart');

  return (
    <div className="p-6 space-y-4" style={{ background: '#05050f', minHeight: '100%' }}>

      {/* Header */}
      <div className="flex items-center gap-4">
        <div>
          <div className="text-[10px] font-mono tracking-[0.3em] uppercase mb-0.5" style={{ color: '#6366f1' }}>
            LIVE MARKET DATA
          </div>
          <h2 className="text-2xl font-black text-white">TradingView</h2>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 rounded-xl p-1 ml-auto" style={{ background: '#0d0d22', border: '1px solid #1a1a35' }}>
          {([
            { id: 'chart',    label: 'Chart',     icon: TrendingUp },
            { id: 'market',   label: 'Markets',   icon: BarChart2  },
            { id: 'calendar', label: 'Calendar',  icon: Activity   },
          ] as const).map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[12px] font-semibold transition-all"
              style={tab === id ? { background: '#6366f1', color: '#fff' } : { color: '#475569' }}
            >
              <Icon size={13} />{label}
            </button>
          ))}
        </div>

        <a
          href="https://www.tradingview.com"
          target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-[11px] font-semibold"
          style={{ background: '#0d0d22', border: '1px solid #1a1a35', color: '#6366f1' }}
        >
          <ExternalLink size={12} /> TradingView.com
        </a>
      </div>

      {/* Ticker tape — always visible */}
      <TickerTape />

      {/* Tab content */}
      {tab === 'chart' && (
        <AdvancedChart />
      )}
      {tab === 'market' && (
        <MarketOverview />
      )}
      {tab === 'calendar' && (
        <EconomicCalendar />
      )}
    </div>
  );
}
