import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  ArrowLeft,
  Check,
  Sparkles,
  ChevronRight,
  Layers,
  HelpCircle
} from 'lucide-react';
import { AppIcon } from '@web/shared/components/icons/AppIconRegistry.js';
import type { AppIconKey } from '@shared-types/icons.js';
import type { Asset } from '@shared-types/creative.js';
import {
  getAssetReferenceDestinations,
  groupDestinationsByCategory,
  type AssetDestination,
  type ReferenceRole
} from '../lib/assetDestinations.js';

interface AssetDestinationChooserModalProps {
  isOpen: boolean;
  onClose: () => void;
  asset: Asset | null;
  onSelectDestination: (
    asset: Asset,
    destination: { gemId: string; roleId: string; roleName: string }
  ) => void;
}

export const AssetDestinationChooserModal: React.FC<AssetDestinationChooserModalProps> = ({
  isOpen,
  onClose,
  asset,
  onSelectDestination,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDestination, setSelectedDestination] = useState<AssetDestination | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset state when opening/closing or changing asset
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSelectedDestination(null);
      setSelectedRoleId(null);
      setIsSubmitting(false);
    }
  }, [isOpen, asset?.id]);

  // Keyboard accessibility: Escape to close / go back
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedDestination) {
          setSelectedDestination(null);
          setSelectedRoleId(null);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedDestination, onClose]);

  // Deterministically resolved compatible destinations
  const allDestinations = useMemo(() => {
    if (!asset) return [];
    return getAssetReferenceDestinations(asset);
  }, [asset]);

  // Filtered destinations based on search query
  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return allDestinations;
    const q = searchQuery.toLowerCase().trim();
    return allDestinations.filter(
      (d) =>
        d.gemName.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        d.roles.some((r) => r.name.toLowerCase().includes(q) || r.description.toLowerCase().includes(q))
    );
  }, [allDestinations, searchQuery]);

  // Grouped by Category for structured rendering
  const groupedDestinations = useMemo(() => {
    return groupDestinationsByCategory(filteredDestinations);
  }, [filteredDestinations]);

  // Handle destination selection
  const handlePickDestination = (destination: AssetDestination) => {
    if (destination.roles.length === 1) {
      // Direct single-role destination
      handleConfirm(destination, destination.roles[0]);
    } else {
      // Multi-role destination -> proceed to Step 2
      setSelectedDestination(destination);
      setSelectedRoleId(destination.roles[0]?.id || null);
    }
  };

  // Final confirmation & state handoff
  const handleConfirm = (dest: AssetDestination, role: ReferenceRole) => {
    if (!asset) return;
    setIsSubmitting(true);
    try {
      onSelectDestination(asset, {
        gemId: dest.gemId,
        roleId: role.id,
        roleName: role.name
      });
      onClose();
    } catch (e) {
      console.error('Failed to attach asset to creative destination:', e);
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !asset) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="destination-modal-title"
    >
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            {selectedDestination && (
              <button
                type="button"
                onClick={() => {
                  setSelectedDestination(null);
                  setSelectedRoleId(null);
                }}
                className="p-1 -ml-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                title="Back to all destinations"
                aria-label="Back to tools list"
              >
                <ArrowLeft size={18} />
              </button>
            )}
            <div>
              <h2 id="destination-modal-title" className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{selectedDestination ? selectedDestination.gemName : 'Use this asset in...'}</span>
                <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded-xs">
                  {asset.type}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedDestination
                  ? 'Choose which reference slot will receive this asset'
                  : 'Choose a creative workflow to influence with this asset'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close destination chooser"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {!selectedDestination ? (
            /* STEP 1: Tool / Destination Chooser */
            <>
              {/* Instant Search Bar */}
              {allDestinations.length > 3 && (
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search creative tools..."
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 rounded-sm text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 dark:focus:border-rose-500 transition-colors"
                    autoFocus
                  />
                </div>
              )}

              {/* Empty State */}
              {allDestinations.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <HelpCircle size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                      No compatible creative tools
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                      This asset type ({asset.type}) cannot currently be used as a generation reference by the available tools.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="mt-2 px-4 py-1.5 rounded-sm text-xs font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : filteredDestinations.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No tools found matching &quot;{searchQuery}&quot;
                </div>
              ) : (
                /* Grouped Categories */
                <div className="space-y-5">
                  {groupedDestinations.map(({ category, items }) => (
                    <div key={category} className="space-y-2">
                      <h4 className="text-[10px] font-bold tracking-wider text-slate-400 dark:text-slate-500 uppercase px-1">
                        {category}
                      </h4>
                      <div className="space-y-1.5">
                        {items.map((dest) => (
                          <button
                            key={dest.gemId}
                            type="button"
                            onClick={() => handlePickDestination(dest)}
                            className="w-full flex items-center justify-between p-3 rounded-md border border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/40 hover:bg-slate-100/60 dark:hover:bg-slate-800/60 text-left transition-colors group cursor-pointer"
                          >
                            <div className="flex items-start gap-3 min-w-0 pr-2">
                              <div className="w-8 h-8 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 shrink-0 group-hover:text-rose-500 dark:group-hover:text-rose-400 transition-colors">
                                <AppIcon
                                  name={(dest.iconKey as AppIconKey) || 'sparkles'}
                                  size={16}
                                  strokeWidth={2}
                                />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <h5 className="text-xs font-bold text-slate-900 dark:text-white truncate group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                                    {dest.gemName}
                                  </h5>
                                  {dest.isRecommended && (
                                    <span className="text-[9px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 px-1 py-0.2 rounded-xs">
                                      Recommended
                                    </span>
                                  )}
                                </div>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                                  {dest.description}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">
                                {dest.roles.length === 1 ? '1 slot' : `${dest.roles.length} roles`}
                              </span>
                              <ChevronRight
                                size={14}
                                className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all"
                              />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* STEP 2: Input Role Chooser */
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-md">
                <div className="w-7 h-7 rounded-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                  <AppIcon
                    name={(selectedDestination.iconKey as AppIconKey) || 'sparkles'}
                    size={14}
                    strokeWidth={2}
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedDestination.gemName}
                  </p>
                  <p className="text-[10px] text-slate-400 truncate">
                    {selectedDestination.description}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers size={13} className="text-slate-400" />
                  <span>Choose Input Slot</span>
                </label>

                <div className="space-y-2">
                  {selectedDestination.roles.map((role) => {
                    const isSelected = selectedRoleId === role.id;
                    return (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRoleId(role.id)}
                        className={`flex items-start gap-3 p-3 rounded-md border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-500 dark:border-rose-500/70 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="mt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${
                              isSelected
                                ? 'border-rose-600 dark:border-rose-500 bg-rose-600 dark:bg-rose-500 text-white'
                                : 'border-slate-300 dark:border-slate-700 bg-transparent'
                            }`}
                          >
                            {isSelected && <Check size={10} strokeWidth={3} />}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {role.name}
                            </span>
                            {role.badge && (
                              <span className="text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded-xs bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                {role.badge}
                              </span>
                            )}
                            {role.maxLimit && (
                              <span className="text-[9px] text-slate-400 font-mono">
                                Max {role.maxLimit}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
                            {role.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        {selectedDestination && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={() => {
                setSelectedDestination(null);
                setSelectedRoleId(null);
              }}
              className="px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={!selectedRoleId || isSubmitting}
              onClick={() => {
                const role = selectedDestination.roles.find((r) => r.id === selectedRoleId);
                if (role) {
                  handleConfirm(selectedDestination, role);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-sm text-xs font-semibold bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Sparkles size={13} />
              <span>
                {isSubmitting ? 'Preparing...' : `Use in ${selectedDestination.gemName}`}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
