import React from 'react';
import { AssetCard } from './AssetCard.js';
import { AssetEmptyState } from './AssetEmptyState.js';
import type { Asset } from '@shared-types/creative.js';

interface AssetGridProps {
  assets: Asset[];
  isFiltered: boolean;
  onToggleSelect: (id: string) => void;
  onPreview: (asset: Asset) => void;
  onDownload: (asset: Asset) => void;
  onDelete: (id: string) => void;
  onClearFilters: () => void;
  onOpenUpload: () => void;
  onOpenGenerate: () => void;
  onOpenInStudio?: (asset: Asset) => void;
}

export const AssetGrid: React.FC<AssetGridProps> = ({
  assets,
  isFiltered,
  onToggleSelect,
  onPreview,
  onDownload,
  onDelete,
  onClearFilters,
  onOpenUpload,
  onOpenGenerate,
  onOpenInStudio,
}) => {
  if (assets.length === 0) {
    return (
      <AssetEmptyState
        isFiltered={isFiltered}
        onClearFilters={onClearFilters}
        onOpenUpload={onOpenUpload}
        onOpenGenerate={onOpenGenerate}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
      {assets.map((asset) => (
        <AssetCard
          key={asset.id}
          asset={asset}
          onToggleSelect={onToggleSelect}
          onPreview={onPreview}
          onDownload={onDownload}
          onDelete={onDelete}
          onOpenInStudio={onOpenInStudio}
        />
      ))}
    </div>
  );
};
