import React, { useState } from 'react';
import { Eye, Download, Trash2, Check, Sparkles, MoreVertical, Wand2 } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import { AssetMediaThumbnail } from './AssetMediaThumbnail.js';
import type { Asset } from '@shared-types/creative.js';

interface AssetCardProps {
  asset: Asset;
  onToggleSelect: (id: string) => void;
  onPreview: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onOpenInStudio?: (asset: Asset) => void;
}

export const AssetCard: React.FC<AssetCardProps> = ({
  asset,
  onToggleSelect,
  onPreview,
  onDownload,
  onDelete,
  onOpenInStudio,
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Derive source label from asset name or attributes
  const deriveSource = (): string => {
    const lower = asset.name.toLowerCase();
    if (lower.startsWith('layout:')) return 'Canvas';
    if (lower.startsWith('video:')) return 'Video Render';
    if (lower.startsWith('render:')) return 'AI Render';
    if (lower.startsWith('story:')) return 'Story Deck';
    if (lower.startsWith('voiceover:')) return 'Voice Studio';
    if (lower.includes('fal') || lower.includes('flux')) return 'AI Generated';
    return 'Uploaded';
  };

  const source = deriveSource();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Spacebar') {
      e.preventDefault();
      onToggleSelect(asset.id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      onPreview(asset);
    }
  };

  return (
    <div
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
      className={cn(
        "group relative flex flex-col rounded-sm overflow-hidden border transition-all duration-200 outline-none select-none",
        "bg-white dark:bg-slate-900",
        asset.selected
          ? "border-rose-600 dark:border-rose-500 ring-1 ring-rose-600/50 dark:ring-rose-500/50 shadow-md shadow-rose-950/10"
          : "border-slate-200 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm"
      )}
    >
      {/* Media Thumbnail Container */}
      <div
        onClick={() => onPreview(asset)}
        className="relative aspect-[4/3] w-full cursor-pointer overflow-hidden bg-slate-950"
      >
        <AssetMediaThumbnail asset={asset} isHovered={isHovered} />

        {/* Selection Checkbox (Top Left) */}
        <button
          type="button"
          aria-label={asset.selected ? "Deselect asset" : "Select asset for generation"}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect(asset.id);
          }}
          className={cn(
            "absolute top-2 left-2 z-10 w-6 h-6 rounded-sm flex items-center justify-center transition-all cursor-pointer",
            asset.selected
              ? "bg-rose-600 text-white shadow-sm border border-rose-500"
              : "bg-black/40 hover:bg-black/60 text-white border border-white/40 opacity-0 group-hover:opacity-100 focus:opacity-100"
          )}
        >
          {asset.selected ? (
            <Check size={14} strokeWidth={2.5} />
          ) : (
            <span className="w-2.5 h-2.5 rounded-xs border border-white/70" />
          )}
        </button>

        {/* Type & Source Badges (Top Right) */}
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1.5">
          <span className="bg-slate-950/80 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-xs tracking-wider uppercase border border-white/10 backdrop-blur-xs">
            {asset.type}
          </span>
        </div>

        {/* Quick Hover Actions Overlay */}
        <div
          className={cn(
            "absolute inset-x-0 bottom-0 p-1.5 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-between gap-1 transition-opacity",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          {onOpenInStudio && (
            <button
              type="button"
              title="Open single asset in Studio"
              onClick={(e) => {
                e.stopPropagation();
                onOpenInStudio(asset);
              }}
              className="px-1.5 py-0.5 rounded-xs bg-rose-600 hover:bg-rose-700 text-white transition-colors flex items-center gap-1 text-[10px] font-bold shadow-xs cursor-pointer"
            >
              <Wand2 size={11} />
              <span>Studio</span>
            </button>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <button
              type="button"
              title="Preview asset"
              onClick={(e) => {
                e.stopPropagation();
                onPreview(asset);
              }}
              className="p-1 rounded-xs bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors border border-slate-700/50 cursor-pointer"
            >
              <Eye size={13} />
            </button>
            <button
              type="button"
              title="Download asset"
              onClick={(e) => {
                e.stopPropagation();
                onDownload(asset);
              }}
              className="p-1 rounded-xs bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white transition-colors border border-slate-700/50 cursor-pointer"
            >
              <Download size={13} />
            </button>
            <button
              type="button"
              title="Delete asset"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(asset.id);
              }}
              className="p-1 rounded-xs bg-slate-900/80 hover:bg-rose-950/80 text-slate-300 hover:text-rose-400 transition-colors border border-slate-700/50 hover:border-rose-800/50 cursor-pointer"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Card Metadata Footer */}
      <div className="p-2.5 flex flex-col justify-between flex-1 gap-1.5 border-t border-slate-100 dark:border-slate-800/60">
        <div className="flex items-start justify-between gap-1">
          <p
            className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate leading-snug"
            title={asset.name}
          >
            {asset.name}
          </p>
        </div>

        {/* Sub-meta: Source + Colors or Theme */}
        <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
          <span className="font-mono text-[9px] uppercase tracking-wider text-slate-400 dark:text-slate-500">
            {source}
          </span>

          {/* AI Analyzed Color Dots (if present) */}
          {asset.analysis?.colors && asset.analysis.colors.length > 0 && (
            <div className="flex items-center gap-1 shrink-0" title={`Colors: ${asset.analysis.colors.join(', ')}`}>
              {asset.analysis.colors.slice(0, 3).map((c, i) => (
                <span
                  key={i}
                  className="w-2 h-2 rounded-full border border-black/20 dark:border-white/20"
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
