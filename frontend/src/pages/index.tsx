import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { Wallet, RefreshCw, Settings, Zap, Clock, TrendingUp, TrendingDown, Activity, BarChart3, Eye, EyeOff, ArrowDownLeft } from 'lucide-react';
import { useConnectionStatus, useAccount, useTicker, useOpenOrders, useTradeHistory, useAnalysis } from '@/hooks/useApi';
import { ConnectionStatus, PriceDisplay, BalanceDisplay, Spinner } from '@/components/ui';
import { AdvancedChart, RSIChart, MACDChart, SignalCard, VolumeProfileChart, VolumeProfileStats } from '@/components/AdvancedChart';
import { TradingForm } from '@/components/TradingForm';
import { OrdersTable, TradesTable } from '@/components/OrdersTable';
import { ConnectModal } from '@/components/ConnectModal';
import { DepositWithdrawPanel } from '@/components/Deposit';
import { DevInspector, DevButton } from '@/components/DevInspector';

// Available symbols - PAXG only on production, BTC/ETH for testnet
const SYMBOLS = [
  { value: 'BTCUSDT', label: 'BTC/USDT', testnet: true },
  { value: 'ETHUSDT', label: 'ETH/USDT', testnet: true },
  { value: 'PAXGUSDT', label: 'PAXG/USDT (Gold)', testnet: false },
];
const TIMEFRAMES = [
  { value: '1m', label: '1m' }, { value: '5m', label: '5m' }, { value: '15m', label: '15m' },
  { value: '30m', label: '30m' }, { value: '1h', label: '1H' }, { value: '4h', label: '4H' },
  { value: '1d', label: '1D' }, { value: '1w', label: '1W' },
];

