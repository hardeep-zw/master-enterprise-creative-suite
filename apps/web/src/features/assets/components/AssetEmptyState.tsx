import React from 'react';
import { Upload, Sparkles, FilterX, FolderOpen } from 'lucide-react';

interface AssetEmptyStateProps {
  isFiltered: boolean;
  onClearFilters: () => void;
  onOpenUpload: () => void;
  onOpenGenerate: () => void;
}

export const AssetEmptyState: React.FC<AssetEmptyStateProps> = ({
  isFiltered,
  onClearFilters,
  onOpenUpload,
  onOpenGenerate,
}) => {
  if (isFiltered) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800/80 flex items-center justify-center mb-3 text-slate-400">
          <FilterX size={22} />
        </div>
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
          No assets match your criteria
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1 mb-4">
          Try adjusting your search query or clear the active type filter to view all items.
        </p>
        <button
          type="button"
          onClick={onClearFilters}
          className="px-3.5 py-1.5 text-xs font-semibold rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer"
        >
          Clear Filters
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-24 px-4 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-sm">
      <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400">
        <FolderOpen size={26} strokeWidth={1.5} />
      </div>
      <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
        No assets yet
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mt-1 mb-6 leading-relaxed">
        Upload brand logos, product photos, audio clips, or guidelines documents. You can also generate imagery directly using the AI Asset Generator.
      </p>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold shadow-xs hover:opacity-90 transition-opacity cursor-pointer"
        >
          <Upload size={14} />
          <span>Upload Assets</span>
        </button>
        <button
          type="button"
          onClick={onOpenGenerate}
          className="flex items-center gap-1.5 px-4 py-2 rounded-sm bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles size={14} />
          <span>Generate Asset</span>
        </button>
      </div>
    </div>
  );
};
