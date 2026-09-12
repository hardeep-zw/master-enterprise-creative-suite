import React from 'react';
import { Search, Sparkles, Upload, X, ArrowUpDown, ArrowLeft } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import { AssetFilters, type AssetFilterType } from './AssetFilters.js';

export type AssetSortOption = 'newest' | 'oldest' | 'name';

interface AssetLibraryToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  activeFilter: AssetFilterType;
  onSelectFilter: (f: AssetFilterType) => void;
  sortBy: AssetSortOption;
  onSortChange: (sort: AssetSortOption) => void;
  counts: {
    all: number;
    image: number;
    video: number;
    audio: number;
    doc: number;
  };
  onOpenGenerate: () => void;
  onOpenUpload: () => void;
  onBack?: () => void;
}

export const AssetLibraryToolbar: React.FC<AssetLibraryToolbarProps> = ({
  searchQuery,
  onSearchChange,
  activeFilter,
  onSelectFilter,
  sortBy,
  onSortChange,
  counts,
  onOpenGenerate,
  onOpenUpload,
  onBack,
}) => {
  return (
    <div className="flex flex-col gap-4 pb-4 border-b border-slate-200 dark:border-slate-800/80">
      {/* Top Row: Title + Main CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Asset Library
            </h1>
            <span className="text-xs font-mono text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-xs">
              {counts.all} items
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Upload and manage brand assets. Selected assets are automatically injected as creative references.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 shrink-0">
          {onBack && (
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/60"
              title="Return to Workspace"
            >
              <ArrowLeft size={14} />
              <span>Back to Workspace</span>
            </button>
          )}
          <button
            type="button"
            onClick={onOpenGenerate}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Sparkles size={14} />
            <span>Generate Asset</span>
          </button>
          <button
            type="button"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold transition-colors cursor-pointer border border-slate-200/80 dark:border-slate-700/60"
          >
            <Upload size={14} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* Second Row: Search, Type Filters, Sort */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
        {/* Search Input */}
        <div className="relative w-full md:w-72 lg:w-80">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search assets..."
            className="w-full bg-slate-50 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-700/80 rounded-sm pl-8.5 pr-8 py-1.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-white transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X size={13} />
            </button>
          )}
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between md:justify-end gap-3 flex-wrap">
          <AssetFilters
            activeFilter={activeFilter}
            onSelectFilter={onSelectFilter}
            counts={counts}
          />

          {/* Sort Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 shrink-0">
            <ArrowUpDown size={13} className="text-slate-400" />
            <select
              value={sortBy}
              onChange={(e) => onSortChange(e.target.value as AssetSortOption)}
              className="bg-transparent border border-slate-200 dark:border-slate-800 rounded-sm px-2 py-1 text-xs text-slate-700 dark:text-slate-300 focus:outline-none cursor-pointer"
            >
              <option value="newest" className="bg-white dark:bg-slate-900">Newest</option>
              <option value="oldest" className="bg-white dark:bg-slate-900">Oldest</option>
              <option value="name" className="bg-white dark:bg-slate-900">Name (A–Z)</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};
