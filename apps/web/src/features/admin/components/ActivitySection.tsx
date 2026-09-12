import React, { useEffect, useState, useMemo } from 'react';
import { 
  fetchAdminActivity, 
  type AdminActivityItem 
} from '@web/infrastructure/repositories/adminRepository.js';
import { 
  Activity, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  Sparkles, 
  CreditCard, 
  Server, 
  Clock, 
  X,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { cn } from '@web/lib/utils.js';

export const ActivitySection: React.FC = () => {
  const [events, setEvents] = useState<AdminActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'curation' | 'payment' | 'system'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<AdminActivityItem | null>(null);

  const loadEvents = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminActivity(categoryFilter === 'all' ? undefined : categoryFilter);
      setEvents(data);
    } catch (err: any) {
      console.error('Failed to load admin activity:', err);
      setError(err?.message || 'Failed to fetch operational activity logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, [categoryFilter]);

  const filteredEvents = useMemo(() => {
    if (!searchQuery.trim()) return events;
    const q = searchQuery.toLowerCase().trim();
    return events.filter((e) => {
      const actorMatch = e.actor?.toLowerCase().includes(q);
      const actionMatch = e.action?.toLowerCase().includes(q);
      const resourceMatch = e.resourceId?.toLowerCase().includes(q);
      const detailsMatch = e.details?.toLowerCase().includes(q);
      return actorMatch || actionMatch || resourceMatch || detailsMatch;
    });
  }, [events, searchQuery]);

  const formatTimestamp = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'curation':
        return <Sparkles className="w-3.5 h-3.5 text-rose-400" />;
      case 'payment':
        return <CreditCard className="w-3.5 h-3.5 text-emerald-400" />;
      default:
        return <Server className="w-3.5 h-3.5 text-sky-400" />;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'curation':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20">
            {getCategoryIcon(category)}
            Curation
          </span>
        );
      case 'payment':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            {getCategoryIcon(category)}
            Payment
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-sky-500/10 text-sky-400 border border-sky-500/20">
            {getCategoryIcon(category)}
            System
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Activity className="w-5 h-5 text-rose-500" />
            Operational Activity & Audit Trail
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time auditable event stream across Human Touch curation, payments, and system operations.
          </p>
        </div>
        <button
          onClick={() => loadEvents(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-rose-400')} />
          Refresh
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded bg-slate-900/90 border border-slate-800 self-start">
          <button
            onClick={() => setCategoryFilter('all')}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono transition',
              categoryFilter === 'all'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            All Activity
          </button>
          <button
            onClick={() => setCategoryFilter('curation')}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono transition',
              categoryFilter === 'curation'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Curation
          </button>
          <button
            onClick={() => setCategoryFilter('payment')}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono transition',
              categoryFilter === 'payment'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Payments
          </button>
          <button
            onClick={() => setCategoryFilter('system')}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono transition',
              categoryFilter === 'system'
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            System
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter actor, action, resource ID..."
            className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>
      </div>

      {/* Activity List / Table */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-14 rounded bg-slate-900/60 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded bg-rose-950/20 border border-rose-900/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-300 font-mono">{error}</p>
          <button
            onClick={() => loadEvents()}
            className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white transition"
          >
            Retry
          </button>
        </div>
      ) : filteredEvents.length === 0 ? (
        <div className="p-12 rounded bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
          <Activity className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-300">No operational activity recorded</p>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No activity events match "${searchQuery}".`
              : 'No activity records match the selected category.'}
          </p>
        </div>
      ) : (
        <div className="rounded border border-slate-800 bg-slate-900/40 divide-y divide-slate-800/60">
          {filteredEvents.map((evt) => (
            <div
              key={evt.id}
              onClick={() => setSelectedEvent(evt)}
              className="p-3.5 hover:bg-slate-800/40 cursor-pointer transition flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5">{getCategoryBadge(evt.category)}</div>
                <div className="min-w-0 space-y-0.5">
                  <div className="font-medium text-slate-200 break-words">{evt.action}</div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>Actor: <span className="text-slate-400">{evt.actor}</span></span>
                    <span>•</span>
                    <span className="truncate max-w-[200px]" title={evt.resourceId}>
                      Ref: {evt.resourceId}
                    </span>
                  </div>
                  {evt.details && (
                    <p className="text-[11px] text-slate-400 italic pt-0.5 line-clamp-1">
                      {evt.details}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-1 md:pt-0 border-t md:border-t-0 border-slate-800/40">
                <span className="font-mono text-[11px] text-slate-500 whitespace-nowrap">
                  {formatTimestamp(evt.timestamp)}
                </span>
                <span className="text-[11px] font-mono text-slate-400 group-hover:text-rose-400 hidden md:inline">
                  Inspect →
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Slide-over Event Inspector */}
      {selectedEvent && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-slate-100">Event Audit Inspector</h2>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Category</span>
                  {getCategoryBadge(selectedEvent.category)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Status</span>
                  <span className="font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                    {selectedEvent.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Timestamp</span>
                  <span className="font-mono text-slate-300">{formatTimestamp(selectedEvent.timestamp)}</span>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-mono uppercase tracking-wider text-[10px] text-slate-500">Action</h3>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800 font-mono text-slate-200 font-medium">
                  {selectedEvent.action}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-mono uppercase tracking-wider text-[10px] text-slate-500">Actor Identity</h3>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800 font-mono text-slate-300">
                  {selectedEvent.actor}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-mono uppercase tracking-wider text-[10px] text-slate-500">Target Resource</h3>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800 font-mono text-slate-400 break-all">
                  {selectedEvent.resourceId}
                </div>
              </div>

              {selectedEvent.details && (
                <div className="space-y-2">
                  <h3 className="font-mono uppercase tracking-wider text-[10px] text-slate-500">Event Details</h3>
                  <div className="p-3 rounded bg-slate-950/40 border border-slate-800 text-slate-300">
                    {selectedEvent.details}
                  </div>
                </div>
              )}

              <div className="p-3 rounded bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Authoritative audit record sourced directly from PostgreSQL system tables.</span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedEvent(null)}
                className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
