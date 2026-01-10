import React, { useState, useEffect } from 'react';
import { Copy, Check, ExternalLink, Loader2, QrCode, ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react';
import apiClient from '@/lib/api';

interface DepositAddressData {
  coin: string;
  address: string;
  tag?: string;
  network?: string;
  url?: string;
}

interface DepositHistory {
  id: string;
  tx_id: string;
  coin: string;
  amount: number;
  network: string;
  address: string;
  status: number;
  insert_time: string;
}

interface WithdrawHistory {
  id: string;
  tx_id: string;
  coin: string;
  amount: number;
  network: string;
  address: string;
  status: number;
  apply_time: string;
  transaction_fee: number;
}

// Deposit Address Card
export function DepositAddress({ coin = 'USDT' }: { coin?: string }) {
  const [address, setAddress] = useState<DepositAddressData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [selectedNetwork, setSelectedNetwork] = useState('');
  const [isTestnet, setIsTestnet] = useState(true);

  const networks: Record<string, string[]> = {
    USDT: ['TRC20', 'ERC20', 'BEP20'],
    BTC: ['BTC'],
    ETH: ['ERC20'],
    PAXG: ['ERC20'],
  };

  const availableNetworks = networks[coin] || ['ERC20'];

  useEffect(() => {
    // Check if we're on testnet
    apiClient.getStatus().then(status => {
      setIsTestnet(status.environment === 'testnet');
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (availableNetworks.length > 0 && !selectedNetwork) {
      setSelectedNetwork(availableNetworks[0]);
    }
  }, [coin]);

  const fetchAddress = async () => {
    if (isTestnet) {
      setError('testnet');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await apiClient.getDepositAddress(coin, selectedNetwork);
      if (result.success && result.data) {
        setAddress(result.data);
      } else {
        setError(result.message || 'Failed to get deposit address');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Deposit addresses not available on testnet. Use production API.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedNetwork) {
      fetchAddress();
    }
  }, [coin, selectedNetwork, isTestnet]);

  const copyToClipboard = () => {
    if (address?.address) {
      navigator.clipboard.writeText(address.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Testnet info display
  if (isTestnet) {
    return (
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ArrowDownLeft className="w-5 h-5 text-terminal-accent" />
            Testnet Mode
          </h3>
        </div>
        
        <div className="p-4 rounded-lg bg-terminal-accent/10 border border-terminal-accent/30 mb-4">
          <p className="text-terminal-accent font-medium mb-2">✅ You already have test coins!</p>
          <p className="text-terminal-muted text-sm">
            Binance Testnet automatically provides test balances when you register. 
            No deposit needed - your test coins are already in your account.
          </p>
        </div>

        <div className="space-y-3">
          <h4 className="text-sm font-medium text-terminal-muted">Your Testnet Balances Include:</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-terminal-border/30">
              <span className="text-terminal-muted text-xs">USDT</span>
              <p className="font-mono font-medium">10,000.00</p>
            </div>
            <div className="p-3 rounded-lg bg-terminal-border/30">
              <span className="text-terminal-muted text-xs">BTC</span>
              <p className="font-mono font-medium">1.00000000</p>
            </div>
            <div className="p-3 rounded-lg bg-terminal-border/30">
              <span className="text-terminal-muted text-xs">ETH</span>
              <p className="font-mono font-medium">1.00000000</p>
            </div>
            <div className="p-3 rounded-lg bg-terminal-border/30">
              <span className="text-terminal-muted text-xs">BNB</span>
              <p className="font-mono font-medium">1.00000000</p>
            </div>
          </div>
        </div>

        <div className="mt-4 p-3 rounded-lg bg-terminal-warning/10 border border-terminal-warning/30">
          <p className="text-terminal-warning text-sm font-medium">⚠️ PAXG Not Available on Testnet</p>
          <p className="text-terminal-muted text-xs mt-1">
            PAX Gold (PAXG) is only available on Binance Production. 
            For testing, use BTCUSDT or ETHUSDT instead.
          </p>
        </div>

        <div className="mt-4 pt-4 border-t border-terminal-border">
          <p className="text-terminal-muted text-sm mb-2">Need more test coins?</p>
          <a 
            href="https://testnet.binance.vision/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-terminal-accent hover:underline text-sm"
          >
            Reset at testnet.binance.vision
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-terminal-accent" />
          Deposit {coin}
        </h3>
        <button
          onClick={fetchAddress}
          disabled={loading}
          className="p-2 rounded-lg text-terminal-muted hover:text-white hover:bg-terminal-border/50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Network Selector */}
      <div className="mb-4">
        <label className="block text-sm text-terminal-muted mb-2">Select Network</label>
        <div className="flex gap-2">
          {availableNetworks.map((network) => (
            <button
              key={network}
              onClick={() => setSelectedNetwork(network)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedNetwork === network
                  ? 'bg-terminal-accent text-terminal-bg'
                  : 'bg-terminal-border/50 text-terminal-muted hover:text-white'
              }`}
            >
              {network}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-terminal-accent" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-terminal-warning/10 border border-terminal-warning/30 text-terminal-warning text-sm">
          <p className="font-medium mb-1">⚠️ Note</p>
          <p>{error}</p>
          <p className="mt-2 text-xs text-terminal-muted">
            Deposit/withdraw features require Binance production API, not testnet.
          </p>
        </div>
      ) : address ? (
        <div className="space-y-4">
          {/* QR Code Placeholder */}
          <div className="flex justify-center">
            <div className="w-32 h-32 bg-white rounded-lg flex items-center justify-center">
              <QrCode className="w-24 h-24 text-terminal-bg" />
            </div>
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm text-terminal-muted mb-1">Deposit Address</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={address.address}
                readOnly
                className="input flex-1 text-sm"
              />
              <button
                onClick={copyToClipboard}
                className="p-3 rounded-lg bg-terminal-border/50 hover:bg-terminal-border transition-all"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-terminal-accent" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Tag/Memo if exists */}
          {address.tag && (
            <div>
              <label className="block text-sm text-terminal-muted mb-1">Memo/Tag</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={address.tag}
                  readOnly
                  className="input flex-1 text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(address.tag!);
                  }}
                  className="p-3 rounded-lg bg-terminal-border/50 hover:bg-terminal-border transition-all"
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="p-3 rounded-lg bg-terminal-danger/10 border border-terminal-danger/30 text-sm">
            <p className="text-terminal-danger font-medium">⚠️ Important</p>
            <p className="text-terminal-muted text-xs mt-1">
              Only send {coin} to this address on the {selectedNetwork} network. Sending other assets may result in permanent loss.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// Deposit History Component
export function DepositHistoryTable() {
  const [deposits, setDeposits] = useState<DepositHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getDepositHistory(undefined, 50);
      if (result.success && result.data) {
        setDeposits(result.data);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch deposit history');
      }
    } catch (err: any) {
      setError('Deposit history not available on testnet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: number) => {
    const statusMap: Record<number, { label: string; className: string }> = {
      0: { label: 'Pending', className: 'badge-warning' },
      1: { label: 'Success', className: 'badge-success' },
      6: { label: 'Credited', className: 'badge-success' },
    };
    const s = statusMap[status] || { label: 'Unknown', className: 'badge-muted' };
    return <span className={`badge ${s.className}`}>{s.label}</span>;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ArrowDownLeft className="w-5 h-5 text-terminal-accent" />
          Deposit History
        </h3>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 rounded-lg text-terminal-muted hover:text-white hover:bg-terminal-border/50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-terminal-accent" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-terminal-border/30 text-terminal-muted text-sm text-center">
          {error}
        </div>
      ) : deposits.length === 0 ? (
        <div className="text-center py-8 text-terminal-muted">
          <ArrowDownLeft className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No deposit history</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Coin</th>
                <th>Amount</th>
                <th>Network</th>
                <th>Status</th>
                <th>TxID</th>
              </tr>
            </thead>
            <tbody>
              {deposits.map((deposit, idx) => (
                <tr key={idx}>
                  <td className="text-terminal-muted">{deposit.insert_time}</td>
                  <td className="font-medium">{deposit.coin}</td>
                  <td className="text-terminal-accent font-mono">+{deposit.amount}</td>
                  <td>{deposit.network}</td>
                  <td>{getStatusBadge(deposit.status)}</td>
                  <td>
                    {deposit.tx_id ? (
                      <a
                        href={`https://etherscan.io/tx/${deposit.tx_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-accent hover:underline flex items-center gap-1"
                      >
                        {deposit.tx_id.slice(0, 8)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Withdraw History Component
export function WithdrawHistoryTable() {
  const [withdrawals, setWithdrawals] = useState<WithdrawHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const result = await apiClient.getWithdrawHistory(undefined, 50);
      if (result.success && result.data) {
        setWithdrawals(result.data);
        setError(null);
      } else {
        setError(result.message || 'Failed to fetch withdrawal history');
      }
    } catch (err: any) {
      setError('Withdrawal history not available on testnet');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const getStatusBadge = (status: number) => {
    const statusMap: Record<number, { label: string; className: string }> = {
      0: { label: 'Email Sent', className: 'badge-warning' },
      1: { label: 'Cancelled', className: 'badge-muted' },
      2: { label: 'Awaiting', className: 'badge-warning' },
      3: { label: 'Rejected', className: 'badge-danger' },
      4: { label: 'Processing', className: 'badge-warning' },
      5: { label: 'Failure', className: 'badge-danger' },
      6: { label: 'Completed', className: 'badge-success' },
    };
    const s = statusMap[status] || { label: 'Unknown', className: 'badge-muted' };
    return <span className={`badge ${s.className}`}>{s.label}</span>;
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <ArrowUpRight className="w-5 h-5 text-terminal-danger" />
          Withdrawal History
        </h3>
        <button
          onClick={fetchHistory}
          disabled={loading}
          className="p-2 rounded-lg text-terminal-muted hover:text-white hover:bg-terminal-border/50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-terminal-accent" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-lg bg-terminal-border/30 text-terminal-muted text-sm text-center">
          {error}
        </div>
      ) : withdrawals.length === 0 ? (
        <div className="text-center py-8 text-terminal-muted">
          <ArrowUpRight className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>No withdrawal history</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th>Time</th>
                <th>Coin</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Network</th>
                <th>Status</th>
                <th>TxID</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((withdrawal, idx) => (
                <tr key={idx}>
                  <td className="text-terminal-muted">{withdrawal.apply_time}</td>
                  <td className="font-medium">{withdrawal.coin}</td>
                  <td className="text-terminal-danger font-mono">-{withdrawal.amount}</td>
                  <td className="text-terminal-muted font-mono">{withdrawal.transaction_fee}</td>
                  <td>{withdrawal.network}</td>
                  <td>{getStatusBadge(withdrawal.status)}</td>
                  <td>
                    {withdrawal.tx_id ? (
                      <a
                        href={`https://etherscan.io/tx/${withdrawal.tx_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-terminal-accent hover:underline flex items-center gap-1"
                      >
                        {withdrawal.tx_id.slice(0, 8)}...
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      '-'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// Combined Deposit/Withdraw Panel
export function DepositWithdrawPanel() {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw'>('deposit');
  const [selectedCoin, setSelectedCoin] = useState('USDT');

  const coins = ['USDT', 'PAXG', 'BTC', 'ETH'];

  return (
    <div className="space-y-6">
      {/* Coin Selector */}
      <div className="card">
        <label className="block text-sm text-terminal-muted mb-2">Select Asset</label>
        <div className="flex flex-wrap gap-2">
          {coins.map((coin) => (
            <button
              key={coin}
              onClick={() => setSelectedCoin(coin)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCoin === coin
                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                  : 'bg-terminal-border/50 text-terminal-muted hover:text-white'
              }`}
            >
              {coin}
            </button>
          ))}
        </div>
      </div>

      {/* Deposit Address */}
      <DepositAddress coin={selectedCoin} />

      {/* History Tabs */}
      <div className="card">
        <div className="flex gap-4 mb-4 border-b border-terminal-border">
          <button
            onClick={() => setActiveTab('deposit')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'deposit'
                ? 'border-terminal-accent text-terminal-accent'
                : 'border-transparent text-terminal-muted hover:text-white'
            }`}
          >
            Deposit History
          </button>
          <button
            onClick={() => setActiveTab('withdraw')}
            className={`pb-3 px-1 text-sm font-medium border-b-2 transition-all ${
              activeTab === 'withdraw'
                ? 'border-terminal-accent text-terminal-accent'
                : 'border-transparent text-terminal-muted hover:text-white'
            }`}
          >
            Withdrawal History
          </button>
        </div>

        {activeTab === 'deposit' ? (
          <DepositHistoryTable />
        ) : (
          <WithdrawHistoryTable />
        )}
      </div>
    </div>
  );
}
