import React, { useState } from 'react';
import { RotateCcw, Trash2, Calendar, Eye, Copy, Check, Sparkles, Film, ExternalLink } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import type { HistoryItem } from '../../layout/components/AppSidebar.js';
import {
  getGemIcon,
  getGemName,
  getCreativeDisplayTitle,
  formatRelativeTime,
  extractHistoryMedia,
  getGemCategory
} from '../utils/historyFormatters.js';

export interface CreativeHistoryCardProps {
  item: HistoryItem;
  onReplay: (item: HistoryItem) => void;
  onDelete: (e: React.MouseEvent, id: string) => void;
  onPreviewMedia?: (mediaUrl: string, item: HistoryItem) => void;
}

export const CreativeHistoryCard: React.FC<CreativeHistoryCardProps> = ({
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
  const media = extractHistoryMedia(item);

  const handleCopyPrompt = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!item.prompt) return;
    navigator.clipboard.writeText(item.prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const badgeStyle = {
    image: 'bg-sky-500/90 text-white border-sky-400/50',
    video: 'bg-purple-500/90 text-white border-purple-400/50',
    audio: 'bg-emerald-500/90 text-white border-emerald-400/50',
    deck_copy: 'bg-amber-500/90 text-white border-amber-400/50',
  }[category] || 'bg-slate-800/90 text-white border-slate-700/50';

  const hasVisualMedia = media?.previewUrl && !imageError;

  return (
    <div className="group relative flex flex-col rounded-xl overflow-hidden bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800/90 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs hover:shadow-md transition-all duration-200">
      {/* Media Cover / Preview Area */}
      <div className="relative aspect-[4/3] w-full bg-slate-100 dark:bg-slate-950 overflow-hidden">
        {hasVisualMedia ? (
          <>
            {media.type === 'video' ? (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-purple-400">
                <Film size={36} />
              </div>
            ) : (
              <img
                src={media.previewUrl}
                alt=""
                onError={() => setImageError(true)}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                onClick={() => onPreviewMedia?.(media.url || media.previewUrl!, item)}
                loading="lazy"
              />
            )}

            {/* Quick Preview Hover Action */}
            <div
              onClick={() => onPreviewMedia?.(media.url || media.previewUrl!, item)}
              className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white cursor-pointer"
            >
              <div className="p-2.5 rounded-full bg-white/20 backdrop-blur-sm hover:scale-110 transition-transform">
                <Eye size={20} />
              </div>
            </div>
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-br from-slate-50 via-slate-100 to-slate-50 dark:from-slate-900 dark:via-slate-900/90 dark:to-slate-950 text-slate-400">
            <div className="p-3.5 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 mb-2 group-hover:scale-105 transition-transform">
              <IconComponent size={28} />
            </div>
            <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300 tracking-wide">{toolName}</span>
            <span className="text-[9px] font-mono text-slate-400 uppercase tracking-widest mt-0.5">Creative Asset</span>
          </div>
        )}

        {/* Floating Category Badge (Top Left) */}
        <div className="absolute top-2.5 left-2.5 z-10">
          <span className={cn("text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full backdrop-blur-xs border shadow-xs uppercase tracking-wider", badgeStyle)}>
            {toolName}
          </span>
        </div>

        {/* Floating Time Pill (Top Right) */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-xs text-white shadow-xs">
            {relativeTime}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate mb-1">
            {title}
          </h3>
          {item.prompt && (
            <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed mb-3">
              {item.prompt}
            </p>
          )}
        </div>

        {/* Card Actions Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2 mt-auto">
          <div className="flex items-center gap-1">
            {item.prompt && (
              <button
                type="button"
                onClick={handleCopyPrompt}
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Copy prompt"
              >
                {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
              </button>
            )}

            <button
              type="button"
              onClick={(e) => onDelete(e, item.id)}
              className="p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              title="Delete generation"
            >
              <Trash2 size={14} />
            </button>
          </div>

          <button
            type="button"
            onClick={() => onReplay(item)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-xs hover:shadow-sm transition-all cursor-pointer"
            title="Restore generation on studio canvas"
          >
            <RotateCcw size={12} />
            <span>Replay</span>
          </button>
        </div>
      </div>
    </div>
  );
};
