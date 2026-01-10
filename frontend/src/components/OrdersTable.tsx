import React, { useState } from 'react';
import { format } from 'date-fns';
import { X, Loader2, History, ShoppingCart } from 'lucide-react';
import { Order } from '@/lib/api';
import { OrderStatusBadge, SideBadge, EmptyState } from './ui';
import apiClient from '@/lib/api';

interface OrdersTableProps {
  orders: Order[];
  onCancelOrder?: (symbol: string, orderId: number) => void;
  showCancel?: boolean;
  loading?: boolean;
}

export function OrdersTable({ orders, onCancelOrder, showCancel = true, loading }: OrdersTableProps) {
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  const handleCancel = async (symbol: string, orderId: number) => {
    setCancellingId(orderId);
    try {
      await apiClient.cancelOrder(symbol, orderId);
      onCancelOrder?.(symbol, orderId);
    } catch (err) {
      console.error('Failed to cancel order:', err);
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-terminal-accent" />
      </div>
    );
  }

  if (!orders.length) {
    return (
      <EmptyState
        title="No orders"
        description="You don't have any orders yet"
        icon={<ShoppingCart className="w-8 h-8 text-terminal-muted" />}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Type</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Filled</th>
            <th>Status</th>
            {showCancel && <th></th>}
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.order_id} className="animate-fade-in">
              <td className="text-terminal-muted">
                {format(new Date(order.time), 'MMM d, HH:mm:ss')}
              </td>
              <td className="font-medium">{order.symbol}</td>
              <td>
                <SideBadge side={order.side} />
              </td>
              <td className="text-terminal-muted">{order.type}</td>
              <td>${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>{order.quantity}</td>
              <td>
                {order.executed_qty} / {order.quantity}
              </td>
              <td>
                <OrderStatusBadge status={order.status} />
              </td>
              {showCancel && (
                <td>
                  {order.status === 'NEW' && (
                    <button
                      onClick={() => handleCancel(order.symbol, order.order_id)}
                      disabled={cancellingId === order.order_id}
                      className="p-1.5 rounded-lg text-terminal-muted hover:text-terminal-danger hover:bg-terminal-danger/10 transition-all"
                    >
                      {cancellingId === order.order_id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <X className="w-4 h-4" />
                      )}
                    </button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TradesTableProps {
  trades: Array<{
    trade_id: number;
    symbol: string;
    price: number;
    quantity: number;
    quote_qty: number;
    commission: number;
    commission_asset: string;
    is_buyer: boolean;
    time: string;
  }>;
  loading?: boolean;
}

export function TradesTable({ trades, loading }: TradesTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-terminal-accent" />
      </div>
    );
  }

  if (!trades.length) {
    return (
      <EmptyState
        title="No trades"
        description="You don't have any trades yet"
        icon={<History className="w-8 h-8 text-terminal-muted" />}
      />
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Time</th>
            <th>Symbol</th>
            <th>Side</th>
            <th>Price</th>
            <th>Quantity</th>
            <th>Total</th>
            <th>Fee</th>
          </tr>
        </thead>
        <tbody>
          {trades.map((trade) => (
            <tr key={trade.trade_id} className="animate-fade-in">
              <td className="text-terminal-muted">
                {format(new Date(trade.time), 'MMM d, HH:mm:ss')}
              </td>
              <td className="font-medium">{trade.symbol}</td>
              <td>
                <SideBadge side={trade.is_buyer ? 'BUY' : 'SELL'} />
              </td>
              <td>${trade.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td>{trade.quantity}</td>
              <td>${trade.quote_qty.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
              <td className="text-terminal-muted">
                {trade.commission.toFixed(8)} {trade.commission_asset}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
