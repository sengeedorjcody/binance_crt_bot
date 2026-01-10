import React, { useMemo } from 'react';
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Bar,
  BarChart,
  Cell,
} from 'recharts';
import { format } from 'date-fns';
import { IndicatorData, VolumeProfile } from '@/lib/api';
import { TrendingUp, TrendingDown, AlertTriangle, BarChart2 } from 'lucide-react';

interface AdvancedChartProps {
  data: IndicatorData[];
  height?: number;
  showEMA?: boolean;
  showBB?: boolean;
  showSignals?: boolean;
}

export function AdvancedChart({ 
  data, 
  height = 400,
  showEMA = true,
  showBB = true,
  showSignals = true
}: AdvancedChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      time: new Date(d.time).getTime(),
      price: d.price,
      ema_9: d.ema_9,
      ema_21: d.ema_21,
      ema_50: d.ema_50,
      bb_upper: d.bb_upper,
      bb_middle: d.bb_middle,
      bb_lower: d.bb_lower,
      swing_high: d.swing_high,
      swing_low: d.swing_low,
      signal: d.signal,
      is_liquidity_sweep: d.is_liquidity_sweep,
    }));
  }, [data]);

  const { minPrice, maxPrice } = useMemo(() => {
    const prices = chartData.map(d => d.price);
    const bbUppers = chartData.map(d => d.bb_upper).filter(Boolean) as number[];
    const bbLowers = chartData.map(d => d.bb_lower).filter(Boolean) as number[];
    
    const allValues = [...prices, ...bbUppers, ...bbLowers];
    const min = Math.min(...allValues) * 0.999;
    const max = Math.max(...allValues) * 1.001;
    
    return { minPrice: min, maxPrice: max };
  }, [chartData]);

  const signals = useMemo(() => {
    return chartData.filter(d => d.signal !== null);
  }, [chartData]);

  const isPositive = chartData.length >= 2 && chartData[chartData.length - 1].price >= chartData[0].price;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-4 shadow-xl min-w-[200px]">
          <p className="text-terminal-muted text-xs mb-2">
            {format(new Date(label), 'MMM d, yyyy HH:mm')}
          </p>
          <p className="text-2xl font-bold font-mono mb-3">
            ${data.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          
          {data.ema_9 && (
            <div className="grid grid-cols-3 gap-2 text-xs border-t border-terminal-border pt-2">
              <div>
                <span className="text-terminal-muted">EMA 9</span>
                <p className="text-yellow-400 font-mono">${data.ema_9?.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-terminal-muted">EMA 21</span>
                <p className="text-blue-400 font-mono">${data.ema_21?.toFixed(2)}</p>
              </div>
              <div>
                <span className="text-terminal-muted">EMA 50</span>
                <p className="text-purple-400 font-mono">${data.ema_50?.toFixed(2)}</p>
              </div>
            </div>
          )}
          
          {data.signal && (
            <div className={`mt-2 px-2 py-1 rounded text-xs font-bold text-center ${
              data.signal === 'BUY' ? 'bg-terminal-accent/20 text-terminal-accent' : 'bg-terminal-danger/20 text-terminal-danger'
            }`}>
              {data.signal} SIGNAL
            </div>
          )}
          
          {data.is_liquidity_sweep && (
            <div className="mt-2 flex items-center gap-1 text-terminal-warning text-xs">
              <AlertTriangle className="w-3 h-3" />
              Liquidity Sweep
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[400px] text-terminal-muted">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradientAdv" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isPositive ? '#00ff88' : '#ef4444'} stopOpacity={0.2} />
              <stop offset="100%" stopColor={isPositive ? '#00ff88' : '#ef4444'} stopOpacity={0} />
            </linearGradient>
            <linearGradient id="bbGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#6366f1" stopOpacity={0.05} />
            </linearGradient>
          </defs>
          
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          
          <XAxis
            dataKey="time"
            tickFormatter={(time) => format(new Date(time), 'HH:mm')}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis
            domain={[minPrice, maxPrice]}
            tickFormatter={(value) => `$${value.toLocaleString()}`}
            stroke="#64748b"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            width={80}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Bollinger Bands */}
          {showBB && (
            <>
              <Area
                type="monotone"
                dataKey="bb_upper"
                stroke="transparent"
                fill="url(#bbGradient)"
              />
              <Line
                type="monotone"
                dataKey="bb_upper"
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="bb_lower"
                stroke="#6366f1"
                strokeWidth={1}
                strokeDasharray="3 3"
                dot={false}
                opacity={0.5}
              />
              <Line
                type="monotone"
                dataKey="bb_middle"
                stroke="#6366f1"
                strokeWidth={1}
                dot={false}
                opacity={0.3}
              />
            </>
          )}
          
          {/* Price Area */}
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#00ff88' : '#ef4444'}
            strokeWidth={2}
            fill="url(#priceGradientAdv)"
          />
          
          {/* EMAs */}
          {showEMA && (
            <>
              <Line
                type="monotone"
                dataKey="ema_9"
                stroke="#facc15"
                strokeWidth={1.5}
                dot={false}
                name="EMA 9"
              />
              <Line
                type="monotone"
                dataKey="ema_21"
                stroke="#3b82f6"
                strokeWidth={1.5}
                dot={false}
                name="EMA 21"
              />
              <Line
                type="monotone"
                dataKey="ema_50"
                stroke="#a855f7"
                strokeWidth={1.5}
                dot={false}
                name="EMA 50"
              />
            </>
          )}
          
          {/* Signal markers */}
          {showSignals && signals.map((signal, index) => (
            <ReferenceLine
              key={index}
              x={signal.time}
              stroke={signal.signal === 'BUY' ? '#00ff88' : '#ef4444'}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          ))}
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// RSI Chart Component
interface RSIChartProps {
  data: IndicatorData[];
  height?: number;
}

export function RSIChart({ data, height = 120 }: RSIChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      time: new Date(d.time).getTime(),
      rsi: d.rsi,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-2 shadow-xl">
          <p className="text-terminal-muted text-xs">
            {format(new Date(label), 'HH:mm')}
          </p>
          <p className={`font-bold font-mono ${
            payload[0].value > 70 ? 'text-terminal-danger' : 
            payload[0].value < 30 ? 'text-terminal-accent' : 'text-white'
          }`}>
            RSI: {payload[0].value?.toFixed(1)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          
          <XAxis
            dataKey="time"
            tickFormatter={(time) => format(new Date(time), 'HH:mm')}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis
            domain={[0, 100]}
            ticks={[30, 50, 70]}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* Overbought/Oversold zones */}
          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" opacity={0.5} />
          <ReferenceLine y={30} stroke="#00ff88" strokeDasharray="3 3" opacity={0.5} />
          <ReferenceLine y={50} stroke="#64748b" strokeDasharray="3 3" opacity={0.3} />
          
          <Area
            type="monotone"
            dataKey="rsi"
            stroke="#8b5cf6"
            strokeWidth={1.5}
            fill="#8b5cf6"
            fillOpacity={0.1}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// MACD Chart Component
interface MACDChartProps {
  data: IndicatorData[];
  height?: number;
}

export function MACDChart({ data, height = 120 }: MACDChartProps) {
  const chartData = useMemo(() => {
    return data.map(d => ({
      time: new Date(d.time).getTime(),
      macd: d.macd_line,
      signal: d.macd_signal,
      histogram: d.macd_histogram,
    }));
  }, [data]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-2 shadow-xl">
          <p className="text-terminal-muted text-xs mb-1">
            {format(new Date(label), 'HH:mm')}
          </p>
          <div className="grid grid-cols-3 gap-2 text-xs">
            <div>
              <span className="text-terminal-muted">MACD</span>
              <p className="text-blue-400 font-mono">{d.macd?.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-terminal-muted">Signal</span>
              <p className="text-orange-400 font-mono">{d.signal?.toFixed(2)}</p>
            </div>
            <div>
              <span className="text-terminal-muted">Hist</span>
              <p className={`font-mono ${d.histogram > 0 ? 'text-terminal-accent' : 'text-terminal-danger'}`}>
                {d.histogram?.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          
          <XAxis
            dataKey="time"
            tickFormatter={(time) => format(new Date(time), 'HH:mm')}
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
          />
          
          <YAxis
            stroke="#64748b"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          <ReferenceLine y={0} stroke="#64748b" strokeDasharray="3 3" opacity={0.5} />
          
          <Bar
            dataKey="histogram"
            fill="#00ff88"
            opacity={0.5}
          />
          
          <Line
            type="monotone"
            dataKey="macd"
            stroke="#3b82f6"
            strokeWidth={1.5}
            dot={false}
          />
          
          <Line
            type="monotone"
            dataKey="signal"
            stroke="#f97316"
            strokeWidth={1.5}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

// Signal Card Component
interface SignalCardProps {
  signal: IndicatorData | null;
  currentPrice: number;
}

export function SignalCard({ signal, currentPrice }: SignalCardProps) {
  if (!signal) {
    return (
      <div className="card bg-terminal-border/20">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-terminal-muted/20 flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-terminal-muted" />
          </div>
          <div>
            <p className="text-terminal-muted text-sm">No Active Signal</p>
            <p className="text-xs text-terminal-muted/70">Waiting for CRT setup...</p>
          </div>
        </div>
      </div>
    );
  }

  const isBuy = signal.signal === 'BUY';

  return (
    <div className={`card border-2 ${isBuy ? 'border-terminal-accent/50 bg-terminal-accent/5' : 'border-terminal-danger/50 bg-terminal-danger/5'}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
            isBuy ? 'bg-terminal-accent/20' : 'bg-terminal-danger/20'
          }`}>
            {isBuy ? (
              <TrendingUp className="w-6 h-6 text-terminal-accent" />
            ) : (
              <TrendingDown className="w-6 h-6 text-terminal-danger" />
            )}
          </div>
          <div>
            <p className={`font-bold text-lg ${isBuy ? 'text-terminal-accent' : 'text-terminal-danger'}`}>
              {signal.signal} SIGNAL
            </p>
            <p className="text-xs text-terminal-muted">
              {format(new Date(signal.time), 'MMM d, HH:mm')}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold font-mono">
            ${signal.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <p className="text-xs text-terminal-muted">
            Current: ${currentPrice?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
      
      {signal.is_liquidity_sweep && (
        <div className="mt-3 pt-3 border-t border-terminal-border/50 flex items-center gap-2 text-terminal-warning text-sm">
          <AlertTriangle className="w-4 h-4" />
          Liquidity Sweep Detected
        </div>
      )}
    </div>
  );
}

// Volume Profile Chart Component
interface VolumeProfileChartProps {
  data: VolumeProfile;
  height?: number;
  currentPrice?: number;
}

export function VolumeProfileChart({ data, height = 300, currentPrice }: VolumeProfileChartProps) {
  const chartData = useMemo(() => {
    if (!data?.levels) return [];
    return data.levels.map(level => ({
      price: level.price,
      volume: level.volume_pct,
      buyVolume: level.volume_pct * (level.buy_pct / 100),
      sellVolume: level.volume_pct * ((100 - level.buy_pct) / 100),
      isPOC: Math.abs(level.price - (data.poc || 0)) < 0.01,
      isValueArea: data.val && data.vah ? (level.price >= data.val && level.price <= data.vah) : false,
    }));
  }, [data]);

  if (!data?.levels?.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-terminal-muted">
        No volume data available
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const d = payload[0].payload;
      return (
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-3 shadow-xl">
          <p className="text-lg font-bold font-mono mb-1">
            ${d.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-terminal-accent">Buy</span>
              <p className="font-mono">{d.buyVolume?.toFixed(1)}%</p>
            </div>
            <div>
              <span className="text-terminal-danger">Sell</span>
              <p className="font-mono">{d.sellVolume?.toFixed(1)}%</p>
            </div>
          </div>
          {d.isPOC && (
            <div className="mt-2 px-2 py-1 rounded bg-yellow-500/20 text-yellow-400 text-xs text-center">
              Point of Control (POC)
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 10, right: 30, left: 60, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
          
          <XAxis
            type="number"
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
            stroke="#64748b"
            fontSize={10}
          />
          
          <YAxis
            type="category"
            dataKey="price"
            tickFormatter={(v) => `$${v.toLocaleString()}`}
            stroke="#64748b"
            fontSize={10}
            width={55}
          />
          
          <Tooltip content={<CustomTooltip />} />
          
          {/* POC Reference Line */}
          {data.poc && (
            <ReferenceLine
              y={data.poc}
              stroke="#facc15"
              strokeWidth={2}
              strokeDasharray="5 5"
              label={{ value: 'POC', fill: '#facc15', fontSize: 10 }}
            />
          )}
          
          {/* Buy Volume (Green) */}
          <Bar dataKey="buyVolume" stackId="volume" fill="#00ff88" radius={[0, 0, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`buy-${index}`} 
                fill={entry.isPOC ? '#facc15' : '#00ff88'}
                fillOpacity={entry.isValueArea ? 0.9 : 0.5}
              />
            ))}
          </Bar>
          
          {/* Sell Volume (Red) */}
          <Bar dataKey="sellVolume" stackId="volume" fill="#ef4444" radius={[0, 4, 4, 0]}>
            {chartData.map((entry, index) => (
              <Cell 
                key={`sell-${index}`} 
                fill={entry.isPOC ? '#facc15' : '#ef4444'}
                fillOpacity={entry.isValueArea ? 0.9 : 0.5}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// Volume Profile Stats Card
interface VolumeProfileStatsProps {
  data: VolumeProfile;
  currentPrice?: number;
}

export function VolumeProfileStats({ data, currentPrice }: VolumeProfileStatsProps) {
  if (!data?.poc) {
    return null;
  }

  const priceVsPOC = currentPrice && data.poc 
    ? ((currentPrice - data.poc) / data.poc * 100).toFixed(2)
    : null;

  const isAbovePOC = currentPrice && data.poc && currentPrice > data.poc;
  const isInValueArea = currentPrice && data.val && data.vah 
    ? (currentPrice >= data.val && currentPrice <= data.vah)
    : false;

  return (
    <div className="card">
      <h3 className="text-sm font-medium text-terminal-muted mb-4 flex items-center gap-2">
        <BarChart2 className="w-4 h-4" />
        Volume Profile
      </h3>
      
      <div className="space-y-3">
        {/* POC */}
        <div className="flex justify-between items-center">
          <span className="text-yellow-400 text-sm">POC (Point of Control)</span>
          <span className="font-mono font-medium">${data.poc?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
        
        {/* Value Area */}
        <div className="pt-2 border-t border-terminal-border">
          <div className="flex justify-between items-center">
            <span className="text-terminal-muted text-sm">Value Area High</span>
            <span className="font-mono text-terminal-profit">${data.vah?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-terminal-muted text-sm">Value Area Low</span>
            <span className="font-mono text-terminal-loss">${data.val?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
          </div>
        </div>

        {/* Price vs POC */}
        {priceVsPOC && (
          <div className="pt-2 border-t border-terminal-border">
            <div className="flex justify-between items-center">
              <span className="text-terminal-muted text-sm">Price vs POC</span>
              <span className={`font-mono ${isAbovePOC ? 'text-terminal-profit' : 'text-terminal-loss'}`}>
                {isAbovePOC ? '+' : ''}{priceVsPOC}%
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-terminal-muted text-sm">In Value Area</span>
              <span className={`font-mono ${isInValueArea ? 'text-terminal-accent' : 'text-terminal-muted'}`}>
                {isInValueArea ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        )}

        {/* Visual indicator */}
        <div className="pt-2 border-t border-terminal-border">
          <div className="h-2 rounded-full bg-terminal-border/50 relative overflow-hidden">
            {/* Value Area */}
            <div 
              className="absolute h-full bg-terminal-accent/30"
              style={{
                left: `${((data.val || 0) - data.price_low) / (data.price_high - data.price_low) * 100}%`,
                width: `${((data.vah || 0) - (data.val || 0)) / (data.price_high - data.price_low) * 100}%`
              }}
            />
            {/* POC marker */}
            <div 
              className="absolute w-1 h-full bg-yellow-400"
              style={{
                left: `${((data.poc || 0) - data.price_low) / (data.price_high - data.price_low) * 100}%`
              }}
            />
            {/* Current price marker */}
            {currentPrice && (
              <div 
                className="absolute w-0 h-0 border-l-4 border-r-4 border-b-4 border-transparent border-b-white -top-1"
                style={{
                  left: `${((currentPrice || 0) - data.price_low) / (data.price_high - data.price_low) * 100}%`,
                  transform: 'translateX(-50%)'
                }}
              />
            )}
          </div>
          <div className="flex justify-between text-xs text-terminal-muted mt-1">
            <span>${data.price_low?.toLocaleString()}</span>
            <span>${data.price_high?.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