export default function Dashboard() {
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [activeTab, setActiveTab] = useState<'orders' | 'trades'>('orders');
  const [currentPage, setCurrentPage] = useState<'trading' | 'deposit'>('trading');
  const [showEMA, setShowEMA] = useState(true);
  const [showBB, setShowBB] = useState(true);
  const [showRSI, setShowRSI] = useState(true);
  const [showMACD, setShowMACD] = useState(true);
  const [showVP, setShowVP] = useState(true);
  const [showDevInspector, setShowDevInspector] = useState(false);
  
  const { configured, environment, loading: statusLoading, refresh: refreshStatus } = useConnectionStatus();
  const { account, loading: accountLoading, error: accountError, refresh: refreshAccount } = useAccount();
  const { ticker, loading: tickerLoading } = useTicker(selectedSymbol, 3000);
  const { analysis, loading: analysisLoading, refresh: refreshAnalysis } = useAnalysis(selectedSymbol, selectedTimeframe, 200);
  const { orders, loading: ordersLoading, refresh: refreshOrders } = useOpenOrders();
  const { trades, loading: tradesLoading, refresh: refreshTrades } = useTradeHistory(selectedSymbol, 20);

  // Check if PAXG is selected but on testnet
  const isTestnet = environment === 'testnet';
  const isPaxgOnTestnet = selectedSymbol === 'PAXGUSDT' && isTestnet;

  useEffect(() => { if (configured) refreshAnalysis(); }, [selectedTimeframe, selectedSymbol, configured]);
  useEffect(() => { if (!statusLoading && !configured) setShowConnectModal(true); }, [statusLoading, configured]);

  const handleRefreshAll = () => { refreshStatus(); refreshAccount(); refreshAnalysis(); refreshOrders(); refreshTrades(); };

  const currentPrice = ticker ? parseFloat(ticker.lastPrice) : 0;
  const priceChange = ticker ? parseFloat(ticker.priceChange) : 0;
  const priceChangePercent = ticker ? parseFloat(ticker.priceChangePercent) : 0;
  const latestIndicators = analysis?.indicators[analysis.indicators.length - 1];
  const latestSignal = analysis?.latest_signal;
  const totalBalance = account?.balances.reduce((t, b) => b.asset === 'USDT' ? t + b.total : t, 0) || 0;

  return (
    <>
      <Head>
        <title>Gold Trading Bot | PAXG</title>
        <meta name="description" content="PAX Gold Trading Bot with CRT + TBS Strategy" />
      </Head>
      <div className="min-h-screen bg-terminal-bg grid-pattern">
        <header className="sticky top-0 z-40 border-b border-terminal-border bg-terminal-bg/80 backdrop-blur-xl">
          <div className="max-w-[1920px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-amber-600 flex items-center justify-center">
                    <Zap className="w-5 h-5 text-black" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold">Trading Bot</h1>
                    <p className="text-xs text-terminal-muted">CRT + TBS Strategy</p>
                  </div>
                </div>
                {/* Symbol Selector */}
                <select
                  value={selectedSymbol}
                  onChange={(e) => setSelectedSymbol(e.target.value)}
                  className="ml-4 px-3 py-1.5 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 font-bold cursor-pointer focus:outline-none"
                >
                  {SYMBOLS.map((s) => (
                    <option key={s.value} value={s.value} disabled={!s.testnet && isTestnet}>
                      {s.label} {!s.testnet && isTestnet ? '(Production only)' : ''}
                    </option>
                  ))}
                </select>
                {/* Navigation Tabs */}
                <div className="ml-6 flex rounded-lg bg-terminal-border/30 p-1">
                  <button
                    onClick={() => setCurrentPage('trading')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${currentPage === 'trading' ? 'bg-terminal-accent text-terminal-bg' : 'text-terminal-muted hover:text-white'}`}
                  >
                    Trading
                  </button>
                  <button
                    onClick={() => setCurrentPage('deposit')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${currentPage === 'deposit' ? 'bg-terminal-accent text-terminal-bg' : 'text-terminal-muted hover:text-white'}`}
                  >
                    <ArrowDownLeft className="w-4 h-4" />
                    Deposit
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={handleRefreshAll} className="p-2 rounded-lg text-terminal-muted hover:text-white hover:bg-terminal-border/50"><RefreshCw className="w-5 h-5" /></button>
                <ConnectionStatus connected={configured} environment={environment} />
                <button onClick={() => setShowConnectModal(true)} className="p-2 rounded-lg text-terminal-muted hover:text-white hover:bg-terminal-border/50"><Settings className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-[1920px] mx-auto px-6 py-6">
          {!configured ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
              <div className="w-20 h-20 rounded-2xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-6"><Wallet className="w-10 h-10 text-yellow-500" /></div>
              <h2 className="text-2xl font-bold mb-2">Connect Your Account</h2>
              <p className="text-terminal-muted mb-6">Connect to Binance to start trading Gold</p>
              <button onClick={() => setShowConnectModal(true)} className="btn btn-primary">Connect to Binance</button>
            </div>
          ) : currentPage === 'deposit' ? (
            /* Deposit Page */
            <div className="max-w-4xl mx-auto">
              <DepositWithdrawPanel />
            </div>
          ) : (
            /* Trading Page */
            <div className="grid grid-cols-12 gap-6">
              {/* Left Column */}
              <div className="col-span-12 lg:col-span-3 space-y-6">
                <SignalCard signal={latestSignal} currentPrice={currentPrice} />
                <div className="card">
                  <h3 className="text-sm font-medium text-terminal-muted mb-4">Account Overview</h3>
                  {accountLoading ? <Spinner /> : accountError ? <p className="text-terminal-danger text-sm">{accountError}</p> : (
                    <div className="space-y-4">
                      <div><p className="text-terminal-muted text-xs">Total Balance (USDT)</p><p className="text-3xl font-bold font-mono">${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p></div>
                      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-terminal-border">
                        <div><p className="text-terminal-muted text-xs">Can Trade</p><p className={account?.can_trade ? 'text-terminal-accent' : 'text-terminal-danger'}>{account?.can_trade ? 'Yes' : 'No'}</p></div>
                        <div><p className="text-terminal-muted text-xs">Commission</p><p>{account?.taker_commission}%</p></div>
                      </div>
                    </div>
                  )}
                </div>
                {latestIndicators && (
                  <div className="card">
                    <h3 className="text-sm font-medium text-terminal-muted mb-4">Current Indicators</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between"><span className="text-terminal-muted text-sm">RSI (14)</span><span className={`font-mono ${latestIndicators.rsi && latestIndicators.rsi > 70 ? 'text-terminal-danger' : latestIndicators.rsi && latestIndicators.rsi < 30 ? 'text-terminal-accent' : ''}`}>{latestIndicators.rsi?.toFixed(1) || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-yellow-400 text-sm">EMA 9</span><span className="font-mono">${latestIndicators.ema_9?.toFixed(2) || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-blue-400 text-sm">EMA 21</span><span className="font-mono">${latestIndicators.ema_21?.toFixed(2) || '-'}</span></div>
                      <div className="flex justify-between"><span className="text-purple-400 text-sm">EMA 50</span><span className="font-mono">${latestIndicators.ema_50?.toFixed(2) || '-'}</span></div>
                      <div className="pt-2 border-t border-terminal-border">
                        <div className="flex justify-between"><span className="text-terminal-muted text-sm">BB Upper</span><span className="font-mono text-indigo-400">${latestIndicators.bb_upper?.toFixed(2) || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-terminal-muted text-sm">BB Lower</span><span className="font-mono text-indigo-400">${latestIndicators.bb_lower?.toFixed(2) || '-'}</span></div>
                      </div>
                      <div className="flex justify-between pt-2 border-t border-terminal-border"><span className="text-terminal-muted text-sm">ATR (14)</span><span className="font-mono">${latestIndicators.atr?.toFixed(2) || '-'}</span></div>
                      {(latestIndicators.swing_high || latestIndicators.swing_low) && (
                        <div className="pt-2 border-t border-terminal-border">
                          {latestIndicators.swing_high && <div className="flex justify-between"><span className="text-terminal-danger text-sm">Swing High</span><span className="font-mono">${latestIndicators.swing_high.toFixed(2)}</span></div>}
                          {latestIndicators.swing_low && <div className="flex justify-between"><span className="text-terminal-accent text-sm">Swing Low</span><span className="font-mono">${latestIndicators.swing_low.toFixed(2)}</span></div>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <div className="card">
                  <h3 className="text-sm font-medium text-terminal-muted mb-4">Balances</h3>
                  {accountLoading ? <Spinner /> : account?.balances.length ? (
                    <div className="space-y-1">{account.balances.slice(0, 6).map((b) => <BalanceDisplay key={b.asset} asset={b.asset} free={b.free} locked={b.locked} total={b.total} />)}</div>
                  ) : <p className="text-terminal-muted text-sm">No balances</p>}
                </div>
              </div>

              {/* Center Column */}
              <div className="col-span-12 lg:col-span-6 space-y-6">
                <div className="card">
                  <div className="flex items-center justify-between mb-6">
                    {tickerLoading ? <Spinner size="sm" /> : ticker && <PriceDisplay price={currentPrice} change={priceChange} changePercent={priceChangePercent} size="lg" />}
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-terminal-muted" />
                      <div className="flex rounded-lg bg-terminal-border/30 p-1">
                        {TIMEFRAMES.map((tf) => (
                          <button key={tf.value} onClick={() => setSelectedTimeframe(tf.value)} className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${selectedTimeframe === tf.value ? 'bg-terminal-accent text-terminal-bg' : 'text-terminal-muted hover:text-white'}`}>{tf.label}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mb-4">
                    <button onClick={() => setShowEMA(!showEMA)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${showEMA ? 'bg-yellow-500/20 text-yellow-400' : 'bg-terminal-border/30 text-terminal-muted'}`}>{showEMA ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}EMA</button>
                    <button onClick={() => setShowBB(!showBB)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${showBB ? 'bg-indigo-500/20 text-indigo-400' : 'bg-terminal-border/30 text-terminal-muted'}`}>{showBB ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}Bollinger</button>
                    <button onClick={() => setShowRSI(!showRSI)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${showRSI ? 'bg-purple-500/20 text-purple-400' : 'bg-terminal-border/30 text-terminal-muted'}`}>{showRSI ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}RSI</button>
                    <button onClick={() => setShowMACD(!showMACD)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${showMACD ? 'bg-blue-500/20 text-blue-400' : 'bg-terminal-border/30 text-terminal-muted'}`}>{showMACD ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}MACD</button>
                    <button onClick={() => setShowVP(!showVP)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${showVP ? 'bg-orange-500/20 text-orange-400' : 'bg-terminal-border/30 text-terminal-muted'}`}>{showVP ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}Vol Profile</button>
                  </div>
                  {analysisLoading ? <div className="h-[400px] flex items-center justify-center"><Spinner /></div> : analysis?.indicators ? <AdvancedChart data={analysis.indicators} height={400} showEMA={showEMA} showBB={showBB} showSignals={true} /> : <div className="h-[400px] flex items-center justify-center text-terminal-muted">No data</div>}
                  {showRSI && analysis?.indicators && <div className="mt-4 pt-4 border-t border-terminal-border"><div className="flex items-center gap-2 mb-2"><Activity className="w-4 h-4 text-purple-400" /><span className="text-sm text-terminal-muted">RSI (14)</span></div><RSIChart data={analysis.indicators} height={100} /></div>}
                  {showMACD && analysis?.indicators && <div className="mt-4 pt-4 border-t border-terminal-border"><div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-blue-400" /><span className="text-sm text-terminal-muted">MACD (12, 26, 9)</span></div><MACDChart data={analysis.indicators} height={100} /></div>}
                  {showVP && analysis?.volume_profile && <div className="mt-4 pt-4 border-t border-terminal-border"><div className="flex items-center gap-2 mb-2"><BarChart3 className="w-4 h-4 text-orange-400" /><span className="text-sm text-terminal-muted">Volume Profile</span></div><VolumeProfileChart data={analysis.volume_profile} height={200} currentPrice={currentPrice} /></div>}
                  {ticker && (
                    <div className="grid grid-cols-4 gap-4 mt-6 pt-6 border-t border-terminal-border">
                      <div><p className="text-terminal-muted text-xs">24h High</p><p className="font-mono text-terminal-profit">${parseFloat(ticker.highPrice).toLocaleString()}</p></div>
                      <div><p className="text-terminal-muted text-xs">24h Low</p><p className="font-mono text-terminal-loss">${parseFloat(ticker.lowPrice).toLocaleString()}</p></div>
                      <div><p className="text-terminal-muted text-xs">24h Volume</p><p className="font-mono">{parseFloat(ticker.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}</p></div>
                      <div><p className="text-terminal-muted text-xs">Quote Vol</p><p className="font-mono">${(parseFloat(ticker.quoteVolume) / 1e6).toFixed(2)}M</p></div>
                    </div>
                  )}
                </div>
                <div className="card">
                  <div className="flex gap-4 mb-4 border-b border-terminal-border">
                    <button onClick={() => setActiveTab('orders')} className={`pb-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'orders' ? 'border-terminal-accent text-terminal-accent' : 'border-transparent text-terminal-muted hover:text-white'}`}>Open Orders ({orders.length})</button>
                    <button onClick={() => setActiveTab('trades')} className={`pb-3 px-1 text-sm font-medium border-b-2 ${activeTab === 'trades' ? 'border-terminal-accent text-terminal-accent' : 'border-transparent text-terminal-muted hover:text-white'}`}>Trade History</button>
                  </div>
                  {activeTab === 'orders' ? <OrdersTable orders={orders} loading={ordersLoading} onCancelOrder={refreshOrders} /> : <TradesTable trades={trades} loading={tradesLoading} />}
                </div>
              </div>

              {/* Right Column */}
              <div className="col-span-12 lg:col-span-3">
                <TradingForm symbol={selectedSymbol} currentPrice={currentPrice} onOrderPlaced={() => { refreshOrders(); refreshAccount(); }} />
                
                {/* Volume Profile Stats */}
                {showVP && analysis?.volume_profile && (
                  <div className="mt-6">
                    <VolumeProfileStats data={analysis.volume_profile} currentPrice={currentPrice} />
                  </div>
                )}
                
                <div className="card mt-6">
                  <h3 className="text-sm font-medium text-terminal-muted mb-4">CRT Strategy Info</h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-2"><TrendingUp className="w-4 h-4 text-terminal-accent mt-0.5" /><div><p className="font-medium text-terminal-accent">BUY Signal</p><p className="text-terminal-muted text-xs">Liquidity sweep below swing low + bullish FVG or close above EMA9</p></div></div>
                    <div className="flex items-start gap-2"><TrendingDown className="w-4 h-4 text-terminal-danger mt-0.5" /><div><p className="font-medium text-terminal-danger">SELL Signal</p><p className="text-terminal-muted text-xs">Liquidity sweep above swing high + bearish FVG or close below EMA9</p></div></div>
                  </div>
                  {analysis && <div className="mt-4 pt-4 border-t border-terminal-border"><p className="text-terminal-muted text-xs">Signals found: <span className="text-white font-medium">{analysis.signal_count}</span></p></div>}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
      <ConnectModal isOpen={showConnectModal} onClose={() => setShowConnectModal(false)} onConnected={() => { refreshStatus(); refreshAccount(); }} />
      
      {/* Dev Inspector */}
      <DevButton onClick={() => setShowDevInspector(!showDevInspector)} isOpen={showDevInspector} />
      <DevInspector
        isOpen={showDevInspector}
        onClose={() => setShowDevInspector(false)}
        state={{
          selectedSymbol,
          selectedTimeframe,
          currentPage,
          showEMA,
          showBB,
          showRSI,
          showMACD,
          showVP,
          configured,
          environment,
        }}
        analysis={analysis}
        ticker={ticker}
        account={account}
        orders={orders}
      />
    </>
  );
}
