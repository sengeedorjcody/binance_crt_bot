import React, { useState, useEffect, useRef } from 'react';
import { 
  Bug, 
  X, 
  ChevronDown, 
  ChevronRight, 
  Copy, 
  Check,
  Trash2,
  Download,
  Terminal,
  Activity,
  Database,
  Wifi,
  Clock,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'request' | 'response' | 'error' | 'info' | 'state';
  method?: string;
  url?: string;
  status?: number;
  duration?: number;
  data?: any;
  message?: string;
}

interface DevInspectorProps {
  isOpen: boolean;
  onClose: () => void;
  state?: Record<string, any>;
  analysis?: any;
  ticker?: any;
  account?: any;
  orders?: any[];
}

// Global log storage
let globalLogs: LogEntry[] = [];
let logListeners: ((logs: LogEntry[]) => void)[] = [];

// Intercept fetch for API logging
const originalFetch = typeof window !== 'undefined' ? window.fetch : null;

if (typeof window !== 'undefined' && originalFetch) {
  window.fetch = async (...args) => {
    const [url, options] = args;
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substr(2, 9);
    
    // Log request
    const logEntry: LogEntry = {
      id: requestId,
      timestamp: new Date(),
      type: 'request',
      method: (options?.method || 'GET').toUpperCase(),
      url: typeof url === 'string' ? url : url.toString(),
    };
    
    addLog(logEntry);
    
    try {
      const response = await originalFetch(...args);
      const duration = Date.now() - startTime;
      
      // Clone response to read body
      const clonedResponse = response.clone();
      let responseData;
      try {
        responseData = await clonedResponse.json();
      } catch {
        responseData = 'Unable to parse response';
      }
      
      // Log response
      addLog({
        id: requestId + '-response',
        timestamp: new Date(),
        type: response.ok ? 'response' : 'error',
        method: logEntry.method,
        url: logEntry.url,
        status: response.status,
        duration,
        data: responseData,
      });
      
      return response;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      
      addLog({
        id: requestId + '-error',
        timestamp: new Date(),
        type: 'error',
        method: logEntry.method,
        url: logEntry.url,
        duration,
        message: error.message,
      });
      
      throw error;
    }
  };
}

function addLog(entry: LogEntry) {
  globalLogs = [entry, ...globalLogs].slice(0, 100); // Keep last 100 logs
  logListeners.forEach(listener => listener([...globalLogs]));
}

export function addDevLog(message: string, data?: any, type: 'info' | 'error' = 'info') {
  addLog({
    id: Math.random().toString(36).substr(2, 9),
    timestamp: new Date(),
    type,
    message,
    data,
  });
}

