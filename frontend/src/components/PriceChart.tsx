import React, { useMemo } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { format } from 'date-fns';
import { Kline } from '@/lib/api';

interface PriceChartProps {
  data: Kline[];
  height?: number;
}

export function PriceChart({ data, height = 300 }: PriceChartProps) {
  const chartData = useMemo(() => {
    return data.map(k => ({
      time: new Date(k.open_time).getTime(),
      price: k.close,
      high: k.high,
      low: k.low,
      volume: k.volume,
    }));
  }, [data]);

  const minPrice = useMemo(() => Math.min(...chartData.map(d => d.low)) * 0.999, [chartData]);
  const maxPrice = useMemo(() => Math.max(...chartData.map(d => d.high)) * 1.001, [chartData]);

  const isPositive = chartData.length >= 2 && chartData[chartData.length - 1].price >= chartData[0].price;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-terminal-card border border-terminal-border rounded-lg p-3 shadow-xl">
          <p className="text-terminal-muted text-xs mb-1">
            {format(new Date(label), 'MMM d, yyyy HH:mm')}
          </p>
          <p className="text-lg font-bold font-mono">
            ${payload[0].value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      );
    }
    return null;
  };

  if (!data.length) {
    return (
      <div className="flex items-center justify-center h-[300px] text-terminal-muted">
        No data available
      </div>
    );
  }

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="0%" 
                stopColor={isPositive ? '#00ff88' : '#ef4444'} 
                stopOpacity={0.3} 
              />
              <stop 
                offset="100%" 
                stopColor={isPositive ? '#00ff88' : '#ef4444'} 
                stopOpacity={0} 
              />
            </linearGradient>
          </defs>
          <CartesianGrid 
            strokeDasharray="3 3" 
            stroke="#1e293b" 
            vertical={false}
          />
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
          <Area
            type="monotone"
            dataKey="price"
            stroke={isPositive ? '#00ff88' : '#ef4444'}
            strokeWidth={2}
            fill="url(#priceGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Simple mini chart for dashboard cards
export function MiniChart({ data, positive }: { data: number[]; positive: boolean }) {
  const chartData = data.map((value, index) => ({ index, value }));
  const min = Math.min(...data) * 0.99;
  const max = Math.max(...data) * 1.01;

  return (
    <div className="w-24 h-12">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`miniGradient-${positive}`} x1="0" y1="0" x2="0" y2="1">
              <stop 
                offset="0%" 
                stopColor={positive ? '#00ff88' : '#ef4444'} 
                stopOpacity={0.3} 
              />
              <stop 
                offset="100%" 
                stopColor={positive ? '#00ff88' : '#ef4444'} 
                stopOpacity={0} 
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={positive ? '#00ff88' : '#ef4444'}
            strokeWidth={1.5}
            fill={`url(#miniGradient-${positive})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
