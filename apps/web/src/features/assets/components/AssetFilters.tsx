import React from 'react';
import { cn } from '@web/lib/utils.js';

export type AssetFilterType = 'all' | 'image' | 'video' | 'audio' | 'doc';

interface AssetFiltersProps {
  activeFilter: AssetFilterType;
  onSelectFilter: (filter: AssetFilterType) => void;
  counts: {
    all: number;
    image: number;
    video: number;
    audio: number;
    doc: number;
  };
}

export const AssetFilters: React.FC<AssetFiltersProps> = ({
  activeFilter,
  onSelectFilter,
  counts,
}) => {
  const tabs: Array<{ id: AssetFilterType; label: string; count: number }> = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'image', label: 'Images', count: counts.image },
    { id: 'video', label: 'Videos', count: counts.video },
    { id: 'audio', label: 'Audio', count: counts.audio },
    { id: 'doc', label: 'Documents', count: counts.doc },
  ];

  return (
    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
      {tabs.map((tab) => {
        const isActive = activeFilter === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectFilter(tab.id)}
            className={cn(
              "flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium transition-all whitespace-nowrap cursor-pointer border",
              isActive
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white shadow-xs font-semibold"
                : "bg-transparent text-slate-600 dark:text-slate-400 border-transparent hover:border-slate-200 dark:hover:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800/60"
            )}
          >
            <span>{tab.label}</span>
            <span
              className={cn(
                "text-[10px] font-mono px-1.5 py-0.2 rounded-full",
                isActive
                  ? "bg-slate-800 text-slate-200 dark:bg-slate-200 dark:text-slate-800"
                  : "bg-slate-100 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400"
              )}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
};
