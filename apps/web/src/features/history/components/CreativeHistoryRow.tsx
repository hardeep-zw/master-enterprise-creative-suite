import React from 'react';
import { RotateCcw, Trash2, Calendar, Sparkles } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import type { HistoryItem } from '../../layout/components/AppSidebar.js';
import {
  getGemIcon,
  getGemName,
  getCreativeDisplayTitle,
  formatRelativeTime,
  formatLedgerTime
} from '../utils/historyFormatters.js';

export interface CreativeHistoryRowProps {
  item: HistoryItem;
  onReplay: (item: HistoryItem) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
}

export const CreativeHistoryRow: React.FC<CreativeHistoryRowProps> = ({
  item,
  onReplay,
  onDelete,
}) => {
  const IconComponent = getGemIcon(item.gemId);
  const title = getCreativeDisplayTitle(item);
  const toolName = getGemName(item.gemId);
  const relativeTime = formatRelativeTime(item.timestamp);
  const exactTime = formatLedgerTime(item.timestamp);

  return (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4.5 bg-slate-900/60 hover:bg-slate-900/90 border border-slate-800/80 hover:border-slate-700 rounded-md transition-all shadow-xs">
      {/* Left & Center: Tool Icon + Content Details */}
      <div className="flex items-start gap-3.5 min-w-0 flex-1">
        <div className="p-2.5 rounded-sm bg-slate-800/80 border border-slate-700/60 text-amber-400 shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
          <IconComponent size={18} />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-sm sm:text-base font-semibold text-slate-100 truncate">
              {title}
            </h3>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700/60">
              {toolName}
            </span>
          </div>

          {item.prompt && (
            <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-2 font-normal">
              {item.prompt}
            </p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-slate-400">
            <span className="flex items-center gap-1">
              <Calendar size={11} className="text-slate-400" />
              <span>{relativeTime}</span>
              {exactTime && <span className="text-slate-400 hidden sm:inline">({exactTime})</span>}
            </span>
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        <button
          type="button"
          onClick={() => onReplay(item)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-rose-600/90 hover:bg-rose-600 text-white text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
          title="Open and restore this generation in the studio canvas"
        >
          <RotateCcw size={12} />
          <span>Replay in Studio</span>
        </button>

        <button
          type="button"
          onClick={(e) => onDelete(e, item.id)}
          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-colors cursor-pointer"
          title="Delete generation entry"
          aria-label={`Delete ${title}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
