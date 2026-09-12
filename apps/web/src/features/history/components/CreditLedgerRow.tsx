import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import type { CreditLedgerTransaction } from '@web/infrastructure/repositories/creditRepository.js';
import { formatLedgerTime } from '../utils/historyFormatters.js';

export interface CreditLedgerRowProps {
  transaction: CreditLedgerTransaction;
}

/**
 * Parses raw backend strings into clean, human-readable titles and subtitles.
 */
function parseTransactionDescription(desc: string) {
  // Payment fulfillment pattern
  const paymentMatch = desc.match(/Payment fulfillment for ([^(]+)(?:\(([^)]+)\))?/i);
  if (paymentMatch) {
    const plan = paymentMatch[1]?.trim() || 'Subscription Payment';
    const rawDetails = paymentMatch[2] || '';
    const orderMatch = rawDetails.match(/Order:\s*([a-zA-Z0-9_-]+)/);
    const orderRef = orderMatch ? `Ref: #${orderMatch[1].slice(-8)}` : undefined;
    return {
      title: plan,
      subDetail: orderRef || 'Credit Grant'
    };
  }

  // AI model generation debit patterns
  const aiMatch = desc.match(/AI Generation \(([^)]+)\)/i);
  if (aiMatch) {
    return {
      title: 'AI Prompt Generation',
      subDetail: aiMatch[1]
    };
  }

  const imgMatch = desc.match(/Image Generation \(([^)]+)\)/i);
  if (imgMatch) {
    return {
      title: 'Image Generation',
      subDetail: imgMatch[1]
    };
  }

  const vidMatch = desc.match(/Video Generation \(([^)]+)\)/i);
  if (vidMatch) {
    return {
      title: 'Video Generation',
      subDetail: vidMatch[1]
    };
  }

  return {
    title: desc,
    subDetail: undefined
  };
}

export const CreditLedgerRow: React.FC<CreditLedgerRowProps> = ({ transaction }) => {
  const isCredit = transaction.amount > 0;
  const timeStr = formatLedgerTime(transaction.createdAt);
  const parsed = parseTransactionDescription(transaction.description);

  return (
    <div className="group flex items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900/80 hover:bg-slate-50/80 dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 rounded-lg transition-all shadow-xs hover:shadow-sm">
      {/* Left: Indicator Icon & Transaction Details */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={cn(
            "p-2.5 rounded-md shrink-0 border transition-transform group-hover:scale-105",
            isCredit
              ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border-emerald-200/90 dark:border-emerald-800/60 shadow-xs"
              : "bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-700/60"
          )}
        >
          {isCredit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              {parsed.title}
            </h4>
            <span
              className={cn(
                "text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider",
                isCredit
                  ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200/80 dark:border-emerald-800/50"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700/60"
              )}
            >
              {transaction.type.replace(/_/g, ' ')}
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {parsed.subDetail && (
              <>
                <span className="font-medium text-slate-600 dark:text-slate-300">{parsed.subDetail}</span>
                <span>·</span>
              </>
            )}
            <span>{timeStr}</span>
          </div>
        </div>
      </div>

      {/* Right: Amount & Resulting Balance Snapshot */}
      <div className="text-right shrink-0">
        <div
          className={cn(
            "font-mono text-base font-bold tracking-tight",
            isCredit ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-slate-200"
          )}
        >
          {isCredit ? `+${transaction.amount}` : transaction.amount}{' '}
          <span className="text-xs font-normal text-slate-500 dark:text-slate-400">Credits</span>
        </div>

        {typeof transaction.resultingBalance === 'number' && (
          <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
            Balance after: <span className="text-slate-800 dark:text-slate-200 font-semibold">{transaction.resultingBalance}</span>
          </p>
        )}
      </div>
    </div>
  );
};
