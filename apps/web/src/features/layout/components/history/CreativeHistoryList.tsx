import React from 'react';
import { Trash2 } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import type { HistoryItem } from '../AppSidebar.js';
import {
  getGemIcon,
  getGemName,
  getCreativeDisplayTitle,
  formatRelativeTime
} from './historyFormatters.js';

export interface CreativeHistoryListProps {
  history: HistoryItem[];
  onSelectHistoryItem: (item: HistoryItem) => void;
  onDeleteHistoryItem: (e: React.MouseEvent, id: string) => void;
  sidebarOpen: boolean;
}

export const CreativeHistoryList: React.FC<CreativeHistoryListProps> = ({
  history,
  onSelectHistoryItem,
  onDeleteHistoryItem,
  sidebarOpen,
}) => {
  if (history.length === 0) {
    return (
      <div className="px-3 py-6 text-center">
        <p className="text-[11px] text-slate-400 dark:text-slate-500 italic">
          No creative generations yet.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-0.5 py-1" role="feed" aria-label="Creative generation history">
      {history.map((item) => {
        const IconComponent = getGemIcon(item.gemId);
        const title = getCreativeDisplayTitle(item);
        const toolName = getGemName(item.gemId);
        const timeStr = formatRelativeTime(item.timestamp);

        return (
          <div key={item.id} className="group relative">
            <button
              type="button"
              onClick={() => onSelectHistoryItem(item)}
              title={`${title}\n${toolName} · ${timeStr}`}
              className={cn(
                "w-full flex items-start gap-2.5 px-2.5 py-2 rounded-sm text-left transition-colors cursor-pointer",
                "text-slate-600 dark:text-slate-400 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-slate-200",
                !sidebarOpen && "justify-center px-2"
              )}
            >
              <div className="mt-0.5 shrink-0 text-slate-400 group-hover:text-amber-400 transition-colors">
                <IconComponent size={14} />
              </div>

              {sidebarOpen && (
                <div className="min-w-0 flex-1 pr-5">
                  <p className="text-xs font-medium text-slate-200 truncate leading-snug">
                    {title}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5 leading-none">
                    {toolName} {timeStr ? `· ${timeStr}` : ''}
                  </p>
                </div>
              )}
            </button>

            {sidebarOpen && (
              <button
                type="button"
                onClick={(e) => onDeleteHistoryItem(e, item.id)}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer rounded-xs"
                title="Delete generation entry"
                aria-label={`Delete ${title}`}
              >
                <Trash2 size={12} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
