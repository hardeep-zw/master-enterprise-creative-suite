import React, { useState } from 'react';
import { History } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import { safeGetItem, safeSetItem } from '@web/lib/storage.js';
import type { HistoryItem } from '../AppSidebar.js';
import { HistorySwitcher, type HistoryTab } from './HistorySwitcher.js';
import { CreativeHistoryList } from './CreativeHistoryList.js';
import { CreditHistoryList } from './CreditHistoryList.js';

export interface HistorySectionProps {
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteHistoryItem: (e: React.MouseEvent, id: string) => void;
  onClearHistory: () => void;
  credits: number;
  user: any;
  onLogin: () => void;
  sidebarOpen: boolean;
  onExpandSidebar?: () => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({
  history,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  credits,
  user,
  onLogin,
  sidebarOpen,
  onExpandSidebar,
}) => {
  const [activeTab, setActiveTab] = useState<HistoryTab>(() => {
    const saved = safeGetItem<string>('sidebar_history_tab', 'creative');
    return saved === 'credit' ? 'credit' : 'creative';
  });

  const handleTabChange = (tab: HistoryTab) => {
    setActiveTab(tab);
    safeSetItem('sidebar_history_tab', tab);
  };

  // Collapsed rail display
  if (!sidebarOpen) {
    return (
      <div className="pt-6 pb-2">
        <button
          type="button"
          onClick={onExpandSidebar}
          className="w-full flex items-center justify-center p-2 rounded-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors cursor-pointer"
          title={`History (${history.length} creative, ${credits} credits)`}
          aria-label="Expand History"
        >
          <History size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="pt-6 pb-2 space-y-2.5">
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="text-[11px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
          <History size={12} className="text-slate-400" />
          <span>History</span>
        </div>

        {/* Clear Action: Strictly restricted to Creative History */}
        {activeTab === 'creative' && history.length > 0 && (
          <button
            type="button"
            onClick={onClearHistory}
            className="text-[10px] font-bold text-slate-400 hover:text-red-400 uppercase tracking-widest transition-colors flex items-center gap-1 cursor-pointer"
            title="Clear all creative generations from local history"
          >
            Clear
          </button>
        )}
      </div>

      {/* Compact Segmented Switcher */}
      <HistorySwitcher
        activeTab={activeTab}
        onChange={handleTabChange}
        creativeCount={history.length}
        creditBalance={credits}
      />

      {/* Constrained Independent Scrollable Container */}
      <div className="max-h-[300px] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent rounded-xs pr-0.5">
        {activeTab === 'creative' ? (
          <CreativeHistoryList
            history={history}
            onSelectHistoryItem={onSelectHistoryItem}
            onDeleteHistoryItem={onDeleteHistoryItem}
            sidebarOpen={sidebarOpen}
          />
        ) : (
          <CreditHistoryList
            user={user}
            onLogin={onLogin}
            sidebarOpen={sidebarOpen}
            refreshTrigger={credits}
          />
        )}
      </div>
    </div>
  );
};
