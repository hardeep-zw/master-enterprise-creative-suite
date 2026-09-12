import React, { useEffect, useState, useMemo } from 'react';
import { 
  fetchAdminPayments, 
  type AdminPaymentItem 
} from '@web/infrastructure/repositories/adminRepository.js';
import { 
  CreditCard, 
  Search, 
  RefreshCw, 
  AlertCircle, 
  Loader2, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  ArrowUpRight,
  ShieldAlert,
  Info,
  X
} from 'lucide-react';
import { cn } from '@web/lib/utils.js';

export const PaymentsSection: React.FC = () => {
  const [payments, setPayments] = useState<AdminPaymentItem[]>([]);
  const [metrics, setMetrics] = useState<{
    capturedCount: number;
    createdCount: number;
    failedCount: number;
    totalAmountSubunits: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'captured' | 'created' | 'failed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPayment, setSelectedPayment] = useState<AdminPaymentItem | null>(null);

  const loadPayments = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchAdminPayments(statusFilter === 'all' ? undefined : statusFilter);
      setPayments(data.payments || []);
      setMetrics(data.metrics || null);
    } catch (err: any) {
      console.error('Failed to load admin payments:', err);
      setError(err?.message || 'Failed to load payment transactions from server');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, [statusFilter]);

  const filteredPayments = useMemo(() => {
    if (!searchQuery.trim()) return payments;
    const q = searchQuery.toLowerCase().trim();
    return payments.filter((p) => {
      const orderMatch = p.orderId?.toLowerCase().includes(q);
      const paymentMatch = p.paymentId?.toLowerCase().includes(q);
      const emailMatch = p.userEmail?.toLowerCase().includes(q);
      const planMatch = p.planId?.toLowerCase().includes(q);
      return orderMatch || paymentMatch || emailMatch || planMatch;
    });
  }, [payments, searchQuery]);

  const formatAmount = (subunits: number, currency: string) => {
    const val = (subunits || 0) / 100;
    if (currency === 'INR') {
      return `₹${val.toLocaleString('en-IN')}`;
    }
    return `$${val.toFixed(2)}`;
  };

  const formatDate = (iso: string) => {
    if (!iso) return '—';
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return iso;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'captured':
      case 'paid':
      case 'successful':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Paid
          </span>
        );
      case 'created':
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-slate-800 text-slate-300 border border-slate-700">
            {status}
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
            <CreditCard className="w-5 h-5 text-rose-500" />
            Payments & Billing Audit
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Authoritative transactional history from payment gateways and subscription orders. Read-only audit log.
          </p>
        </div>
        <button
          onClick={() => loadPayments(true)}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition self-start sm:self-auto disabled:opacity-50"
        >
          <RefreshCw className={cn('w-3.5 h-3.5', refreshing && 'animate-spin text-rose-400')} />
          Refresh
        </button>
      </div>

      {/* Security Scope Notice */}
      <div className="flex items-start gap-3 p-3.5 rounded bg-slate-900/60 border border-slate-800 text-xs text-slate-400">
        <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        <p>
          <strong className="text-slate-300">Operations Notice:</strong> This view reflects authoritative gateway transactions. In accordance with platform governance, arbitrary credit balance editing and gateway mutation are quarantined from the operations console.
        </p>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="p-3.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Captured / Successful</div>
            <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">{metrics.capturedCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Settled orders</div>
          </div>
          <div className="p-3.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Pending Authorization</div>
            <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{metrics.createdCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Awaiting capture/webhook</div>
          </div>
          <div className="p-3.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Failed / Rejected</div>
            <div className="text-2xl font-bold text-rose-400 mt-1 font-mono">{metrics.failedCount}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Incomplete attempts</div>
          </div>
          <div className="p-3.5 rounded bg-slate-900/80 border border-slate-800">
            <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">Total Captured Volume</div>
            <div className="text-2xl font-bold text-slate-100 mt-1 font-mono">
              {formatAmount(metrics.totalAmountSubunits, 'INR')}
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Authoritative revenue</div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 rounded bg-slate-900/90 border border-slate-800 self-start">
          <button
            onClick={() => setStatusFilter('all')}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono transition',
              statusFilter === 'all'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            All
          </button>
          <button
            onClick={() => setStatusFilter('captured')}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono transition',
              statusFilter === 'captured'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Captured
          </button>
          <button
            onClick={() => setStatusFilter('created')}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono transition',
              statusFilter === 'created'
                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Pending
          </button>
          <button
            onClick={() => setStatusFilter('failed')}
            className={cn(
              'px-3 py-1 rounded text-xs font-mono transition',
              statusFilter === 'failed'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'text-slate-400 hover:text-slate-200'
            )}
          >
            Failed
          </button>
        </div>

        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search email, order, plan, ID..."
            className="w-full pl-8 pr-3 py-1.5 rounded bg-slate-900/90 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500/50"
          />
        </div>
      </div>

      {/* Main Table / Skeletons / Error */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <div key={n} className="h-12 rounded bg-slate-900/60 border border-slate-800/60 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="p-8 rounded bg-rose-950/20 border border-rose-900/30 text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
          <p className="text-xs text-rose-300 font-mono">{error}</p>
          <button
            onClick={() => loadPayments()}
            className="px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-500 text-xs font-medium text-white transition"
          >
            Retry
          </button>
        </div>
      ) : filteredPayments.length === 0 ? (
        <div className="p-12 rounded bg-slate-900/40 border border-slate-800/80 text-center space-y-2">
          <CreditCard className="w-8 h-8 text-slate-600 mx-auto" />
          <p className="text-sm font-medium text-slate-300">No payment records found</p>
          <p className="text-xs text-slate-500">
            {searchQuery
              ? `No transactions matched your search "${searchQuery}".`
              : 'No payment transactions recorded for this filter criteria.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-800 bg-slate-900/40">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/90 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <th className="py-2.5 px-3">Date</th>
                <th className="py-2.5 px-3">Customer</th>
                <th className="py-2.5 px-3">Plan</th>
                <th className="py-2.5 px-3">Amount</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Order / Payment ID</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredPayments.map((p) => (
                <tr 
                  key={p.id}
                  onClick={() => setSelectedPayment(p)}
                  className="hover:bg-slate-800/40 cursor-pointer transition group"
                >
                  <td className="py-3 px-3 font-mono text-slate-400 whitespace-nowrap">
                    {formatDate(p.createdAt)}
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-mono text-slate-200">
                      {p.userEmail || 'Authenticated Client'}
                    </span>
                  </td>
                  <td className="py-3 px-3">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 font-mono text-[11px] text-slate-300">
                      {p.planId}
                    </span>
                  </td>
                  <td className="py-3 px-3 font-mono font-medium text-slate-200 whitespace-nowrap">
                    {formatAmount(p.amountSubunits, p.currency)} <span className="text-[10px] text-slate-500">{p.currency}</span>
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {getStatusBadge(p.status)}
                  </td>
                  <td className="py-3 px-3 font-mono text-[11px] text-slate-400">
                    <div className="truncate max-w-[160px]" title={p.paymentId || p.orderId}>
                      {p.paymentId ? p.paymentId : p.orderId}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-right whitespace-nowrap">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPayment(p);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-400 hover:text-rose-400 transition"
                    >
                      Audit
                      <ArrowUpRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Slide-over Payment Audit Inspector */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 space-y-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-rose-500" />
                <h2 className="text-base font-bold text-slate-100">Transaction Audit</h2>
              </div>
              <button
                onClick={() => setSelectedPayment(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-4 rounded bg-slate-950/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Status</span>
                  {getStatusBadge(selectedPayment.status)}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Settled Amount</span>
                  <span className="font-mono text-base font-bold text-slate-100">
                    {formatAmount(selectedPayment.amountSubunits, selectedPayment.currency)} {selectedPayment.currency}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Tier / Plan</span>
                  <span className="font-mono text-slate-200">{selectedPayment.planId}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 uppercase tracking-wider font-mono text-[10px]">Recorded At</span>
                  <span className="font-mono text-slate-300">{formatDate(selectedPayment.createdAt)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h3 className="font-mono uppercase tracking-wider text-[10px] text-slate-500">Customer Identity</h3>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800 font-mono text-slate-300">
                  {selectedPayment.userEmail || 'Authenticated Client Account'}
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-mono uppercase tracking-wider text-[10px] text-slate-500">Identifiers</h3>
                <div className="p-3 rounded bg-slate-950/40 border border-slate-800 space-y-2 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-500 block text-[10px]">ORDER REFERENCE:</span>
                    <span className="text-slate-300 break-all">{selectedPayment.orderId}</span>
                  </div>
                  {selectedPayment.paymentId && (
                    <div>
                      <span className="text-slate-500 block text-[10px]">PAYMENT GATEWAY ID:</span>
                      <span className="text-slate-300 break-all">{selectedPayment.paymentId}</span>
                    </div>
                  )}
                  <div>
                    <span className="text-slate-500 block text-[10px]">INTERNAL RECORD ID:</span>
                    <span className="text-slate-300 break-all">{selectedPayment.id}</span>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded bg-amber-500/5 border border-amber-500/20 text-amber-300 text-[11px] space-y-1">
                <div className="font-medium flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                  Audit Protocol
                </div>
                <p className="text-slate-400">
                  Payment records cannot be altered or purged from the admin panel to maintain full PCI/regulatory audit trail integrity.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedPayment(null)}
                className="w-full py-2 rounded bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-200 border border-slate-700 transition"
              >
                Close Audit View
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
