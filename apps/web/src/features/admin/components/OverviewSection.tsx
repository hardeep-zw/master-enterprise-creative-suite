import React, { useEffect, useState } from 'react';
import { 
  fetchAdminOverview, 
  type AdminOverviewData 
} from '@web/infrastructure/repositories/adminRepository.js';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  CreditCard, 
  Activity, 
  Server, 
  Check, 
  FileText,
  Loader2
} from 'lucide-react';
import { cn } from '@web/lib/utils.js';

interface OverviewSectionProps {
  onNavigateToSection: (section: string) => void;
}

export const OverviewSection: React.FC<OverviewSectionProps> = ({ onNavigateToSection }) => {
  const [data, setData] = useState<AdminOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const overview = await fetchAdminOverview();
      setData(overview);
    } catch (err: any) {
      console.error('Failed to load admin overview:', err);
      setError(err?.message || 'Failed to load operational overview metrics');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400">
        <Loader2 className="w-6 h-6 animate-spin text-rose-500 mr-2" />
        <span className="text-xs font-mono uppercase tracking-wider">Loading operational metrics...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-sm text-center max-w-lg mx-auto space-y-3">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <p className="text-xs text-slate-300 font-mono">{error || 'Unable to load overview data'}</p>
        <button
          onClick={() => loadData()}
          className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-sm text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  const { curation, payments, system } = data;
  const formattedRevenue = `₹${((payments.totalAmountSubunits || 0) / 100).toLocaleString('en-IN')}`;

  return (
    <div className="space-y-6">
      {/* Header with Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-sm font-bold text-white uppercase tracking-wider font-mono flex items-center gap-2">
            <span>Operational Summary</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time queue volume, payment audit counts, and service states across Writopedia.
          </p>
        </div>
        <button
          onClick={() => loadData(true)}
          disabled={refreshing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-sm text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer self-start sm:self-auto"
        >
          <RefreshCw size={12} className={cn(refreshing && 'animate-spin text-rose-400')} />
          <span>Sync</span>
        </button>
      </div>

      {/* Curation Work Queue Alert Banner if pending */}
      {curation.pendingCount > 0 && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <div>
              <p className="text-xs font-bold text-white">
                {curation.pendingCount} Human Touch {curation.pendingCount === 1 ? 'request is' : 'requests are'} awaiting review
              </p>
              <p className="text-[11px] text-slate-400">
                Customer creative orders are waiting in the operational curation queue.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateToSection('curation')}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
          >
            <span>Open Curation Desk</span>
            <ArrowRight size={13} />
          </button>
        </div>
      )}

      {/* Primary KPI Grid: Grounded in Real DB Records */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pending Curation */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Pending Curation</span>
            <Clock size={14} className="text-amber-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {curation.pendingCount}
          </div>
          <p className="text-[11px] text-slate-400">Unassigned client requests</p>
        </div>

        {/* In Review */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">In Review</span>
            <Activity size={14} className="text-sky-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-sky-400">
            {curation.inReviewCount}
          </div>
          <p className="text-[11px] text-slate-400">Currently assigned to artists</p>
        </div>

        {/* Completed Today */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Completed Today</span>
            <CheckCircle2 size={14} className="text-emerald-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {curation.completedTodayCount}
          </div>
          <p className="text-[11px] text-slate-400">{curation.totalCompletedCount} lifetime fulfilled</p>
        </div>

        {/* Successful Payments */}
        <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-sm space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Captured Payments</span>
            <CreditCard size={14} className="text-rose-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {payments.capturedCount}
          </div>
          <p className="text-[11px] text-slate-400">{formattedRevenue} captured volume</p>
        </div>
      </div>

      {/* Two-Column Operational Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Curation Quick Status */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText size={16} className="text-rose-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Curation Status Breakdown
              </h3>
            </div>
            <button
              onClick={() => onNavigateToSection('curation')}
              className="text-xs text-rose-400 hover:text-rose-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span>View Queue</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/60">
              <span className="text-slate-400">Pending Triage</span>
              <span className="font-bold text-amber-400">{curation.pendingCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/60">
              <span className="text-slate-400">Active Artist Review</span>
              <span className="font-bold text-sky-400">{curation.inReviewCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/60">
              <span className="text-slate-400">Completed & Delivered</span>
              <span className="font-bold text-emerald-400">{curation.totalCompletedCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/60">
              <span className="text-slate-400">Rejected / Cancelled</span>
              <span className="font-bold text-slate-500">{curation.rejectedCount}</span>
            </div>
          </div>
        </div>

        {/* Payment & Billing Status */}
        <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard size={16} className="text-emerald-500" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Payment Transactions
              </h3>
            </div>
            <button
              onClick={() => onNavigateToSection('payments')}
              className="text-xs text-rose-400 hover:text-rose-300 font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer"
            >
              <span>View Ledger</span>
              <ArrowRight size={12} />
            </button>
          </div>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/60">
              <span className="text-slate-400">Successful Captures</span>
              <span className="font-bold text-emerald-400">{payments.capturedCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/60">
              <span className="text-slate-400">Pending / In-Flight</span>
              <span className="font-bold text-amber-400">{payments.createdCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/60">
              <span className="text-slate-400">Failed Authorizations</span>
              <span className="font-bold text-rose-500">{payments.failedCount}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 bg-slate-950/60 rounded border border-slate-800/60">
              <span className="text-slate-400">System Gateway</span>
              <span className="font-bold text-slate-300">Razorpay Production</span>
            </div>
          </div>
        </div>
      </div>

      {/* Service Status Footprint */}
      <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-slate-400">
        <div className="flex items-center gap-2">
          <Server size={14} className="text-slate-500" />
          <span>Database: <strong className="text-white font-semibold">{system.dbStatus}</strong></span>
          <span className="text-slate-600">&bull;</span>
          <span>Resend Email: <strong className="text-white font-semibold">{system.resendConfigured ? 'Ready' : 'Not Set'}</strong></span>
          <span className="text-slate-600">&bull;</span>
          <span>Environment: <strong className="text-white font-semibold">{system.nodeEnv}</strong></span>
        </div>
        <button
          onClick={() => onNavigateToSection('settings')}
          className="text-rose-400 hover:text-rose-300 font-bold uppercase tracking-wider self-start sm:self-auto cursor-pointer"
        >
          Inspect System &rarr;
        </button>
      </div>
    </div>
  );
};
