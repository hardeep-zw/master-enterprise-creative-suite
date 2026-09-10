import React from 'react';
import { CheckCircle2, X, ArrowRight, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface AssetSelectionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onOpenSingleInStudio?: () => void;
  onDeleteSelected?: () => void;
}

export const AssetSelectionBar: React.FC<AssetSelectionBarProps> = ({
  selectedCount,
  onClearSelection,
  onOpenSingleInStudio,
  onDeleteSelected,
}) => {
  const canOpenInStudio = selectedCount === 1;

  return (
    <AnimatePresence>
      {selectedCount > 0 && (
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 50, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4"
        >
          <div className="pointer-events-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 bg-slate-900 dark:bg-slate-950 text-white px-4 py-2.5 rounded-sm border border-slate-700/80 shadow-2xl max-w-2xl w-full">
            {/* Left info: Count & studio notice */}
            <div className="flex items-center gap-2.5 overflow-hidden w-full sm:w-auto">
              <span className="w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                {selectedCount}
              </span>
              <div className="flex flex-col">
                <span className="text-xs font-semibold leading-tight">
                  {selectedCount} {selectedCount === 1 ? 'asset' : 'assets'} selected
                </span>
                {!canOpenInStudio ? (
                  <span className="text-[10px] text-amber-400 font-medium flex items-center gap-1">
                    <AlertCircle size={10} />
                    Only 1 asset can be opened in Studio at a time
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400">
                    Ready to send to Studio canvas & controls
                  </span>
                )}
              </div>
            </div>

            {/* Right actions: Delete, Clear, Open Studio */}
            <div className="flex items-center justify-end gap-2 shrink-0 w-full sm:w-auto">
              {onDeleteSelected && (
                <button
                  type="button"
                  onClick={onDeleteSelected}
                  className="flex items-center gap-1 text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 px-2.5 py-1.5 rounded-xs transition-colors cursor-pointer border border-rose-900/60"
                  title="Delete selected assets"
                >
                  <Trash2 size={12} />
                  <span>Delete</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClearSelection}
                className="text-xs text-slate-400 hover:text-white px-2 py-1.5 rounded-xs transition-colors cursor-pointer"
              >
                Clear
              </button>

              {onOpenSingleInStudio && (
                <button
                  type="button"
                  onClick={canOpenInStudio ? onOpenSingleInStudio : undefined}
                  disabled={!canOpenInStudio}
                  title={canOpenInStudio ? "Open this asset in Creative Studio" : "Select only 1 asset to open in Studio"}
                  className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xs shadow-xs transition-colors ${
                    canOpenInStudio
                      ? "bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
                      : "bg-slate-800 text-slate-500 cursor-not-allowed opacity-60 border border-slate-700"
                  }`}
                >
                  <span>Open Studio</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
