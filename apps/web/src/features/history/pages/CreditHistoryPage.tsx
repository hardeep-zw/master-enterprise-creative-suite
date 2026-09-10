import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { ArrowLeft, Coins, RefreshCw, Loader2, PlusCircle, Search, ArrowUpRight, ArrowDownLeft, Wallet, ShieldCheck } from 'lucide-react';
import { fetchCreditLedger, type CreditLedgerTransaction } from '@web/infrastructure/repositories/creditRepository.js';
import { CreditLedgerRow } from '../components/CreditLedgerRow.js';
import { cn } from '@web/lib/utils.js';

export interface CreditHistoryPageProps {
  credits: number;
  user: any;
  onLogin: () => void;
  onBack: () => void;
  onTopUp?: () => void;
}

type FilterType = 'all' | 'credits_added' | 'credits_used';

export const CreditHistoryPage: React.FC<CreditHistoryPageProps> = ({
  credits,
  user,
  onLogin,
  onBack,
  onTopUp,
}) => {
  const [transactions, setTransactions] = useState<CreditLedgerTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const loadLedger = useCallback(async () => {
    if (!user?.uid) {
      setTransactions([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const rows = await fetchCreditLedger(50);
      setTransactions(rows);
    } catch (err: any) {
      setError(err?.message || 'Failed to load credit transaction ledger');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger]);

  // Compute ledger analytics
  const { totalAdded, totalUsed } = useMemo(() => {
    let added = 0;
    let used = 0;
    for (const tx of transactions) {
      if (tx.amount > 0) added += tx.amount;
      else used += Math.abs(tx.amount);
    }
    return { totalAdded: added, totalUsed: used };
  }, [transactions]);

  // Filtered transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      // Type filtering
      if (filterType === 'credits_added' && tx.amount <= 0) return false;
      if (filterType === 'credits_used' && tx.amount >= 0) return false;

      // Search filtering
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const descMatch = tx.description.toLowerCase().includes(q);
        const typeMatch = tx.type.toLowerCase().includes(q);
        if (!descMatch && !typeMatch) return false;
      }

      return true;
    });
  }, [transactions, filterType, searchQuery]);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8 min-h-screen">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Studio Workspace</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                <Coins size={20} />
              </div>
              <span>Credit History</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your credit usage, deduction audit, and payment transaction ledger
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              type="button"
              onClick={loadLedger}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50 shadow-xs"
              title="Refresh transaction ledger"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {onTopUp && (
              <button
                type="button"
                onClick={onTopUp}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
              >
                <PlusCircle size={13} />
                <span>Top-Up</span>
              </button>
            )}
          </div>
        </div>

        {/* Executive Balance Overview Card */}
        <div className="relative overflow-hidden rounded-xl border border-emerald-200/90 dark:border-emerald-800/50 bg-gradient-to-br from-emerald-50/60 via-white to-slate-50 dark:from-emerald-950/30 dark:via-slate-900 dark:to-slate-900/90 p-6 shadow-xs">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
            {/* Left: Main Balance Display */}
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-400 uppercase tracking-widest">
                  Current Available Balance
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-semibold border border-emerald-200 dark:border-emerald-800/40">
                  Active
                </span>
              </div>
              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl md:text-5xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 tracking-tight">
                  {credits}
                </span>
                <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Credits Available
                </span>
              </div>
            </div>

            {/* Right: Metrics & Quick Top-Up */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-4 p-3 rounded-lg bg-white/80 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 backdrop-blur-xs">
                <div className="px-2">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <ArrowUpRight size={13} className="text-emerald-500" />
                    <span>Total Granted</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    +{totalAdded}
                  </div>
                </div>

                <div className="h-8 w-px bg-slate-200 dark:bg-slate-700" />

                <div className="px-2">
                  <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 dark:text-slate-400">
                    <ArrowDownLeft size={13} className="text-slate-400" />
                    <span>Total Debited</span>
                  </div>
                  <div className="text-sm font-mono font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    -{totalUsed}
                  </div>
                </div>
              </div>

              {onTopUp && (
                <button
                  type="button"
                  onClick={onTopUp}
                  className="inline-flex items-center gap-2 px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm hover:shadow-md transition-all cursor-pointer"
                >
                  <PlusCircle size={15} />
                  <span>Add Credits</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                filterType === 'all'
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              All ({transactions.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterType('credits_added')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                filterType === 'credits_added'
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
              )}
            >
              Credits Added
            </button>
            <button
              type="button"
              onClick={() => setFilterType('credits_used')}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                filterType === 'credits_used'
                  ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
            >
              Credits Used
            </button>
          </div>

          {/* Search Input */}
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search transactions..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-xs"
            />
          </div>
        </div>

        {/* Transaction Content Area */}
        {!user ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 shadow-xs">
            <div className="w-12 h-12 rounded-full bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto mb-3">
              <Coins size={28} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Sign in to view your credit ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
              Your account transactions, payment grants, and generation credit debits are tied to your authenticated workspace.
            </p>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <span>Sign In & Connect</span>
            </button>
          </div>
        ) : loading && transactions.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={24} className="animate-spin text-emerald-500 mb-3" />
            <p className="text-xs font-medium">Fetching authoritative credit ledger...</p>
          </div>
        ) : error && transactions.length === 0 ? (
          <div className="py-12 text-center rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/10 p-8">
            <p className="text-sm font-medium text-rose-600 dark:text-rose-400 mb-3">{error}</p>
            <button
              type="button"
              onClick={loadLedger}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 shadow-xs">
            <Coins size={28} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              {searchQuery || filterType !== 'all' ? 'No matching transactions' : 'No credit transactions yet'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              {searchQuery || filterType !== 'all'
                ? 'Try adjusting your search query or switching the activity filter.'
                : 'Credits granted upon signup, purchases, and debits for AI generation will be recorded here.'}
            </p>
            {(searchQuery || filterType !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setFilterType('all');
                  setSearchQuery('');
                }}
                className="px-3.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Reset Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Showing {filteredTransactions.length} of {transactions.length} transaction{transactions.length === 1 ? '' : 's'}</span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Immutable append-only ledger</span>
            </div>

            <div className="space-y-2.5" role="feed" aria-label="Credit Transactions Ledger">
              {filteredTransactions.map((tx) => (
                <CreditLedgerRow key={tx.id} transaction={tx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
