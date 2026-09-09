import React, { useEffect, useState, useCallback } from 'react';
import { ArrowUpRight, ArrowDownLeft, Coins, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import { fetchCreditLedger, type CreditLedgerTransaction } from '@web/infrastructure/repositories/creditRepository.js';
import { formatLedgerTime } from './historyFormatters.js';

export interface CreditHistoryListProps {
  user: any;
  onLogin: () => void;
  sidebarOpen: boolean;
  refreshTrigger?: number;
}

export const CreditHistoryList: React.FC<CreditHistoryListProps> = ({
  user,
  onLogin,
  sidebarOpen,
  refreshTrigger,
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
      const rows = await fetchCreditLedger(30);
      setTransactions(rows);
    } catch (err: any) {
      setError(err?.message || 'Failed to load credit history');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadLedger();
  }, [loadLedger, refreshTrigger]);

  if (!user) {
    return (
      <div className="px-3 py-6 text-center">
        <Coins size={20} className="mx-auto text-amber-500/60 mb-2" />
        <p className="text-[11px] text-slate-400 mb-2">Sign in to view credit ledger</p>
        <button
          type="button"
          onClick={onLogin}
          className="text-[10px] font-semibold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider transition-colors cursor-pointer"
        >
          Sign In
        </button>
      </div>
    );
  }

  if (loading && transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-slate-500">
        <Loader2 size={16} className="animate-spin text-amber-400 mb-2" />
        <p className="text-[11px] text-slate-400">Loading ledger...</p>
      </div>
    );
  }

  if (error && transactions.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <p className="text-[11px] text-rose-400/90 mb-2">Unable to load credit history</p>
        <button
          type="button"
          onClick={loadLedger}
          className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-400 hover:text-slate-200 uppercase tracking-wider transition-colors cursor-pointer"
        >
          <RefreshCw size={10} />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          No credit activity yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1 py-1" role="feed" aria-label="Credit transaction ledger">
      {transactions.map((tx) => {
        const isCredit = tx.amount > 0;
        const timeStr = formatLedgerTime(tx.createdAt);

        return (
          <div
            key={tx.id}
            className={cn(
              "flex items-start justify-between gap-2 px-2.5 py-2 rounded-sm transition-colors",
              "hover:bg-slate-100/60 dark:hover:bg-slate-800/60",
              !sidebarOpen && "justify-center px-1"
            )}
            title={`${tx.description}\nAmount: ${isCredit ? '+' : ''}${tx.amount} credits\nBalance: ${tx.resultingBalance}\nTime: ${timeStr}`}
          >
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <div
                className={cn(
                  "mt-0.5 shrink-0 rounded-xs p-0.5",
                  isCredit ? "text-emerald-400" : "text-slate-400"
                )}
              >
                {isCredit ? <ArrowUpRight size={13} /> : <ArrowDownLeft size={13} />}
              </div>

              {sidebarOpen && (
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-medium text-slate-200 truncate leading-snug">
                    {tx.description}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-none">
                    {timeStr}
                    {typeof tx.resultingBalance === 'number' && (
                      <span className="text-slate-400 ml-1.5 font-mono">
                        · Bal: {tx.resultingBalance}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>

            {sidebarOpen && (
              <div className="shrink-0 text-right font-mono text-xs font-semibold pl-1">
                <span
                  className={cn(
                    isCredit
                      ? "text-emerald-400"
                      : "text-slate-300 dark:text-slate-300"
                  )}
                >
                  {isCredit ? `+${tx.amount}` : tx.amount}
                </span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
