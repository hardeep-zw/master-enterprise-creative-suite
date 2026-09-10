import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

interface AssetDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  assetCount: number;
  assetName?: string;
  isDeleting?: boolean;
}

export const AssetDeleteModal: React.FC<AssetDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  assetCount,
  assetName,
  isDeleting = false,
}) => {
  if (!isOpen) return null;

  const isSingle = assetCount === 1;

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="absolute inset-0" onClick={isDeleting ? undefined : onClose} />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2 text-rose-600 dark:text-rose-500 font-bold text-sm">
            <AlertTriangle size={18} />
            <span>Confirm Deletion</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-3 text-xs text-slate-600 dark:text-slate-300">
          {isSingle ? (
            <p>
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {assetName ? `"${assetName}"` : 'this asset'}
              </strong>
              ? This action will remove the file from your library and cloud storage.
            </p>
          ) : (
            <p>
              Are you sure you want to permanently delete{' '}
              <strong className="text-slate-900 dark:text-white font-semibold">
                {assetCount} selected assets
              </strong>
              ? This action cannot be undone and will remove all selected files from your library and cloud storage.
            </p>
          )}

          <div className="p-3 rounded-sm bg-rose-50 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 text-[11px] text-rose-700 dark:text-rose-400">
            Assets currently used as references in ongoing generation sessions will be unlinked.
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-sm bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            <Trash2 size={13} />
            <span>{isDeleting ? 'Deleting...' : isSingle ? 'Delete Asset' : `Delete ${assetCount} Assets`}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
