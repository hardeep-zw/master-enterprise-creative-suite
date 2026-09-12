import React, { useState } from 'react';
import { RotateCcw, Trash2, Calendar, Eye, Copy, Check, Sparkles, Film, Image as ImageIcon, AudioWaveform } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import type { HistoryItem } from '../../layout/components/AppSidebar.js';
import {
  getGemIcon,
  getGemName,
  getCreativeDisplayTitle,
  formatRelativeTime,
  formatLedgerTime,
  extractHistoryMedia,
  getGemCategory
} from '../utils/historyFormatters.js';

export interface CreativeHistoryRowProps {
  item: HistoryItem;
  onReplay: (item: HistoryItem) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onPreviewMedia?: (mediaUrl: string, item: HistoryItem) => void;
}

export const CreativeHistoryRow: React.FC<CreativeHistoryRowProps> = ({
  item,
  onReplay,
  onDelete,
  onPreviewMedia,
}) => {
  const [copied, setCopied] = useState(false);
  const [imageError, setImageError] = useState(false);
  const IconComponent = getGemIcon(item.gemId);
  const title = getCreativeDisplayTitle(item);
  const toolName = getGemName(item.gemId);
  const category = getGemCategory(item.gemId);
  const relativeTime = formatRelativeTime(item.timestamp);
  const exactTime = formatLedgerTime(item.timestamp);
  const media = extractHistoryMedia(item);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.prompt) return;
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Badge styling per category
  const badgeStyle = {
    image: 'bg-sky-50 dark:bg-sky-950/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-800/50',
    video: 'bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800/50',
    audio: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50',
    deck_copy: 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/50',
  }[category] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700';

  const hasVisualMedia = media?.previewUrl && !imageError;

  return (
    <div className="group flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900/80 hover:bg-slate-50/80 dark:hover:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 rounded-xl transition-all shadow-xs hover:shadow-sm">
      {/* Left: Media Thumbnail or Gem Icon + Details */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        {/* Visual Media Thumbnail (if available) or Icon */}
        {hasVisualMedia ? (
          <div
            onClick={() => onPreviewMedia?.(media.url || media.previewUrl!, item)}
            className="relative w-16 h-16 sm:w-18 sm:h-18 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 shrink-0 cursor-pointer group/thumb shadow-xs"
            title="Click to preview full resolution"
          >
            {media.type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-purple-400">
                <Film size={24} />
              </div>
            ) : (
              <img
                src={media.previewUrl}
                alt=""
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center text-white">
              <Eye size={16} />
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/60 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5 shadow-xs group-hover:scale-105 transition-transform">
            <IconComponent size={20} />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
              {title}
            </h3>
            <span className={cn("text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider", badgeStyle)}>
              {toolName}
            </span>
            {media?.model && (
              <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">
                {media.model}
              </span>
            )}
          </div>

          {item.prompt && (
            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed mb-2 font-normal">
              {item.prompt}
            </p>
          )}

          <div className="flex items-center gap-3 text-[11px] text-slate-400 dark:text-slate-500">
            <span className="flex items-center gap-1">
              <Calendar size={12} />
              <span>{relativeTime}</span>
              {exactTime && <span className="hidden sm:inline">({exactTime})</span>}
            </span>

            {item.prompt && (
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="inline-flex items-center gap-1 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
                title="Copy generation prompt"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                <span>{copied ? 'Copied' : 'Copy prompt'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
        {media?.url && onPreviewMedia && (
          <button
            type="button"
            onClick={() => onPreviewMedia(media.url!, item)}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title="Preview output"
            aria-label="Preview output"
          >
            <Eye size={16} />
          </button>
        )}

        <button
          type="button"
          onClick={() => onReplay(item)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs hover:shadow-sm"
          title="Open and restore this generation in the studio canvas"
        >
          <RotateCcw size={12} />
          <span>Replay in Studio</span>
        </button>

        <button
          type="button"
          onClick={(e) => onDelete(e, item.id)}
          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-md transition-colors cursor-pointer"
          title="Delete generation entry"
          aria-label={`Delete ${title}`}
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
};
