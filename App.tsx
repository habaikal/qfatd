
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  TrendingUp, 
  Activity, 
  Settings, 
  Terminal, 
  Play, 
  Square, 
  RefreshCcw,
  Zap,
  BarChart3,
  LayoutDashboard,
  Cpu,
  Bot,
  AlertCircle,
  Key,
  Globe,
  Link,
  ShieldCheck,
  Power,
  ChevronRight,
  Sliders,
  CheckCircle2
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import GlassCard from './components/GlassCard';
import StatusBadge from './components/StatusBadge';
import { AlgorithmStatus, TradingAlgorithm, PortfolioHistory, LogEntry, BrokerConnection, StrategyConfig } from './types';
import { getMarketAnalysis } from './services/geminiService';

const INITIAL_ALGORITHMS: TradingAlgorithm[] = [
  { 
    id: '1', name: 'Alpha Arbitrage', strategyType: 'Arbitrage', status: AlgorithmStatus.RUNNING, profit: 12.5, winRate: 72, tradesCount: 142, lastExecution: '2 mins ago',
    config: { riskTolerance: 30, leverage: 1, stopLoss: 2, takeProfit: 5, indicators: ['RSI', 'VWAP'], maxDrawdown: 10 }
  },
  { 
    id: '2', name: 'Momentum Scalper', strategyType: 'Scalping', status: AlgorithmStatus.RUNNING, profit: 4.8, winRate: 64, tradesCount: 89, lastExecution: '1 min ago',
    config: { riskTolerance: 80, leverage: 5, stopLoss: 0.5, takeProfit: 1.5, indicators: ['EMA20', 'MACD'], maxDrawdown: 15 }
  },
  { 
    id: '3', name: 'RSI Reversion', strategyType: 'Mean Reversion', status: AlgorithmStatus.STOPPED, profit: -1.2, winRate: 48, tradesCount: 56, lastExecution: '2 days ago',
    config: { riskTolerance: 50, leverage: 2, stopLoss: 3, takeProfit: 10, indicators: ['RSI', 'Bollinger'], maxDrawdown: 12 }
  },
  { 
    id: '4', name: 'Grid Bot BTC', strategyType: 'Grid', status: AlgorithmStatus.RUNNING, profit: 22.1, winRate: 81, tradesCount: 312, lastExecution: 'Just now',
    config: { riskTolerance: 20, leverage: 1, stopLoss: 5, takeProfit: 20, indicators: ['ATR'], maxDrawdown: 25 }
  },
];

const PORTFOLIO_DATA: PortfolioHistory[] = [
  { time: '09:00', balance: 50000 },
  { time: '10:00', balance: 50400 },
  { time: '11:00', balance: 50200 },
  { time: '12:00', balance: 51200 },
  { time: '13:00', balance: 51800 },
  { time: '14:00', balance: 51500 },
  { time: '15:00', balance: 52400 },
  { time: '16:00', balance: 53100 },
];

