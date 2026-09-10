import React, { useEffect, useState, useCallback } from 'react';
import { ArrowLeft, Coins, RefreshCw, Loader2, ShieldCheck, PlusCircle } from 'lucide-react';
import { fetchCreditLedger, type CreditLedgerTransaction } from '@web/infrastructure/repositories/creditRepository.js';
import { CreditLedgerRow } from '../components/CreditLedgerRow.js';

export interface CreditHistoryPageProps {
  credits: number;
  user: any;
  onLogin: () => void;
  onBack: () => void;
  onTopUp?: () => void;
}

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

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Studio Workspace</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5">
              <Coins className="text-emerald-500" size={24} />
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
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              title="Refresh transaction ledger"
            >
              <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
              <span>Refresh</span>
            </button>

            {onTopUp && (
              <button
                type="button"
                onClick={onTopUp}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
              >
                <PlusCircle size={13} />
                <span>Top-Up</span>
              </button>
            )}
          </div>
        </div>

        {/* Authoritative Balance Overview Card */}
        <div className="p-5 rounded-md bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
              Current Available Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold font-mono text-emerald-400">
                {credits}
              </span>
              <span className="text-sm font-medium text-slate-400">credits</span>
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800/60 border border-slate-700/60 text-[11px] text-slate-400">
            <ShieldCheck size={14} className="text-emerald-400 shrink-0" />
            <span>Authoritative Postgres Ledger · public.credit_ledger</span>
          </div>
        </div>

        {/* Transaction Content Area */}
        {!user ? (
          <div className="py-16 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8">
            <Coins size={32} className="mx-auto text-amber-500/60 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              Sign in to view your credit ledger
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
              Your account transactions, payment grants, and generation credit debits are tied to your authenticated workspace.
            </p>
            <button
              type="button"
              onClick={onLogin}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-sm bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <span>Sign In & Connect</span>
            </button>
          </div>
        ) : loading && transactions.length === 0 ? (
          <div className="py-16 flex flex-col items-center justify-center text-slate-400">
            <Loader2 size={24} className="animate-spin text-emerald-400 mb-3" />
            <p className="text-xs font-medium">Fetching authoritative credit ledger...</p>
          </div>
        ) : error && transactions.length === 0 ? (
          <div className="py-12 text-center rounded-lg border border-rose-900/40 bg-rose-950/10 p-8">
            <p className="text-sm font-medium text-rose-400 mb-3">{error}</p>
            <button
              type="button"
              onClick={loadLedger}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
            >
              <RefreshCw size={12} />
              <span>Retry</span>
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="py-16 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8">
            <Coins size={28} className="mx-auto text-slate-500 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              No credit transactions yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Credits granted upon signup, purchases, and debits for AI generation will be recorded here in this ledger.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Showing {transactions.length} transaction{transactions.length === 1 ? '' : 's'}</span>
              <span className="text-[11px] text-slate-400 font-mono">Immutable append-only ledger</span>
            </div>

            <div className="space-y-2.5" role="feed" aria-label="Credit Transactions Ledger">
              {transactions.map((tx) => (
                <CreditLedgerRow key={tx.id} transaction={tx} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
