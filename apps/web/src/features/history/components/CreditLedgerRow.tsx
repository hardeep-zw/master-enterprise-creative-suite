import React from 'react';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import type { CreditLedgerTransaction } from '@web/infrastructure/repositories/creditRepository.js';
import { formatLedgerTime } from '../utils/historyFormatters.js';

export interface CreditLedgerRowProps {
  transaction: CreditLedgerTransaction;
}

export const CreditLedgerRow: React.FC<CreditLedgerRowProps> = ({ transaction }) => {
  const isCredit = transaction.amount > 0;
  const timeStr = formatLedgerTime(transaction.createdAt);

  return (
    <div className="flex items-center justify-between gap-4 p-4 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-md transition-all shadow-xs">
      {/* Left: Indicator Icon & Transaction Details */}
      <div className="flex items-center gap-3.5 min-w-0 flex-1">
        <div
          className={cn(
            "p-2.5 rounded-sm shrink-0 border",
            isCredit
              ? "bg-emerald-950/30 text-emerald-400 border-emerald-900/40"
              : "bg-slate-800/80 text-slate-400 border-slate-700/60"
          )}
        >
          {isCredit ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-0.5">
            <h4 className="text-sm font-semibold text-slate-100 truncate">
              {transaction.description}
            </h4>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700/50 uppercase">
              {transaction.type.replace(/_/g, ' ')}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            {timeStr}
          </p>
        </div>
      </div>

      {/* Right: Amount & Resulting Balance Snapshot */}
      <div className="text-right shrink-0">
        <div
          className={cn(
            "font-mono text-base font-bold",
            isCredit ? "text-emerald-400" : "text-slate-200"
          )}
        >
          {isCredit ? `+${transaction.amount}` : transaction.amount} Credits
        </div>

        {typeof transaction.resultingBalance === 'number' && (
          <p className="text-[11px] font-mono text-slate-400 mt-0.5">
            Balance after: <span className="text-slate-300 font-semibold">{transaction.resultingBalance}</span>
          </p>
        )}
      </div>
    </div>
  );
};
