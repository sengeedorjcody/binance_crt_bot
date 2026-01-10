import { useState, useEffect, useCallback } from 'react';
import apiClient, { AccountInfo, Balance, Order, Trade, Kline, Ticker24h, AnalysisResult, IndicatorData } from '@/lib/api';

// Connection status hook
export function useConnectionStatus() {
  const [status, setStatus] = useState<{
    configured: boolean;
    environment: string;
    loading: boolean;
    error: string | null;
  }>({
    configured: false,
    environment: 'not_configured',
    loading: true,
    error: null,
  });

  const checkStatus = useCallback(async () => {
    try {
      const data = await apiClient.getStatus();
      setStatus({
        configured: data.configured,
        environment: data.environment,
        loading: false,
        error: null,
      });
    } catch (err: any) {
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: err.message || 'Failed to check status',
      }));
    }
  }, []);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  return { ...status, refresh: checkStatus };
}

// Account info hook
export function useAccount(refreshInterval: number = 10000) {
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccount = useCallback(async () => {
    try {
      const res = await apiClient.getAccount();
      if (res.success && res.data) {
        setAccount(res.data);
        setError(null);
      } else {
        setError(res.message || 'Failed to fetch account');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to fetch account');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccount();
    const interval = setInterval(fetchAccount, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchAccount, refreshInterval]);

  return { account, loading, error, refresh: fetchAccount };
}

// Balance hook
export function useBalance(asset?: string) {
  const [balance, setBalance] = useState<Balance | Balance[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = useCallback(async () => {
    try {
      const res = await apiClient.getBalance(asset);
      if (res.success && res.data) {
        setBalance(res.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch balance');
    } finally {
      setLoading(false);
    }
  }, [asset]);

  useEffect(() => {
    fetchBalance();
  }, [fetchBalance]);

  return { balance, loading, error, refresh: fetchBalance };
}

// Ticker hook with real-time updates
export function useTicker(symbol: string, refreshInterval: number = 5000) {
  const [ticker, setTicker] = useState<Ticker24h | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTicker = useCallback(async () => {
    try {
      const res = await apiClient.getTicker24h(symbol);
      if (res.success && res.data) {
        setTicker(res.data as Ticker24h);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ticker');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchTicker();
    const interval = setInterval(fetchTicker, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchTicker, refreshInterval]);

  return { ticker, loading, error, refresh: fetchTicker };
}

// Multiple tickers hook
export function useMultipleTickers(symbols: string[], refreshInterval: number = 5000) {
  const [tickers, setTickers] = useState<Record<string, Ticker24h>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTickers = useCallback(async () => {
    try {
      const results = await Promise.all(
        symbols.map(symbol => apiClient.getTicker24h(symbol))
      );
      
      const tickerMap: Record<string, Ticker24h> = {};
      results.forEach((res, index) => {
        if (res.success && res.data) {
          tickerMap[symbols[index]] = res.data as Ticker24h;
        }
      });
      
      setTickers(tickerMap);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch tickers');
    } finally {
      setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    fetchTickers();
    const interval = setInterval(fetchTickers, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchTickers, refreshInterval]);

  return { tickers, loading, error, refresh: fetchTickers };
}

// Klines/Chart data hook
export function useKlines(symbol: string, interval: string = '1h', limit: number = 100) {
  const [klines, setKlines] = useState<Kline[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKlines = useCallback(async () => {
    try {
      const res = await apiClient.getKlines(symbol, interval, limit);
      if (res.success && res.data) {
        setKlines(res.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch klines');
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, limit]);

  useEffect(() => {
    fetchKlines();
  }, [fetchKlines]);

  return { klines, loading, error, refresh: fetchKlines };
}

// Open orders hook
export function useOpenOrders(symbol?: string, refreshInterval: number = 5000) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const res = await apiClient.getOpenOrders(symbol);
      if (res.success && res.data) {
        setOrders(res.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  }, [symbol]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchOrders, refreshInterval]);

  return { orders, loading, error, refresh: fetchOrders };
}

// Trade history hook
export function useTradeHistory(symbol: string, limit: number = 50) {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTrades = useCallback(async () => {
    try {
      const res = await apiClient.getTradeHistory(symbol, limit);
      if (res.success && res.data) {
        setTrades(res.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch trades');
    } finally {
      setLoading(false);
    }
  }, [symbol, limit]);

  useEffect(() => {
    fetchTrades();
  }, [fetchTrades]);

  return { trades, loading, error, refresh: fetchTrades };
}

// Strategy Analysis hook
export function useAnalysis(symbol: string = 'XAUUSDT', interval: string = '1h', limit: number = 200) {
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalysis = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.analyze(symbol, interval, limit);
      if (res.success && res.data) {
        setAnalysis(res.data);
        setError(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch analysis');
    } finally {
      setLoading(false);
    }
  }, [symbol, interval, limit]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  return { analysis, loading, error, refresh: fetchAnalysis };
}
