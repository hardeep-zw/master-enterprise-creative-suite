import React from 'react';
import { ArrowLeft, Sparkles, Trash2, LayoutGrid } from 'lucide-react';
import type { HistoryItem } from '../../layout/components/AppSidebar.js';
import { CreativeHistoryRow } from '../components/CreativeHistoryRow.js';

export interface CreativeHistoryPageProps {
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteHistoryItem: (e: React.MouseEvent, id: string) => void;
  onClearHistory: () => void;
  onBack: () => void;
}

export const CreativeHistoryPage: React.FC<CreativeHistoryPageProps> = ({
  history,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  onClearHistory,
  onBack,
}) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
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
              <Sparkles className="text-amber-500" size={24} />
              <span>Creative History</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your generated creative work and prompt history across all studio tools
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-red-50 dark:hover:bg-red-950/40 text-slate-600 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 border border-slate-200 dark:border-slate-700/80 hover:border-red-200 dark:hover:border-red-900/60 text-xs font-bold uppercase tracking-wider transition-all cursor-pointer self-start sm:self-center"
              title="Clear all creative generations from local history"
            >
              <Trash2 size={13} />
              <span>Clear History ({history.length})</span>
            </button>
          )}
        </div>

        {/* Content Area */}
        {history.length === 0 ? (
          <div className="py-16 text-center rounded-lg border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 p-8">
            <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} />
            </div>
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              No creative generations yet
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-5">
              Generations you create using our image, video, presentation, storyline, and copywriting tools will appear here for easy replay and reference.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <LayoutGrid size={14} />
              <span>Open Studio to Generate</span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400 px-1">
              <span>Showing {history.length} generation{history.length === 1 ? '' : 's'}</span>
              <span className="text-[11px] text-slate-400">Click &quot;Replay in Studio&quot; to restore any asset onto the canvas</span>
            </div>

            <div className="space-y-2.5" role="feed" aria-label="Creative Generations List">
              {history.map((item) => (
                <CreativeHistoryRow
                  key={item.id}
                  item={item}
                  onReplay={onSelectHistoryItem}
                  onDelete={onDeleteHistoryItem}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
