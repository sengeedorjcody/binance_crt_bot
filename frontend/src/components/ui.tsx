import React from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  AlertCircle,
  CheckCircle,
  XCircle,
  Wifi,
  WifiOff
} from 'lucide-react';

// Loading Spinner
export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  }[size];

  return (
    <Loader2 className={`${sizeClass} animate-spin text-terminal-accent`} />
  );
}

// Loading Card
export function LoadingCard({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="card flex items-center justify-center py-12">
      <div className="flex flex-col items-center gap-3">
        <Spinner size="lg" />
        <span className="text-terminal-muted text-sm">{message}</span>
      </div>
    </div>
  );
}

// Error Card
export function ErrorCard({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card border-terminal-danger/50 bg-terminal-danger/5">
      <div className="flex items-center gap-3">
        <AlertCircle className="w-5 h-5 text-terminal-danger flex-shrink-0" />
        <div className="flex-1">
          <p className="text-terminal-danger font-medium">Error</p>
          <p className="text-terminal-muted text-sm">{message}</p>
        </div>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-outline text-sm">
            Retry
          </button>
        )}
      </div>
    </div>
  );
}

// Connection Status Badge
export function ConnectionStatus({ connected, environment }: { connected: boolean; environment: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm ${
      connected 
        ? 'bg-terminal-accent/10 text-terminal-accent' 
        : 'bg-terminal-danger/10 text-terminal-danger'
    }`}>
      {connected ? (
        <>
          <Wifi className="w-4 h-4" />
          <span className="capitalize">{environment}</span>
          <span className="pulse-dot" />
        </>
      ) : (
        <>
          <WifiOff className="w-4 h-4" />
          <span>Disconnected</span>
        </>
      )}
    </div>
  );
}

// Price Display with color
export function PriceDisplay({ 
  price, 
  change, 
  changePercent,
  size = 'md' 
}: { 
  price: number | string; 
  change?: number | string;
  changePercent?: number | string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const numChange = typeof change === 'string' ? parseFloat(change) : change;
  const isPositive = numChange && numChange >= 0;
  
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  }[size];

  return (
    <div className="flex flex-col">
      <span className={`${sizeClasses} font-bold font-mono tracking-tight`}>
        ${typeof price === 'string' ? parseFloat(price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      </span>
      {(change !== undefined || changePercent !== undefined) && (
        <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-terminal-profit' : 'text-terminal-loss'}`}>
          {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
          {change !== undefined && (
            <span>{isPositive ? '+' : ''}{typeof change === 'string' ? parseFloat(change).toFixed(2) : change.toFixed(2)}</span>
          )}
          {changePercent !== undefined && (
            <span>({isPositive ? '+' : ''}{typeof changePercent === 'string' ? parseFloat(changePercent).toFixed(2) : changePercent.toFixed(2)}%)</span>
          )}
        </div>
      )}
    </div>
  );
}

// Balance Display
export function BalanceDisplay({ 
  asset, 
  free, 
  locked, 
  total,
  usdValue 
}: { 
  asset: string; 
  free: number; 
  locked: number; 
  total: number;
  usdValue?: number;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-terminal-border/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-terminal-accent/20 flex items-center justify-center">
          <span className="text-terminal-accent font-bold text-xs">{asset.slice(0, 2)}</span>
        </div>
        <div>
          <div className="font-medium">{asset}</div>
          {locked > 0 && (
            <div className="text-xs text-terminal-muted">
              {locked.toFixed(8)} locked
            </div>
          )}
        </div>
      </div>
      <div className="text-right">
        <div className="font-mono font-medium">{total.toFixed(8)}</div>
        {usdValue !== undefined && (
          <div className="text-sm text-terminal-muted">
            ≈ ${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        )}
      </div>
    </div>
  );
}

// Order Status Badge
export function OrderStatusBadge({ status }: { status: string }) {
  const statusConfig: Record<string, { className: string; icon: React.ReactNode }> = {
    NEW: { className: 'badge-warning', icon: <Loader2 className="w-3 h-3" /> },
    FILLED: { className: 'badge-success', icon: <CheckCircle className="w-3 h-3" /> },
    PARTIALLY_FILLED: { className: 'badge-warning', icon: <Loader2 className="w-3 h-3" /> },
    CANCELED: { className: 'badge-muted', icon: <XCircle className="w-3 h-3" /> },
    REJECTED: { className: 'badge-danger', icon: <XCircle className="w-3 h-3" /> },
    EXPIRED: { className: 'badge-muted', icon: <XCircle className="w-3 h-3" /> },
  };

  const config = statusConfig[status] || { className: 'badge-muted', icon: null };

  return (
    <span className={`badge ${config.className} gap-1`}>
      {config.icon}
      {status}
    </span>
  );
}

// Side Badge (BUY/SELL)
export function SideBadge({ side }: { side: string }) {
  const isBuy = side.toUpperCase() === 'BUY';
  return (
    <span className={`badge ${isBuy ? 'badge-success' : 'badge-danger'}`}>
      {side}
    </span>
  );
}

// Stat Card
export function StatCard({ 
  label, 
  value, 
  subValue,
  icon,
  trend 
}: { 
  label: string; 
  value: string | number; 
  subValue?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-terminal-muted text-sm mb-1">{label}</p>
          <p className={`text-2xl font-bold font-mono ${
            trend === 'up' ? 'text-terminal-profit' : 
            trend === 'down' ? 'text-terminal-loss' : ''
          }`}>
            {value}
          </p>
          {subValue && (
            <p className="text-terminal-muted text-sm mt-1">{subValue}</p>
          )}
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-terminal-accent/10 text-terminal-accent">
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

// Empty State
export function EmptyState({ 
  title, 
  description, 
  icon,
  action 
}: { 
  title: string; 
  description?: string; 
  icon?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      {icon && (
        <div className="p-4 rounded-full bg-terminal-border/30 mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-medium mb-1">{title}</h3>
      {description && (
        <p className="text-terminal-muted text-sm max-w-sm">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
