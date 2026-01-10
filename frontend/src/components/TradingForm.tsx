import React, { useState } from 'react';
import { Loader2, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import apiClient from '@/lib/api';

interface TradingFormProps {
  symbol: string;
  currentPrice: number;
  onOrderPlaced?: () => void;
}

type OrderType = 'MARKET' | 'LIMIT';
type Side = 'BUY' | 'SELL';

export function TradingForm({ symbol, currentPrice, onOrderPlaced }: TradingFormProps) {
  const [side, setSide] = useState<Side>('BUY');
  const [orderType, setOrderType] = useState<OrderType>('MARKET');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty <= 0) {
        throw new Error('Invalid quantity');
      }

      let result;
      if (orderType === 'MARKET') {
        if (side === 'BUY') {
          result = await apiClient.marketBuy(symbol, qty);
        } else {
          result = await apiClient.marketSell(symbol, qty);
        }
      } else {
        const limitPrice = parseFloat(price);
        if (isNaN(limitPrice) || limitPrice <= 0) {
          throw new Error('Invalid price');
        }
        if (side === 'BUY') {
          result = await apiClient.limitBuy(symbol, qty, limitPrice);
        } else {
          result = await apiClient.limitSell(symbol, qty, limitPrice);
        }
      }

      if (result.success) {
        setSuccess(`Order placed! ID: ${result.data?.order_id}`);
        setQuantity('');
        setPrice('');
        onOrderPlaced?.();
      } else {
        throw new Error(result.message || 'Order failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Order failed');
    } finally {
      setLoading(false);
    }
  };

  const estimatedTotal = () => {
    const qty = parseFloat(quantity) || 0;
    const p = orderType === 'LIMIT' ? parseFloat(price) || 0 : currentPrice;
    return qty * p;
  };

  return (
    <div className="card">
      <h3 className="text-lg font-semibold mb-4">Place Order</h3>

      {/* Side Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setSide('BUY')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            side === 'BUY'
              ? 'bg-terminal-accent text-terminal-bg'
              : 'bg-terminal-border/50 text-terminal-muted hover:bg-terminal-border'
          }`}
        >
          <ArrowUpCircle className="w-4 h-4" />
          BUY
        </button>
        <button
          type="button"
          onClick={() => setSide('SELL')}
          className={`flex-1 py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            side === 'SELL'
              ? 'bg-terminal-danger text-white'
              : 'bg-terminal-border/50 text-terminal-muted hover:bg-terminal-border'
          }`}
        >
          <ArrowDownCircle className="w-4 h-4" />
          SELL
        </button>
      </div>

      {/* Order Type Toggle */}
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setOrderType('MARKET')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            orderType === 'MARKET'
              ? 'bg-terminal-border text-white'
              : 'text-terminal-muted hover:text-white'
          }`}
        >
          Market
        </button>
        <button
          type="button"
          onClick={() => setOrderType('LIMIT')}
          className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
            orderType === 'LIMIT'
              ? 'bg-terminal-border text-white'
              : 'text-terminal-muted hover:text-white'
          }`}
        >
          Limit
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Price Input (for Limit orders) */}
        {orderType === 'LIMIT' && (
          <div>
            <label className="block text-sm text-terminal-muted mb-1">Price (USDT)</label>
            <input
              type="number"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={currentPrice.toString()}
              className="input"
            />
          </div>
        )}

        {/* Quantity Input */}
        <div>
          <label className="block text-sm text-terminal-muted mb-1">
            Quantity ({symbol.replace('USDT', '')})
          </label>
          <input
            type="number"
            step="any"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            className="input"
          />
        </div>

        {/* Quick Amount Buttons */}
        <div className="flex gap-2">
          {['25%', '50%', '75%', '100%'].map((pct) => (
            <button
              key={pct}
              type="button"
              className="flex-1 py-1.5 rounded bg-terminal-border/50 text-terminal-muted text-xs hover:bg-terminal-border hover:text-white transition-all"
              onClick={() => {
                // This would calculate based on available balance
                // For now, just a placeholder
              }}
            >
              {pct}
            </button>
          ))}
        </div>

        {/* Estimated Total */}
        <div className="flex justify-between py-3 border-t border-terminal-border">
          <span className="text-terminal-muted">Estimated Total</span>
          <span className="font-mono font-medium">
            ${estimatedTotal().toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT
          </span>
        </div>

        {/* Error/Success Messages */}
        {error && (
          <div className="p-3 rounded-lg bg-terminal-danger/10 border border-terminal-danger/30 text-terminal-danger text-sm">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 rounded-lg bg-terminal-accent/10 border border-terminal-accent/30 text-terminal-accent text-sm">
            {success}
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading || !quantity}
          className={`w-full py-3 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 ${
            side === 'BUY'
              ? 'bg-terminal-accent text-terminal-bg hover:bg-terminal-accent/90 disabled:bg-terminal-accent/50'
              : 'bg-terminal-danger text-white hover:bg-terminal-danger/90 disabled:bg-terminal-danger/50'
          } disabled:cursor-not-allowed`}
        >
          {loading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              {side === 'BUY' ? 'Buy' : 'Sell'} {symbol.replace('USDT', '')}
            </>
          )}
        </button>
      </form>
    </div>
  );
}
