import React, { useState } from 'react';
import { Loader2, Key, Server, Eye, EyeOff, ExternalLink } from 'lucide-react';
import apiClient from '@/lib/api';

interface ConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConnected: () => void;
}

export function ConnectModal({ isOpen, onClose, onConnected }: ConnectModalProps) {
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [testnet, setTestnet] = useState(true);
  const [showSecret, setShowSecret] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.connect(apiKey, apiSecret, testnet);
      if (result.success) {
        onConnected();
        onClose();
      } else {
        setError(result.message || 'Connection failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Connection failed');
    } finally {
      setLoading(false);
    }
  };

  const handleConnectFromEnv = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await apiClient.connectFromEnv();
      if (result.success) {
        onConnected();
        onClose();
      } else {
        setError(result.message || 'Connection failed');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'No credentials in environment');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-terminal-card border border-terminal-border rounded-2xl p-8 max-w-md w-full mx-4 animate-slide-up">
        <h2 className="text-2xl font-bold mb-2">Connect to Binance</h2>
        <p className="text-terminal-muted mb-6">
          Enter your API credentials to connect
        </p>

        {/* Quick connect from env */}
        <button
          onClick={handleConnectFromEnv}
          disabled={loading}
          className="w-full mb-6 py-3 rounded-lg border border-terminal-border text-terminal-muted hover:border-terminal-accent hover:text-terminal-accent transition-all flex items-center justify-center gap-2"
        >
          <Server className="w-4 h-4" />
          Connect from Environment
        </button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-terminal-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-terminal-card text-terminal-muted">or enter manually</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* API Key */}
          <div>
            <label className="block text-sm text-terminal-muted mb-1">API Key</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-muted" />
              <input
                type="text"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Enter your API key"
                className="input pl-10"
              />
            </div>
          </div>

          {/* API Secret */}
          <div>
            <label className="block text-sm text-terminal-muted mb-1">API Secret</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-terminal-muted" />
              <input
                type={showSecret ? 'text' : 'password'}
                value={apiSecret}
                onChange={(e) => setApiSecret(e.target.value)}
                placeholder="Enter your API secret"
                className="input pl-10 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-terminal-muted hover:text-white"
              >
                {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Testnet Toggle */}
          <div className="flex items-center justify-between py-2">
            <div>
              <span className="font-medium">Use Testnet</span>
              <p className="text-xs text-terminal-muted">Recommended for testing</p>
            </div>
            <button
              type="button"
              onClick={() => setTestnet(!testnet)}
              className={`w-12 h-6 rounded-full transition-all ${
                testnet ? 'bg-terminal-accent' : 'bg-terminal-border'
              }`}
            >
              <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                testnet ? 'translate-x-6' : 'translate-x-0.5'
              }`} />
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-terminal-danger/10 border border-terminal-danger/30 text-terminal-danger text-sm">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading || !apiKey || !apiSecret}
            className="btn btn-primary w-full py-3"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              'Connect'
            )}
          </button>
        </form>

        {/* Help Link */}
        <div className="mt-6 text-center">
          <a
            href="https://testnet.binance.vision/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-terminal-muted hover:text-terminal-accent transition-colors inline-flex items-center gap-1"
          >
            Get Testnet API Keys
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </div>
  );
}
