import React, { useState, useMemo } from 'react';
import { 
  ArrowLeft, 
  Sparkles, 
  Trash2, 
  LayoutGrid, 
  List, 
  Search, 
  X, 
  RotateCcw, 
  Copy, 
  Check, 
  Calendar,
  Eye,
  Film
} from 'lucide-react';
import type { HistoryItem } from '../../layout/components/AppSidebar.js';
import { CreativeHistoryRow } from '../components/CreativeHistoryRow.js';
import { CreativeHistoryCard } from '../components/CreativeHistoryCard.js';
import { 
  getGemCategory, 
  extractHistoryMedia, 
  getGemName, 
  getCreativeDisplayTitle, 
  formatLedgerTime,
  type CreativeHistoryCategory 
} from '../utils/historyFormatters.js';
import { cn } from '@web/lib/utils.js';

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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [activeCategory, setActiveCategory] = useState<CreativeHistoryCategory>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [previewItem, setPreviewItem] = useState<HistoryItem | null>(null);
  const [modalCopied, setModalCopied] = useState(false);

  const [modalImageError, setModalImageError] = useState(false);

  // Compute category counts
  const categoryCounts = useMemo(() => {
    const counts = { all: history.length, image: 0, video: 0, audio: 0, deck_copy: 0 };
    for (const item of history) {
      const cat = getGemCategory(item.gemId);
      counts[cat] = (counts[cat] || 0) + 1;
    }
    return counts;
  }, [history]);

  // Filtered history items
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      // Category filter
      if (activeCategory !== 'all' && getGemCategory(item.gemId) !== activeCategory) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const promptMatch = item.prompt?.toLowerCase().includes(q);
        const titleMatch = item.title?.toLowerCase().includes(q);
        const toolMatch = getGemName(item.gemId).toLowerCase().includes(q);
        if (!promptMatch && !titleMatch && !toolMatch) return false;
      }

      return true;
    });
  }, [history, activeCategory, searchQuery]);

  const previewMedia = previewItem ? extractHistoryMedia(previewItem) : null;

  const handleOpenPreview = (item: HistoryItem) => {
    setModalImageError(false);
    setPreviewItem(item);
  };

  const handleModalCopyPrompt = () => {
    if (!previewItem?.prompt) return;
    navigator.clipboard.writeText(previewItem.prompt);
    setModalCopied(true);
    setTimeout(() => setModalCopied(false), 2000);
  };

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb */}
        <div>
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            <ArrowLeft size={14} />
            <span>Back to Studio Workspace</span>
          </button>
        </div>

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2.5 tracking-tight">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                <Sparkles size={20} />
              </div>
              <span>Creative History</span>
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Your generated creative work, visual assets, and prompt history across all studio tools
            </p>
          </div>

          {history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-600 dark:text-slate-300 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-slate-800 hover:border-rose-200 dark:hover:border-rose-900/60 text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer self-start sm:self-center shadow-xs"
              title="Clear all creative generations from local history"
            >
              <Trash2 size={13} />
              <span>Clear History ({history.length})</span>
            </button>
          )}
        </div>

        {/* Interactive Controls: Category Tabs, Search, and View Switcher */}
        {history.length > 0 && (
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <button
                type="button"
                onClick={() => setActiveCategory('all')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                  activeCategory === 'all'
                    ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                    : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                )}
              >
                All ({categoryCounts.all})
              </button>

              {categoryCounts.image > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('image')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                    activeCategory === 'image'
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-400"
                  )}
                >
                  Images ({categoryCounts.image})
                </button>
              )}

              {categoryCounts.video > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('video')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                    activeCategory === 'video'
                      ? "bg-purple-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400"
                  )}
                >
                  Videos ({categoryCounts.video})
                </button>
              )}

              {categoryCounts.audio > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('audio')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                    activeCategory === 'audio'
                      ? "bg-emerald-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                  )}
                >
                  Audio ({categoryCounts.audio})
                </button>
              )}

              {categoryCounts.deck_copy > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategory('deck_copy')}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer",
                    activeCategory === 'deck_copy'
                      ? "bg-amber-600 text-white shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400"
                  )}
                >
                  Decks & Copy ({categoryCounts.deck_copy})
                </button>
              )}
            </div>

            {/* Right: Search and View Mode Switcher */}
            <div className="flex items-center gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search prompts or tools..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 text-xs text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 shadow-xs"
                />
              </div>

              {/* Grid / List Switcher */}
              <div className="flex items-center p-1 rounded-lg bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    "p-1.5 rounded-md transition-all cursor-pointer",
                    viewMode === 'grid'
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                  title="Grid View"
                  aria-label="Grid View"
                >
                  <LayoutGrid size={15} />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('list')}
                  className={cn(
                    "p-1.5 rounded-md transition-all cursor-pointer",
                    viewMode === 'list'
                      ? "bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs"
                      : "text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                  )}
                  title="List View"
                  aria-label="List View"
                >
                  <List size={15} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Content Area */}
        {history.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 shadow-xs">
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
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-md bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
            >
              <LayoutGrid size={14} />
              <span>Open Studio to Generate</span>
            </button>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-16 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-800 bg-white dark:bg-slate-900/40 p-8 shadow-xs">
            <Sparkles size={28} className="mx-auto text-slate-400 mb-3" />
            <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200 mb-1">
              No matching generations found
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto mb-4">
              Try changing the category tab or clearing your search term.
            </p>
            <button
              type="button"
              onClick={() => {
                setActiveCategory('all');
                setSearchQuery('');
              }}
              className="px-3.5 py-1.5 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
              <span>Showing {filteredHistory.length} of {history.length} generation{history.length === 1 ? '' : 's'}</span>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">Click &quot;Replay in Studio&quot; to restore onto the canvas</span>
            </div>

            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {filteredHistory.map((item) => (
                  <CreativeHistoryCard
                    key={item.id}
                    item={item}
                    onReplay={onSelectHistoryItem}
                    onDelete={onDeleteHistoryItem}
                    onPreviewMedia={() => handleOpenPreview(item)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2.5" role="feed" aria-label="Creative Generations List">
                {filteredHistory.map((item) => (
                  <CreativeHistoryRow
                    key={item.id}
                    item={item}
                    onReplay={onSelectHistoryItem}
                    onDelete={onDeleteHistoryItem}
                    onPreviewMedia={() => handleOpenPreview(item)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Full-Resolution Media Preview Lightbox Modal */}
      {previewItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setPreviewItem(null)}
        >
          <div 
            className="relative max-w-3xl w-full bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                  {getCreativeDisplayTitle(previewItem)}
                </h3>
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    {getGemName(previewItem.gemId)}
                  </span>
                  <span>·</span>
                  <span>{formatLedgerTime(previewItem.timestamp)}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                aria-label="Close preview"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Media Body */}
            <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-950/50 min-h-[300px]">
              {previewMedia?.previewUrl && !modalImageError ? (
                previewMedia.type === 'video' ? (
                  <video 
                    src={previewMedia.url} 
                    controls 
                    className="max-h-[55vh] rounded-lg shadow-lg border border-slate-800"
                    autoPlay
                  />
                ) : (
                  <img
                    src={previewMedia.url || previewMedia.previewUrl}
                    alt=""
                    onError={() => setModalImageError(true)}
                    className="max-h-[55vh] max-w-full rounded-lg shadow-lg object-contain border border-slate-200 dark:border-slate-800"
                  />
                )
              ) : (
                <div className="w-56 h-56 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200/60 dark:from-slate-800/80 dark:to-slate-900 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center p-6 text-center shadow-inner my-2">
                  <div className="w-14 h-14 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center mb-3">
                    <Sparkles size={28} />
                  </div>
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-200">{getGemName(previewItem.gemId)}</p>
                  <span className="text-[10px] font-mono text-slate-400 mt-1 uppercase tracking-wider">Creative Generation</span>
                </div>
              )}

              {/* Prompt Text Box */}
              {previewItem.prompt && (
                <div className="w-full mt-4 p-3.5 rounded-xl bg-slate-100 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/60 text-xs text-slate-700 dark:text-slate-300 leading-relaxed flex items-start justify-between gap-3">
                  <p className="font-mono flex-1">{previewItem.prompt}</p>
                  <button
                    type="button"
                    onClick={handleModalCopyPrompt}
                    className="shrink-0 p-1.5 rounded-md hover:bg-white dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                    title="Copy full prompt"
                  >
                    {modalCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 flex items-center justify-between">
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {previewMedia?.model || 'Creative Studio'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onSelectHistoryItem(previewItem);
                    setPreviewItem(null);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold uppercase tracking-wider shadow-sm transition-all cursor-pointer"
                >
                  <RotateCcw size={13} />
                  <span>Restore in Studio Canvas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
