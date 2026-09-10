import React, { useEffect, useState, useRef } from 'react';
import {
  X,
  Download,
  Trash2,
  Check,
  Image as ImageIcon,
  Video as VideoIcon,
  Volume2,
  FileText,
  Loader2,
  Sparkles,
  Info,
  ExternalLink,
  Wand2,
  Target,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn, downloadFile } from '@web/lib/utils.js';
import { refreshAssetSignedUrl } from '@web/infrastructure/repositories/assetRepository.js';
import { AssetDestinationChooserModal } from './AssetDestinationChooserModal.js';
import type { Asset } from '@shared-types/creative.js';

interface AssetPreviewModalProps {
  asset: Asset | null;
  onClose: () => void;
  onToggleSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onOpenInStudio?: (asset: Asset) => void;
  onRequestDelete?: (asset: Asset) => void;
  onUseInDestination?: (
    asset: Asset,
    destination: { gemId: string; roleId: string; roleName: string }
  ) => void;
}

export const AssetPreviewModal: React.FC<AssetPreviewModalProps> = ({
  asset,
  onClose,
  onToggleSelect,
  onDelete,
  onOpenInStudio,
  onRequestDelete,
  onUseInDestination,
}) => {
  const [docContent, setDocContent] = useState<string>('');
  const [docLoading, setDocLoading] = useState<boolean>(false);
  const [mediaError, setMediaError] = useState<boolean>(false);
  const [mediaSrc, setMediaSrc] = useState<string>(asset?.data || '');
  const [isChooserOpen, setIsChooserOpen] = useState<boolean>(false);
  const hasRetriedRef = useRef(false);

  useEffect(() => {
    setMediaSrc(asset?.data || '');
    setMediaError(false);
    hasRetriedRef.current = false;
  }, [asset?.data, asset?.id]);

  const handleMediaError = async () => {
    if (!hasRetriedRef.current && asset?.id && !asset.data.startsWith('data:') && !asset.data.startsWith('#')) {
      hasRetriedRef.current = true;
      try {
        const freshUrl = await refreshAssetSignedUrl(asset.id);
        if (freshUrl && freshUrl !== mediaSrc) {
          setMediaSrc(freshUrl);
          return;
        }
      } catch (e) {
        console.warn('[AssetPreviewModal] URL refresh error:', e);
      }
    }
    setMediaError(true);
  };

  // Keyboard escape handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Load document content securely if doc type
  useEffect(() => {
    if (!asset || asset.type !== 'doc') {
      setDocContent('');
      setDocLoading(false);
      return;
    }

    if (asset.data.startsWith('http')) {
      setDocLoading(true);
      setDocContent('');
      fetch(`/api/proxy?url=${encodeURIComponent(asset.data)}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error ${res.status}`);
          return res.text();
        })
        .then((text) => setDocContent(text))
        .catch((err) => {
          console.error("Failed to load document preview:", err);
          setDocContent(`> [!CAUTION]\n> **Failed to retrieve document content.**\n>\n> ${err.message}`);
        })
        .finally(() => setDocLoading(false));
    } else {
      setDocContent(asset.data);
      setDocLoading(false);
    }
  }, [asset]);

  if (!asset) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 lg:p-10 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-5xl max-h-[92vh] bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <span className="p-1 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
              {asset.type === 'image' && <ImageIcon size={16} />}
              {asset.type === 'video' && <VideoIcon size={16} />}
              {asset.type === 'audio' && <Volume2 size={16} />}
              {asset.type === 'doc' && <FileText size={16} />}
            </span>
            <div className="flex items-center gap-2 overflow-hidden">
              <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate max-w-md">
                {asset.name}
              </h2>
              <span className="text-[9px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-xs shrink-0">
                {asset.type}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onOpenInStudio && (
              <button
                type="button"
                onClick={() => {
                  onOpenInStudio(asset);
                  onClose();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer"
              >
                <Wand2 size={13} />
                <span>Open in Studio</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsChooserOpen(true)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-semibold transition-colors cursor-pointer border",
                asset.selected
                  ? "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-slate-900 dark:border-white"
                  : "bg-transparent text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              )}
              title="Choose a specific creative tool and reference input slot for this asset"
            >
              {asset.selected ? <Check size={13} strokeWidth={2.5} /> : <Target size={13} strokeWidth={2.2} />}
              <span>{asset.selected ? 'Use in... (Active)' : 'Use in...'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body: Media Viewer + Metadata Sidebar */}
        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* Main Media Preview Canvas */}
          <div className="flex-1 bg-slate-950 flex items-center justify-center p-4 sm:p-8 overflow-y-auto min-h-[300px] sm:min-h-[450px]">
            {asset.type === 'image' && (
              mediaError || !mediaSrc ? (
                <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <ImageIcon size={48} className="text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-300">Preview image unavailable</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    The original image resource is expired or stored offline.
                  </p>
                </div>
              ) : (
                <img
                  src={mediaSrc}
                  alt={asset.name}
                  onError={handleMediaError}
                  className="max-w-full max-h-[65vh] object-contain rounded-xs border border-white/10 shadow-lg"
                  referrerPolicy="no-referrer"
                />
              )
            )}

            {asset.type === 'video' && (
              mediaError || !mediaSrc ? (
                <div className="flex flex-col items-center justify-center text-center p-8 text-slate-400">
                  <VideoIcon size={48} className="text-slate-600 mb-3" />
                  <p className="text-sm font-medium text-slate-300">Preview video unavailable</p>
                </div>
              ) : (
                <video
                  src={mediaSrc}
                  controls
                  autoPlay
                  onError={handleMediaError}
                  className="max-w-full max-h-[65vh] rounded-xs border border-white/10 shadow-lg bg-black"
                />
              )
            )}

            {asset.type === 'audio' && (
              <div className="flex flex-col items-center justify-center gap-6 w-full max-w-md p-8 bg-slate-900 rounded-sm border border-slate-800">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center shadow-inner border border-slate-700">
                  <Volume2 size={36} className="text-rose-500" />
                </div>
                <div className="text-center">
                  <h3 className="text-sm font-semibold text-white">{asset.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mt-1 block">
                    {asset.analysis?.durationSeconds ? `Audio Track · ${Math.round(asset.analysis.durationSeconds)}s` : 'Audio Stream'}
                  </span>
                </div>
                <audio src={mediaSrc || undefined} controls onError={handleMediaError} className="w-full" />
              </div>
            )}

            {asset.type === 'doc' && (
              <div className="w-full max-w-3xl bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-sm p-6 sm:p-10 max-h-[65vh] overflow-y-auto">
                {docLoading ? (
                  <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
                    <Loader2 size={24} className="animate-spin text-rose-500" />
                    <span className="text-xs font-mono uppercase tracking-wider">Retrieving Document...</span>
                  </div>
                ) : (
                  <div className="markdown-body prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{docContent}</ReactMarkdown>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metadata & Analysis Sidebar */}
          <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-slate-900/50 p-4 sm:p-5 flex flex-col justify-between overflow-y-auto shrink-0">
            <div className="space-y-4">
              <div>
                <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Info size={13} />
                  <span>Asset Details</span>
                </h4>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-slate-500">Name</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 text-right truncate max-w-[150px]" title={asset.name}>
                      {asset.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-slate-500">Format</span>
                    <span className="font-mono text-slate-800 dark:text-slate-200 uppercase">{asset.type}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-800/60">
                    <span className="text-slate-500">Status</span>
                    <span className="text-slate-800 dark:text-slate-200 font-medium">
                      {asset.selected ? 'Active Reference' : 'Stored in Library'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Voiceover / Audio Details (for audio assets) */}
              {asset.type === 'audio' && Boolean(
                asset.analysis?.voice ||
                asset.analysis?.durationSeconds !== undefined ||
                asset.analysis?.model ||
                asset.analysis?.transcript
              ) && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Volume2 size={13} className="text-rose-500" />
                    <span>Voiceover Details</span>
                  </h4>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-sm border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    {asset.analysis?.voice && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Voice Actor</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{asset.analysis.voice}</span>
                      </div>
                    )}
                    {asset.analysis?.durationSeconds !== undefined && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Duration</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{asset.analysis.durationSeconds.toFixed(1)}s</span>
                      </div>
                    )}
                    {asset.analysis?.model && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">AI Model</span>
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300">{asset.analysis.model}</span>
                      </div>
                    )}
                    {asset.analysis?.transcript && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-0.5">Spoken Transcript</span>
                        <p className="text-slate-700 dark:text-slate-300 line-clamp-6 text-[11px] leading-relaxed bg-slate-50 dark:bg-slate-950 p-2 rounded-xs border border-slate-100 dark:border-slate-800/60 font-sans">
                          {asset.analysis.transcript}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Visual Style Analysis (only when visual properties exist) */}
              {(asset.type === 'image' || asset.type === 'video') && Boolean(
                asset.analysis?.theme ||
                asset.analysis?.tone ||
                asset.analysis?.style ||
                asset.analysis?.mood ||
                (asset.analysis?.colors && asset.analysis.colors.length > 0)
              ) && (
                <div>
                  <h4 className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-2.5 flex items-center gap-1.5">
                    <Sparkles size={13} className="text-rose-500" />
                    <span>Visual Analysis</span>
                  </h4>
                  <div className="bg-white dark:bg-slate-900 p-3 rounded-sm border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    {asset.analysis?.theme && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Theme</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{asset.analysis.theme}</span>
                      </div>
                    )}
                    {asset.analysis?.tone && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Tone</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{asset.analysis.tone}</span>
                      </div>
                    )}
                    {asset.analysis?.style && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Style</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{asset.analysis.style}</span>
                      </div>
                    )}
                    {asset.analysis?.mood && (
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Mood</span>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{asset.analysis.mood}</span>
                      </div>
                    )}
                    {asset.analysis?.colors && asset.analysis.colors.length > 0 && (
                      <div className="pt-1">
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1.5">Extracted Palette</span>
                        <div className="flex items-center gap-2">
                          {asset.analysis.colors.map((c, i) => (
                            <div key={i} className="flex items-center gap-1">
                              <span className="w-3.5 h-3.5 rounded-full border border-black/20 dark:border-white/20 shadow-xs" style={{ backgroundColor: c }} />
                              <span className="text-[9px] font-mono text-slate-500">{c}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions inside Sidebar */}
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onRequestDelete) {
                    onRequestDelete(asset);
                  } else {
                    onDelete(asset.id);
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-sm transition-colors cursor-pointer"
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
              <button
                type="button"
                onClick={() => downloadFile(mediaSrc || asset.data, asset.name)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-sm hover:opacity-90 transition-opacity cursor-pointer shadow-xs"
              >
                <Download size={13} />
                <span>Download</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Smart Destination Chooser Modal */}
      <AssetDestinationChooserModal
        isOpen={isChooserOpen}
        onClose={() => setIsChooserOpen(false)}
        asset={asset}
        onSelectDestination={(targetAsset, dest) => {
          setIsChooserOpen(false);
          if (onUseInDestination) {
            onUseInDestination(targetAsset, dest);
            onClose();
          }
        }}
      />
    </div>
  );
};
