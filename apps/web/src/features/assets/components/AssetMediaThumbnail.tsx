import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Video as VideoIcon, Volume2, FileText, AlertCircle } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import { refreshAssetSignedUrl } from '@web/infrastructure/repositories/assetRepository.js';
import type { Asset } from '@shared-types/creative.js';

interface AssetMediaThumbnailProps {
  asset: Asset;
  className?: string;
  isHovered?: boolean;
}

export const AssetMediaThumbnail: React.FC<AssetMediaThumbnailProps> = ({
  asset,
  className,
  isHovered = false,
}) => {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [mediaSrc, setMediaSrc] = useState<string>(asset.data);
  const hasRetriedRef = useRef(false);

  // Sync mediaSrc when asset.data changes
  React.useEffect(() => {
    setMediaSrc(asset.data);
    setHasError(false);
    setIsLoading(true);
    hasRetriedRef.current = false;
  }, [asset.data]);

  const handleMediaError = async () => {
    if (!hasRetriedRef.current && asset.id && !asset.data.startsWith('data:') && !asset.data.startsWith('#')) {
      hasRetriedRef.current = true;
      try {
        const freshUrl = await refreshAssetSignedUrl(asset.id);
        if (freshUrl && freshUrl !== mediaSrc) {
          setMediaSrc(freshUrl);
          setIsLoading(true);
          return;
        }
      } catch (e) {
        console.warn('[AssetMediaThumbnail] URL refresh error:', e);
      }
    }
    setIsLoading(false);
    setHasError(true);
  };

  if (asset.type === 'image') {
    if (hasError || !mediaSrc) {
      return (
        <div className={cn("w-full h-full bg-slate-900/80 dark:bg-slate-950 flex flex-col items-center justify-center p-3 text-center select-none", className)}>
          <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mb-2 border border-slate-700/50">
            <ImageIcon className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[11px] font-medium text-slate-300 line-clamp-1">Preview unavailable</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Stored Asset</span>
        </div>
      );
    }

    return (
      <div className={cn("w-full h-full relative overflow-hidden bg-slate-900", className)}>
        {isLoading && (
          <div className="absolute inset-0 bg-slate-800/50 animate-pulse flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-slate-600 opacity-40" />
          </div>
        )}
        <img
          src={mediaSrc}
          alt={asset.name}
          loading="lazy"
          referrerPolicy="no-referrer"
          onLoad={() => setIsLoading(false)}
          onError={handleMediaError}
          className={cn(
            "w-full h-full object-cover transition-transform duration-300",
            isHovered && "scale-105",
            isLoading ? "opacity-0" : "opacity-100"
          )}
        />
      </div>
    );
  }

  if (asset.type === 'video') {
    if (hasError || !mediaSrc) {
      return (
        <div className={cn("w-full h-full bg-slate-900/80 dark:bg-slate-950 flex flex-col items-center justify-center p-3 text-center select-none", className)}>
          <div className="w-10 h-10 rounded-full bg-slate-800/80 flex items-center justify-center mb-2 border border-slate-700/50">
            <VideoIcon className="w-5 h-5 text-slate-400" />
          </div>
          <span className="text-[11px] font-medium text-slate-300 line-clamp-1">Video preview</span>
          <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-0.5">Click to play</span>
        </div>
      );
    }

    return (
      <div className={cn("w-full h-full bg-slate-950 relative overflow-hidden flex items-center justify-center", className)}>
        <video
          src={mediaSrc}
          preload="metadata"
          muted
          playsInline
          onError={handleMediaError}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex items-end p-2.5">
          <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white">
            <VideoIcon size={12} />
          </div>
        </div>
      </div>
    );
  }

  if (asset.type === 'audio') {
    const duration = asset.analysis?.durationSeconds
      ? `${Math.round(asset.analysis.durationSeconds)}s`
      : null;

    return (
      <div className={cn("w-full h-full bg-slate-900 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center select-none relative overflow-hidden", className)}>
        <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-2 border border-slate-700/60 shadow-inner">
          <Volume2 className="w-6 h-6 text-rose-500 dark:text-rose-400" />
        </div>
        <p className="text-[11px] font-semibold text-slate-200 line-clamp-2 px-2">{asset.name}</p>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-1">
          {duration ? `Audio · ${duration}` : 'Audio Recording'}
        </span>
      </div>
    );
  }

  // Document fallback
  return (
    <div className={cn("w-full h-full bg-slate-900 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-center select-none relative overflow-hidden", className)}>
      <div className="w-12 h-12 rounded-full bg-slate-800/80 flex items-center justify-center mb-2 border border-slate-700/60 shadow-inner">
        <FileText className="w-6 h-6 text-indigo-400" />
      </div>
      <p className="text-[11px] font-semibold text-slate-200 line-clamp-2 px-2">{asset.name}</p>
      <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono mt-1">Markdown Doc</span>
    </div>
  );
};
