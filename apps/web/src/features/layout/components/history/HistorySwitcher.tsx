import React from 'react';
import { cn } from '@web/lib/utils.js';
import { Sparkles, Coins } from 'lucide-react';

export type HistoryTab = 'creative' | 'credit';

export interface HistorySwitcherProps {
  activeTab: HistoryTab;
  onChange: (tab: HistoryTab) => void;
  creativeCount?: number;
  creditBalance?: number;
}

export const HistorySwitcher: React.FC<HistorySwitcherProps> = ({
  activeTab,
  onChange,
  creativeCount,
  creditBalance,
}) => {
  return (
    <div 
      className="flex items-center p-0.5 bg-slate-900/80 border border-slate-800/80 rounded-md text-[11px] font-medium"
      role="tablist"
      aria-label="History category switcher"
    >
      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'creative'}
        onClick={() => onChange('creative')}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-sm transition-all duration-150 cursor-pointer select-none",
          activeTab === 'creative'
            ? "bg-slate-800 text-slate-100 font-semibold shadow-xs"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        )}
      >
        <Sparkles size={12} className={cn(activeTab === 'creative' ? "text-amber-400" : "text-slate-500")} />
        <span>Creative</span>
        {typeof creativeCount === 'number' && creativeCount > 0 && (
          <span className="ml-1 text-[9px] px-1 py-0.2 rounded-full bg-slate-700/60 text-slate-300 font-mono">
            {creativeCount}
          </span>
        )}
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={activeTab === 'credit'}
        onClick={() => onChange('credit')}
        className={cn(
          "flex-1 flex items-center justify-center gap-1.5 py-1 px-2 rounded-sm transition-all duration-150 cursor-pointer select-none",
          activeTab === 'credit'
            ? "bg-slate-800 text-slate-100 font-semibold shadow-xs"
            : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
        )}
      >
        <Coins size={12} className={cn(activeTab === 'credit' ? "text-emerald-400" : "text-slate-500")} />
        <span>Credits</span>
        {typeof creditBalance === 'number' && (
          <span className="ml-1 text-[9px] px-1 py-0.2 rounded-full bg-slate-700/60 text-emerald-300/90 font-mono">
            {creditBalance}
          </span>
        )}
      </button>
    </div>
  );
};