// JSON Tree Viewer Component
function JsonTree({ data, name, depth = 0 }: { data: any; name?: string; depth?: number }) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  
  if (data === null) return <span className="text-terminal-muted">null</span>;
  if (data === undefined) return <span className="text-terminal-muted">undefined</span>;
  
  const type = Array.isArray(data) ? 'array' : typeof data;
  
  if (type === 'object' || type === 'array') {
    const keys = Object.keys(data);
    const isEmpty = keys.length === 0;
    
    return (
      <div className={depth > 0 ? 'ml-4' : ''}>
        <div 
          className="flex items-center gap-1 cursor-pointer hover:bg-terminal-border/30 rounded px-1 -ml-1"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {!isEmpty && (
            isExpanded ? <ChevronDown className="w-3 h-3 text-terminal-muted" /> : <ChevronRight className="w-3 h-3 text-terminal-muted" />
          )}
          {name && <span className="text-purple-400">{name}: </span>}
          <span className="text-terminal-muted">
            {type === 'array' ? `Array(${keys.length})` : `Object{${keys.length}}`}
          </span>
        </div>
        {isExpanded && !isEmpty && (
          <div className="border-l border-terminal-border/50 ml-1.5 pl-2">
            {keys.map((key) => (
              <JsonTree key={key} name={key} data={data[key]} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }
  
  let valueColor = 'text-white';
  let displayValue = String(data);
  
  if (type === 'string') {
    valueColor = 'text-green-400';
    displayValue = `"${data}"`;
  } else if (type === 'number') {
    valueColor = 'text-yellow-400';
  } else if (type === 'boolean') {
    valueColor = data ? 'text-terminal-accent' : 'text-terminal-danger';
  }
  
  return (
    <div className={depth > 0 ? 'ml-4' : ''}>
      {name && <span className="text-purple-400">{name}: </span>}
      <span className={valueColor}>{displayValue}</span>
    </div>
  );
}

// Main DevInspector Component
export function DevInspector({ isOpen, onClose, state, analysis, ticker, account, orders }: DevInspectorProps) {
  const [activeTab, setActiveTab] = useState<'logs' | 'state' | 'network' | 'performance'>('logs');
  const [logs, setLogs] = useState<LogEntry[]>(globalLogs);
  const [copied, setCopied] = useState(false);
  const [filter, setFilter] = useState<'all' | 'request' | 'response' | 'error' | 'info'>('all');
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const listener = (newLogs: LogEntry[]) => setLogs(newLogs);
    logListeners.push(listener);
    return () => {
      logListeners = logListeners.filter(l => l !== listener);
    };
  }, []);

  const filteredLogs = logs.filter(log => filter === 'all' || log.type === filter);

  const clearLogs = () => {
    globalLogs = [];
    setLogs([]);
  };

  const copyLogs = () => {
    navigator.clipboard.writeText(JSON.stringify(logs, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const exportLogs = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dev-logs-${new Date().toISOString()}.json`;
    a.click();
  };

  const getStatusColor = (status?: number) => {
    if (!status) return 'text-terminal-muted';
    if (status >= 200 && status < 300) return 'text-terminal-accent';
    if (status >= 400) return 'text-terminal-danger';
    return 'text-terminal-warning';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'request': return <Wifi className="w-3 h-3 text-blue-400" />;
      case 'response': return <Check className="w-3 h-3 text-terminal-accent" />;
      case 'error': return <AlertTriangle className="w-3 h-3 text-terminal-danger" />;
      case 'state': return <Database className="w-3 h-3 text-purple-400" />;
      default: return <Terminal className="w-3 h-3 text-terminal-muted" />;
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-terminal-card border-t border-terminal-border shadow-2xl" style={{ height: '40vh' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-terminal-border bg-terminal-bg">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Bug className="w-4 h-4 text-terminal-accent" />
            <span className="font-semibold text-sm">Dev Inspector</span>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1">
            {[
              { id: 'logs', label: 'Console', icon: Terminal },
              { id: 'state', label: 'State', icon: Database },
              { id: 'network', label: 'Network', icon: Wifi },
              { id: 'performance', label: 'Performance', icon: Activity },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-terminal-accent text-terminal-bg'
                    : 'text-terminal-muted hover:text-white hover:bg-terminal-border/50'
                }`}
              >
                <tab.icon className="w-3 h-3" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button onClick={clearLogs} className="p-1.5 rounded hover:bg-terminal-border/50 text-terminal-muted hover:text-white" title="Clear logs">
            <Trash2 className="w-4 h-4" />
          </button>
          <button onClick={copyLogs} className="p-1.5 rounded hover:bg-terminal-border/50 text-terminal-muted hover:text-white" title="Copy logs">
            {copied ? <Check className="w-4 h-4 text-terminal-accent" /> : <Copy className="w-4 h-4" />}
          </button>
          <button onClick={exportLogs} className="p-1.5 rounded hover:bg-terminal-border/50 text-terminal-muted hover:text-white" title="Export logs">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded hover:bg-terminal-border/50 text-terminal-muted hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="h-full overflow-hidden" style={{ height: 'calc(40vh - 45px)' }}>
        {/* Logs Tab */}
        {activeTab === 'logs' && (
          <div className="h-full flex flex-col">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 px-4 py-2 border-b border-terminal-border/50 bg-terminal-bg/50">
              <span className="text-xs text-terminal-muted">Filter:</span>
              {['all', 'request', 'response', 'error', 'info'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f as any)}
                  className={`px-2 py-0.5 rounded text-xs ${
                    filter === f ? 'bg-terminal-accent text-terminal-bg' : 'text-terminal-muted hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
              <span className="ml-auto text-xs text-terminal-muted">{filteredLogs.length} entries</span>
            </div>
            
            {/* Log List */}
            <div className="flex-1 overflow-auto font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="flex items-center justify-center h-full text-terminal-muted">
                  No logs yet. API calls will appear here.
                </div>
              ) : (
                filteredLogs.map((log) => (
                  <div key={log.id} className="px-4 py-2 border-b border-terminal-border/30 hover:bg-terminal-border/20">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(log.type)}
                      <span className="text-terminal-muted">{log.timestamp.toLocaleTimeString()}</span>
                      {log.method && <span className="text-blue-400 font-medium">{log.method}</span>}
                      {log.url && <span className="text-white truncate max-w-md">{log.url}</span>}
                      {log.status && <span className={`${getStatusColor(log.status)}`}>{log.status}</span>}
                      {log.duration && <span className="text-terminal-muted">{log.duration}ms</span>}
                      {log.message && <span className="text-white">{log.message}</span>}
                    </div>
                    {log.data && (
                      <div className="mt-2 pl-5 text-xs">
                        <JsonTree data={log.data} depth={0} />
                      </div>
                    )}
                  </div>
                ))
              )}
              <div ref={logsEndRef} />
            </div>
          </div>
        )}

        {/* State Tab */}
        {activeTab === 'state' && (
          <div className="h-full overflow-auto p-4 font-mono text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-terminal-accent font-semibold mb-2 flex items-center gap-2">
                    <Database className="w-4 h-4" /> App State
                  </h3>
                  <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border">
                    <JsonTree data={state || {}} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-yellow-400 font-semibold mb-2">Ticker Data</h3>
                  <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border">
                    <JsonTree data={ticker || null} />
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h3 className="text-purple-400 font-semibold mb-2">Analysis</h3>
                  <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border max-h-48 overflow-auto">
                    <JsonTree data={{
                      symbol: analysis?.symbol,
                      interval: analysis?.interval,
                      signal_count: analysis?.signal_count,
                      latest_signal: analysis?.latest_signal,
                      volume_profile: analysis?.volume_profile ? {
                        poc: analysis.volume_profile.poc,
                        vah: analysis.volume_profile.vah,
                        val: analysis.volume_profile.val,
                      } : null,
                      indicators_count: analysis?.indicators?.length,
                    }} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-blue-400 font-semibold mb-2">Account</h3>
                  <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border">
                    <JsonTree data={account ? {
                      can_trade: account.can_trade,
                      balances_count: account.balances?.length,
                      top_balances: account.balances?.slice(0, 5).map((b: any) => ({
                        asset: b.asset,
                        total: b.total
                      }))
                    } : null} />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-orange-400 font-semibold mb-2">Open Orders ({orders?.length || 0})</h3>
                  <div className="bg-terminal-bg rounded-lg p-3 border border-terminal-border max-h-32 overflow-auto">
                    <JsonTree data={orders || []} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Network Tab */}
        {activeTab === 'network' && (
          <div className="h-full overflow-auto">
            <table className="w-full text-xs">
              <thead className="bg-terminal-bg sticky top-0">
                <tr className="text-left text-terminal-muted">
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Method</th>
                  <th className="px-4 py-2">URL</th>
                  <th className="px-4 py-2">Time</th>
                  <th className="px-4 py-2">Duration</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {logs.filter(l => l.type === 'response' || l.type === 'error').map((log) => (
                  <tr key={log.id} className="border-b border-terminal-border/30 hover:bg-terminal-border/20">
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded ${
                        log.status && log.status < 300 ? 'bg-terminal-accent/20 text-terminal-accent' :
                        log.status && log.status < 400 ? 'bg-terminal-warning/20 text-terminal-warning' :
                        'bg-terminal-danger/20 text-terminal-danger'
                      }`}>
                        {log.status || 'ERR'}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-blue-400">{log.method}</td>
                    <td className="px-4 py-2 text-white max-w-md truncate">{log.url}</td>
                    <td className="px-4 py-2 text-terminal-muted">{log.timestamp.toLocaleTimeString()}</td>
                    <td className="px-4 py-2">
                      <span className={log.duration && log.duration > 1000 ? 'text-terminal-warning' : 'text-terminal-muted'}>
                        {log.duration}ms
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Performance Tab */}
        {activeTab === 'performance' && (
          <div className="h-full overflow-auto p-4">
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <p className="text-terminal-muted text-xs mb-1">Total API Calls</p>
                <p className="text-2xl font-bold font-mono">{logs.filter(l => l.type === 'request').length}</p>
              </div>
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <p className="text-terminal-muted text-xs mb-1">Errors</p>
                <p className="text-2xl font-bold font-mono text-terminal-danger">{logs.filter(l => l.type === 'error').length}</p>
              </div>
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <p className="text-terminal-muted text-xs mb-1">Avg Response Time</p>
                <p className="text-2xl font-bold font-mono">
                  {(() => {
                    const durations = logs.filter(l => l.duration).map(l => l.duration!);
                    return durations.length ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length) : 0;
                  })()}ms
                </p>
              </div>
              <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
                <p className="text-terminal-muted text-xs mb-1">Success Rate</p>
                <p className="text-2xl font-bold font-mono text-terminal-accent">
                  {(() => {
                    const responses = logs.filter(l => l.type === 'response' || l.type === 'error');
                    const success = responses.filter(l => l.status && l.status < 400).length;
                    return responses.length ? Math.round((success / responses.length) * 100) : 100;
                  })()}%
                </p>
              </div>
            </div>
            
            <div className="bg-terminal-bg rounded-lg p-4 border border-terminal-border">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Response Time Distribution
              </h3>
              <div className="space-y-2">
                {['< 100ms', '100-500ms', '500ms-1s', '> 1s'].map((range, i) => {
                  const durations = logs.filter(l => l.duration).map(l => l.duration!);
                  const count = durations.filter(d => {
                    if (i === 0) return d < 100;
                    if (i === 1) return d >= 100 && d < 500;
                    if (i === 2) return d >= 500 && d < 1000;
                    return d >= 1000;
                  }).length;
                  const pct = durations.length ? (count / durations.length) * 100 : 0;
                  
                  return (
                    <div key={range} className="flex items-center gap-3">
                      <span className="text-xs text-terminal-muted w-20">{range}</span>
                      <div className="flex-1 h-4 bg-terminal-border/30 rounded overflow-hidden">
                        <div 
                          className={`h-full ${i === 0 ? 'bg-terminal-accent' : i === 3 ? 'bg-terminal-danger' : 'bg-terminal-warning'}`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs font-mono w-12 text-right">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Floating Dev Button
export function DevButton({ onClick, isOpen }: { onClick: () => void; isOpen: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`fixed bottom-4 right-4 z-50 p-3 rounded-full shadow-lg transition-all ${
        isOpen 
          ? 'bg-terminal-danger text-white' 
          : 'bg-terminal-accent text-terminal-bg hover:scale-110'
      }`}
      title="Toggle Dev Inspector"
    >
      {isOpen ? <X className="w-5 h-5" /> : <Bug className="w-5 h-5" />}
    </button>
  );
}