const AVAILABLE_INDICATORS = ['RSI', 'MACD', 'VWAP', 'EMA20', 'EMA50', 'SMA200', 'Bollinger Bands', 'ATR', 'Ichimoku', 'Stochastic'];

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [algorithms, setAlgorithms] = useState<TradingAlgorithm[]>(INITIAL_ALGORITHMS);
  const [selectedAlgId, setSelectedAlgId] = useState<string | null>(INITIAL_ALGORITHMS[0].id);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [aiInsight, setAiInsight] = useState<string>('Initializing AI analysis...');
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const [broker, setBroker] = useState<BrokerConnection>({
    id: 'kis-01',
    name: 'Korea Investment',
    status: 'CONNECTED',
    apiKey: '••••••••••••••••',
    apiSecret: '••••••••••••••••',
    accountNumber: '50012345-01',
    lastPing: '34ms'
  });

  const selectedAlgorithm = useMemo(() => 
    algorithms.find(a => a.id === selectedAlgId) || null, 
  [algorithms, selectedAlgId]);

  const addLog = useCallback((message: string, type: LogEntry['type'] = 'INFO') => {
    const newLog: LogEntry = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  }, []);

  const totalProfit = useMemo(() => algorithms.reduce((acc, curr) => acc + curr.profit, 0), [algorithms]);
  const activeBots = useMemo(() => algorithms.filter(a => a.status === AlgorithmStatus.RUNNING).length, [algorithms]);

  const toggleAlgorithm = (id: string) => {
    if (broker.status !== 'CONNECTED') {
      addLog('Cannot toggle bot: Broker API disconnected', 'ERROR');
      return;
    }
    setAlgorithms(prev => prev.map(alg => {
      if (alg.id === id) {
        const newStatus = alg.status === AlgorithmStatus.RUNNING ? AlgorithmStatus.STOPPED : AlgorithmStatus.RUNNING;
        addLog(`Sent API Request to ${broker.name}: SET_STATUS ${newStatus} for ${alg.name}`, 'API');
        addLog(`${alg.name} status updated via Broker API`, newStatus === AlgorithmStatus.RUNNING ? 'SUCCESS' : 'WARNING');
        return { ...alg, status: newStatus };
      }
      return alg;
    }));
  };

  const updateConfig = (field: keyof StrategyConfig, value: any) => {
    if (!selectedAlgId) return;
    setAlgorithms(prev => prev.map(alg => {
      if (alg.id === selectedAlgId) {
        return {
          ...alg,
          config: { ...alg.config, [field]: value }
        };
      }
      return alg;
    }));
    addLog(`Updated ${field} for ${selectedAlgorithm?.name}`, 'INFO');
  };

  const toggleIndicator = (indicator: string) => {
    if (!selectedAlgorithm) return;
    const current = selectedAlgorithm.config.indicators;
    const next = current.includes(indicator) 
      ? current.filter(i => i !== indicator)
      : [...current, indicator];
    updateConfig('indicators', next);
  };

  const handleConnectBroker = () => {
    setBroker(prev => ({ ...prev, status: 'CONNECTING' }));
    addLog(`Initiating OAuth2 handshake with ${broker.name} API...`, 'API');
    setTimeout(() => {
      setBroker(prev => ({ ...prev, status: 'CONNECTED', lastPing: '28ms' }));
      addLog(`${broker.name} API connection re-established successfully.`, 'SUCCESS');
    }, 2000);
  };

  const refreshInsights = async () => {
    setIsRefreshing(true);
    setAiInsight('Analyzing current market conditions and account status...');
    const insight = await getMarketAnalysis(PORTFOLIO_DATA, { algorithms, totalProfit, brokerStatus: broker.status });
    setAiInsight(insight || 'Unable to fetch insight.');
    setIsRefreshing(false);
  };

  useEffect(() => {
    addLog('System started. All modules loaded.', 'INFO');
    addLog(`Connected to Brokerage API: ${broker.name} (${broker.accountNumber})`, 'API');
    refreshInsights();
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      {/* Sidebar */}
      <aside className="w-20 md:w-64 glass border-r border-white/10 flex flex-col p-4 z-20 transition-all duration-300">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg animate-glow">
            <Zap className="text-white w-6 h-6" />
          </div>
          <span className="hidden md:block font-bold text-xl tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
            QuantFlow AI
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {[
            { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { id: 'algorithms', icon: Bot, label: 'Algorithms' },
            { id: 'analytics', icon: BarChart3, label: 'Analytics' },
            { id: 'brokerage', icon: Link, label: 'Brokerage API' },
            { id: 'logs', icon: Terminal, label: 'System Logs' },
            { id: 'settings', icon: Settings, label: 'Settings' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-3 rounded-xl transition-all duration-200 ${
                activeTab === item.id 
                ? 'bg-blue-600/20 text-blue-400 border border-blue-600/30' 
                : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className="w-6 h-6 shrink-0" />
              <span className="hidden md:block font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="mt-auto glass-hover rounded-2xl p-4 cursor-pointer hidden md:block">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-blue-400" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">Security Mode</span>
              <span className="text-xs text-slate-400">AES-256 Enabled</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-y-auto relative p-4 md:p-8 space-y-6">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] pointer-events-none -z-10 rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] pointer-events-none -z-10 rounded-full"></div>

        {/* Header Stats */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white capitalize">{activeTab}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-2 h-2 rounded-full ${broker.status === 'CONNECTED' ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
              <p className="text-slate-400 text-sm">Broker: {broker.name} ({broker.status})</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-3">
              <TrendingUp className="text-emerald-400 w-5 h-5" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">Account Balance</p>
                <p className="text-sm font-bold text-white">${PORTFOLIO_DATA[PORTFOLIO_DATA.length-1].balance.toLocaleString()}</p>
              </div>
            </div>
            <div className="glass px-4 py-2 rounded-xl flex items-center gap-3 border-emerald-500/20">
              <Globe className="text-blue-400 w-5 h-5" />
              <div>
                <p className="text-[10px] text-slate-400 uppercase font-bold">API Latency</p>
                <p className="text-sm font-bold text-blue-400">{broker.lastPing}</p>
              </div>
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <GlassCard className="lg:col-span-2 min-h-[400px]" title="Portfolio Tracking (Live API)">
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={PORTFOLIO_DATA}>
                    <defs>
                      <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.3)" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard 
              className="lg:col-span-1 border-blue-500/20" 
              title="QuantAI Advisor"
              action={
                <button 
                  onClick={refreshInsights}
                  disabled={isRefreshing}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <RefreshCcw className={`w-4 h-4 text-slate-400 ${isRefreshing ? 'animate-spin' : ''}`} />
                </button>
              }
            >
              <div className="space-y-4">
                <div className="bg-blue-600/10 rounded-xl p-4 border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-blue-400" />
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Broker Context Analysis</span>
                  </div>
                  <p className="text-sm text-slate-300 leading-relaxed italic">
                    "{aiInsight}"
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase">Broker Info</h4>
                  <div className="text-xs space-y-2">
                    <div className="flex justify-between text-slate-400">
                      <span>Endpoint Status:</span>
                      <span className="text-emerald-400 font-bold">Stable</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Rate Limit:</span>
                      <span>240/1000 req/min</span>
                    </div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
              {algorithms.map(alg => (
                <GlassCard key={alg.id} className="glass-hover flex flex-col justify-between group">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-bold text-lg group-hover:text-blue-400 transition-colors">{alg.name}</h4>
                      <p className="text-xs text-slate-400">{alg.strategyType}</p>
                    </div>
                    <StatusBadge status={alg.status} />
                  </div>
                  <div className="flex items-center justify-between mt-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 uppercase font-bold">Bot Control</span>
                      <span className="text-xs">Linked to {broker.name} API</span>
                    </div>
                    <button 
                      onClick={() => toggleAlgorithm(alg.id)}
                      className={`p-2 rounded-lg transition-all ${
                        alg.status === AlgorithmStatus.RUNNING 
                        ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30' 
                        : 'bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30'
                      }`}
                    >
                      {alg.status === AlgorithmStatus.RUNNING ? <Square size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" />}
                    </button>
                  </div>
                </GlassCard>
              ))}
            </div>

            <GlassCard className="lg:col-span-1" title="API Transmission Feed">
              <div className="space-y-3 h-[280px] overflow-y-auto pr-2 custom-scrollbar">
                {logs.map(log => (
                  <div key={log.id} className="flex gap-2 text-[11px] border-b border-white/5 pb-2 last:border-0">
                    <span className={`font-bold uppercase ${
                      log.type === 'API' ? 'text-blue-400' : 
                      log.type === 'SUCCESS' ? 'text-emerald-400' : 'text-slate-400'
                    }`}>{log.type}</span>
                    <span className="text-slate-300">{log.message}</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'algorithms' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Algorithm Sidebar List */}
            <div className="lg:col-span-4 space-y-4">
              <GlassCard title="Active Network">
                <div className="space-y-2">
                  {algorithms.map(alg => (
                    <button
                      key={alg.id}
                      onClick={() => setSelectedAlgId(alg.id)}
                      className={`w-full text-left p-4 rounded-xl transition-all border flex items-center justify-between group ${
                        selectedAlgId === alg.id 
                        ? 'bg-blue-600/20 border-blue-500/50 text-white' 
                        : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10'
                      }`}
                    >
                      <div>
                        <p className="font-bold text-sm">{alg.name}</p>
                        <p className="text-[10px] uppercase tracking-wider font-semibold opacity-60">{alg.strategyType}</p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedAlgId === alg.id ? 'translate-x-1' : 'opacity-0'}`} />
                    </button>
                  ))}
                </div>
              </GlassCard>
              <GlassCard title="Add Strategy" className="flex items-center justify-center py-10 opacity-60 hover:opacity-100 transition-opacity cursor-pointer">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-2">
                    <Bot className="w-6 h-6 text-slate-400" />
                  </div>
                  <span className="text-sm font-bold">New Custom Bot</span>
                </div>
              </GlassCard>
            </div>

            {/* Configuration Panel */}
            <div className="lg:col-span-8 space-y-6">
              {selectedAlgorithm ? (
                <>
                  <GlassCard 
                    title={`${selectedAlgorithm.name} Configuration`}
                    action={
                      <div className="flex gap-2">
                        <StatusBadge status={selectedAlgorithm.status} />
                        <button 
                          onClick={() => toggleAlgorithm(selectedAlgorithm.id)}
                          className={`p-2 rounded-lg ${selectedAlgorithm.status === AlgorithmStatus.RUNNING ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}
                        >
                          {selectedAlgorithm.status === AlgorithmStatus.RUNNING ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                        </button>
                      </div>
                    }
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Risk Section */}
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-blue-400 uppercase tracking-widest">
                          <Sliders className="w-4 h-4" /> Risk Management
                        </h4>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-xs font-semibold">
                            <span className="text-slate-400">Risk Tolerance</span>
                            <span className="text-white">{selectedAlgorithm.config.riskTolerance}%</span>
                          </div>
                          <input 
                            type="range" min="1" max="100" 
                            value={selectedAlgorithm.config.riskTolerance}
                            onChange={(e) => updateConfig('riskTolerance', parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500" 
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-bold uppercase">Leverage (x)</label>
                            <input 
                              type="number" 
                              value={selectedAlgorithm.config.leverage}
                              onChange={(e) => updateConfig('leverage', parseFloat(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-bold uppercase">Max Drawdown (%)</label>
                            <input 
                              type="number" 
                              value={selectedAlgorithm.config.maxDrawdown}
                              onChange={(e) => updateConfig('maxDrawdown', parseFloat(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" 
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-bold uppercase">Stop Loss (%)</label>
                            <input 
                              type="number" step="0.1"
                              value={selectedAlgorithm.config.stopLoss}
                              onChange={(e) => updateConfig('stopLoss', parseFloat(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" 
                            />
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] text-slate-400 font-bold uppercase">Take Profit (%)</label>
                            <input 
                              type="number" step="0.1"
                              value={selectedAlgorithm.config.takeProfit}
                              onChange={(e) => updateConfig('takeProfit', parseFloat(e.target.value))}
                              className="w-full bg-white/5 border border-white/10 rounded-lg p-2 text-white focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" 
                            />
                          </div>
                        </div>
                      </div>

                      {/* Indicators Section */}
                      <div className="space-y-6">
                        <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-400 uppercase tracking-widest">
                          <Activity className="w-4 h-4" /> Signal Indicators
                        </h4>
                        
                        <div className="flex flex-wrap gap-2">
                          {AVAILABLE_INDICATORS.map(indicator => {
                            const active = selectedAlgorithm.config.indicators.includes(indicator);
                            return (
                              <button
                                key={indicator}
                                onClick={() => toggleIndicator(indicator)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                                  active 
                                  ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-300' 
                                  : 'bg-white/5 border-white/10 text-slate-500 hover:text-slate-300'
                                }`}
                              >
                                {active && <CheckCircle2 className="w-3 h-3" />}
                                {indicator}
                              </button>
                            );
                          })}
                        </div>

                        <div className="p-4 bg-indigo-600/10 border border-indigo-500/20 rounded-xl">
                          <h5 className="text-xs font-bold text-indigo-400 mb-2 uppercase tracking-wider">Indicator Logic</h5>
                          <p className="text-[11px] text-slate-400 leading-relaxed italic">
                            The bot will confirm entries only when all selected indicators provide a confluent signal. More indicators generally lead to fewer, higher-quality trades.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-white/10 flex justify-end">
                      <button className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20">
                        Apply Changes to Live Bot
                      </button>
                    </div>
                  </GlassCard>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <GlassCard title="Recent Performance">
                       <div className="flex items-end gap-2 h-24">
                          {[60, 40, 70, 90, 50, 80, 45].map((h, i) => (
                            <div key={i} className="flex-1 bg-blue-500/20 rounded-t-sm relative group">
                              <div 
                                className="absolute bottom-0 left-0 right-0 bg-blue-500/60 rounded-t-sm transition-all" 
                                style={{ height: `${h}%` }}
                              ></div>
                            </div>
                          ))}
                       </div>
                       <p className="text-center text-[10px] text-slate-500 mt-2 uppercase font-bold tracking-widest">7-Day Profit Distribution</p>
                    </GlassCard>
                    <GlassCard title="Safety Guard">
                       <div className="space-y-4">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Trading Window</span>
                            <span className="text-white font-mono">24/7 (Global)</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-slate-400">Safety Multiplier</span>
                            <span className="text-emerald-400 font-bold">ACTIVE (1.2x)</span>
                          </div>
                       </div>
                    </GlassCard>
                  </div>
                </>
              ) : (
                <GlassCard className="h-full flex flex-col items-center justify-center py-40">
                  <Bot className="w-16 h-16 text-slate-700 mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold text-slate-500">Select an algorithm to configure</h3>
                </GlassCard>
              )}
            </div>
          </div>
        )}

        {activeTab === 'brokerage' && (
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <GlassCard title="Brokerage API Configuration">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Select Provider</label>
                    <select className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option>Korea Investment & Securities</option>
                      <option>Kiwoom Securities</option>
                      <option>E-Trade / Ebest</option>
                      <option>Binance (Futures)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">API Key</label>
                    <div className="relative">
                      <input 
                        type="password" 
                        value={broker.apiKey}
                        readOnly
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white pr-10" 
                      />
                      <Key className="absolute right-3 top-3.5 w-4 h-4 text-slate-500" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Secret Key</label>
                    <input 
                      type="password" 
                      value={broker.apiSecret}
                      readOnly
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" 
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Account Number</label>
                    <input 
                      type="text" 
                      value={broker.accountNumber}
                      readOnly
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" 
                    />
                  </div>
                  <div className="p-4 bg-blue-600/10 border border-blue-500/20 rounded-xl">
                    <h4 className="text-sm font-bold text-blue-400 mb-2 flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4" /> Integration Health
                    </h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Your keys are stored locally using AES-256 encryption. Our backend only uses these to proxy orders to the official brokerage endpoints.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={handleConnectBroker}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                    >
                      <RefreshCcw className={`w-4 h-4 ${broker.status === 'CONNECTING' ? 'animate-spin' : ''}`} />
                      {broker.status === 'CONNECTED' ? 'Reconnect' : 'Connect API'}
                    </button>
                    <button className="px-4 py-3 bg-rose-600/20 text-rose-400 hover:bg-rose-600/30 rounded-xl font-bold transition-all">
                      <Power className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </GlassCard>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <GlassCard title="Websocket" className="flex flex-col items-center py-8">
                <div className={`p-4 rounded-full mb-3 ${broker.status === 'CONNECTED' ? 'bg-emerald-400/10 text-emerald-400' : 'bg-slate-500/10 text-slate-500'}`}>
                  <Activity className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold">Real-time Data</p>
                <p className="text-xs text-slate-400">Status: {broker.status}</p>
              </GlassCard>
              <GlassCard title="Orders" className="flex flex-col items-center py-8">
                <div className="p-4 rounded-full mb-3 bg-blue-400/10 text-blue-400">
                  <Cpu className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold">Execution Engine</p>
                <p className="text-xs text-slate-400">Ready for Orders</p>
              </GlassCard>
              <GlassCard title="Rate Limit" className="flex flex-col items-center py-8">
                <div className="p-4 rounded-full mb-3 bg-amber-400/10 text-amber-400">
                  <AlertCircle className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold">Throttling</p>
                <p className="text-xs text-slate-400">760 req remaining</p>
              </GlassCard>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <GlassCard title="Total Trades" className="py-6">
              <div className="text-3xl font-bold text-white mb-2">619</div>
              <div className="text-sm text-emerald-400 flex items-center gap-1">+12% vs last month</div>
            </GlassCard>
            <GlassCard title="Win Rate" className="py-6">
              <div className="text-3xl font-bold text-white mb-2">68.4%</div>
              <div className="text-sm text-emerald-400 flex items-center gap-1">+2.1% vs last month</div>
            </GlassCard>
            <GlassCard title="Profit Factor" className="py-6">
              <div className="text-3xl font-bold text-white mb-2">1.82</div>
              <div className="text-sm text-emerald-400 flex items-center gap-1">+0.15 vs last month</div>
            </GlassCard>
            <GlassCard title="Max Drawdown" className="py-6">
              <div className="text-3xl font-bold text-rose-400 mb-2">12.5%</div>
              <div className="text-sm text-slate-400 flex items-center gap-1">Optimal range</div>
            </GlassCard>
            
            <GlassCard title="Monthly Performance" className="col-span-1 md:col-span-2 lg:col-span-4 min-h-[400px]">
              <div className="h-[300px] w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Jan', profit: 4000 },
                    { name: 'Feb', profit: 3000 },
                    { name: 'Mar', profit: 5500 },
                    { name: 'Apr', profit: 4500 },
                    { name: 'May', profit: 6000 },
                    { name: 'Jun', profit: 7500 },
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="rgba(255,255,255,0.3)" />
                    <YAxis stroke="rgba(255,255,255,0.3)" tickFormatter={(val) => `$${val}`} />
                    <Tooltip 
                      cursor={{fill: 'rgba(255,255,255,0.05)'}}
                      contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="profit" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        )}

        {activeTab === 'logs' && (
          <GlassCard title="System Logs & Audit Trail" className="h-full min-h-[600px] flex flex-col">
            <div className="flex gap-4 mb-6">
              <input type="text" placeholder="Search logs..." className="bg-white/5 border border-white/10 rounded-xl p-3 text-white flex-1 focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select className="bg-white/5 border border-white/10 rounded-xl p-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48">
                <option value="ALL">All Levels</option>
                <option value="INFO">Info</option>
                <option value="API">API</option>
                <option value="SUCCESS">Success</option>
                <option value="ERROR">Error</option>
                <option value="WARNING">Warning</option>
              </select>
            </div>
            <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4 overflow-y-auto font-mono text-sm space-y-2 relative">
              {logs.length > 0 ? logs.map(log => (
                <div key={log.id} className="flex gap-4 border-b border-white/5 pb-2 last:border-0 hover:bg-white/5 p-1 rounded transition-colors">
                  <span className="text-slate-500 whitespace-nowrap">{log.timestamp}</span>
                  <span className={`font-bold w-20 shrink-0 ${
                    log.type === 'API' ? 'text-blue-400' : 
                    log.type === 'SUCCESS' ? 'text-emerald-400' : 
                    log.type === 'ERROR' ? 'text-rose-400' :
                    log.type === 'WARNING' ? 'text-amber-400' : 'text-slate-400'
                  }`}>{log.type}</span>
                  <span className="text-slate-300 break-all">{log.message}</span>
                </div>
              )) : (
                <div className="absolute inset-0 flex items-center justify-center text-slate-500">
                  No logs available.
                </div>
              )}
            </div>
          </GlassCard>
        )}

        {activeTab === 'settings' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto w-full">
            <GlassCard title="Risk Bounds (Global)">
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Global Stop Loss (%)</label>
                  <input type="number" defaultValue="15" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
                  <p className="text-[10px] text-slate-500 mt-1">Halt all trading if portfolio drops by this amount in 24h.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Max Daily Trades</label>
                  <input type="number" defaultValue="500" className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white" />
                </div>
                <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10 mt-6">
                  <div>
                    <h5 className="font-bold text-sm text-white">Emergency Kill Switch</h5>
                    <p className="text-[10px] text-slate-400 mt-1">Immediately close all open positions.</p>
                  </div>
                  <button className="px-4 py-2 bg-rose-600/20 text-rose-400 hover:bg-rose-600/40 rounded-lg text-xs font-bold transition-all border border-rose-500/30">
                    LIQUIDATE ALL
                  </button>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="Notifications & Alerts">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                  <div>
                    <h5 className="text-sm font-bold text-white">Trade Executions</h5>
                    <p className="text-xs text-slate-400">Notify on every filled order</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full flex items-center p-1 justify-end">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                  <div>
                    <h5 className="text-sm font-bold text-white">Error Alerts</h5>
                    <p className="text-xs text-slate-400">Critical API or strategy failures</p>
                  </div>
                  <div className="w-10 h-6 bg-blue-600 rounded-full flex items-center p-1 justify-end">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 hover:bg-white/5 rounded-lg transition-colors cursor-pointer">
                  <div>
                    <h5 className="text-sm font-bold text-white">Summary Reports</h5>
                    <p className="text-xs text-slate-400">Daily PnL via Email</p>
                  </div>
                  <div className="w-10 h-6 bg-white/10 rounded-full flex items-center p-1">
                    <div className="w-4 h-4 bg-slate-400 rounded-full"></div>
                  </div>
                </div>
              </div>
            </GlassCard>

            <GlassCard title="System Update" className="md:col-span-2">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h5 className="text-sm font-bold text-white mb-1">QuantFlow Engine v2.4.1</h5>
                  <p className="text-xs text-slate-400">System is up to date. Next maintenance Sunday 02:00 UTC.</p>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-all border border-white/10 text-sm whitespace-nowrap outline-none">
                  Check for Updates
                </button>
              </div>
            </GlassCard>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
