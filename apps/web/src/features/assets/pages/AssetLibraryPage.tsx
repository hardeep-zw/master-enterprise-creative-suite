import React, { useMemo, useState } from 'react';
import { useAuth } from '@web/features/auth/hooks/useAuth.js';
import { downloadFile } from '@web/lib/utils.js';
import { deleteUserAsset } from '@web/infrastructure/repositories/assetRepository.js';
import { AssetLibraryToolbar, type AssetSortOption } from '../components/AssetLibraryToolbar.js';
import { type AssetFilterType } from '../components/AssetFilters.js';
import { AssetGrid } from '../components/AssetGrid.js';
import { AssetPreviewModal } from '../components/AssetPreviewModal.js';
import { AssetUploadModal } from '../components/AssetUploadModal.js';
import { AssetGenerationModal } from '../components/AssetGenerationModal.js';
import { AssetSelectionBar } from '../components/AssetSelectionBar.js';
import { AssetDeleteModal } from '../components/AssetDeleteModal.js';
import type { Asset } from '@shared-types/creative.js';
import type { BrandGuidelines } from '@shared-types/brand.js';

interface AssetLibraryPageProps {
  assets: Asset[];
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  brandGuidelines: BrandGuidelines;
  isSyncing?: boolean;
  setIsSyncing?: React.Dispatch<React.SetStateAction<boolean>>;
  onBack?: () => void;
  onNavigateToWorkspace?: () => void;
  onOpenAssetInStudio?: (asset: Asset) => void;
  onUseAssetInDestination?: (
    asset: Asset,
    destination: { gemId: string; roleId: string; roleName: string }
  ) => void;
}

export const AssetLibraryPage: React.FC<AssetLibraryPageProps> = ({
  assets,
  setAssets,
  brandGuidelines,
  isSyncing,
  setIsSyncing,
  onBack,
  onNavigateToWorkspace,
  onOpenAssetInStudio,
  onUseAssetInDestination,
}) => {
  const { user } = useAuth();

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<AssetFilterType>('all');
  const [sortBy, setSortBy] = useState<AssetSortOption>('newest');

  // Modals State
  const [previewAsset, setPreviewAsset] = useState<Asset | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [isGenerateOpen, setIsGenerateOpen] = useState<boolean>(false);

  // Safe Deletion Modal State
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    assetIds: string[];
    assetName?: string;
  }>({
    isOpen: false,
    assetIds: [],
  });
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Dynamic real counts across full library
  const counts = useMemo(() => {
    return {
      all: assets.length,
      image: assets.filter((a) => a.type === 'image').length,
      video: assets.filter((a) => a.type === 'video').length,
      audio: assets.filter((a) => a.type === 'audio').length,
      doc: assets.filter((a) => a.type === 'doc').length,
    };
  }, [assets]);

  // Filtered and Sorted Assets
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // 1. Type Filter
    if (activeFilter !== 'all') {
      result = result.filter((a) => a.type === activeFilter);
    }

    // 2. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((a) => {
        const matchesName = a.name.toLowerCase().includes(q);
        const matchesType = a.type.toLowerCase().includes(q);
        const matchesTheme = a.analysis?.theme?.toLowerCase().includes(q) || false;
        const matchesMood = a.analysis?.mood?.toLowerCase().includes(q) || false;
        const matchesStyle = a.analysis?.style?.toLowerCase().includes(q) || false;
        return matchesName || matchesType || matchesTheme || matchesMood || matchesStyle;
      });
    }

    // 3. Sorting
    if (sortBy === 'oldest') {
      result.reverse();
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [assets, activeFilter, searchQuery, sortBy]);

  // Selected Assets
  const selectedAssets = useMemo(() => {
    return assets.filter((a) => a.selected);
  }, [assets]);

  const selectedCount = selectedAssets.length;
  const singleSelectedAsset = selectedCount === 1 ? selectedAssets[0] : null;

  // Action Handlers
  const handleToggleSelect = (id: string) => {
    setAssets((prev) =>
      prev.map((a) => (a.id === id ? { ...a, selected: !a.selected } : a))
    );
  };

  const handleClearSelection = () => {
    setAssets((prev) => prev.map((a) => ({ ...a, selected: false })));
  };

  // Trigger confirmation modal for single asset deletion
  const handleRequestDeleteSingle = (id: string) => {
    const target = assets.find((a) => a.id === id);
    setDeleteModal({
      isOpen: true,
      assetIds: [id],
      assetName: target?.name,
    });
  };

  // Trigger confirmation modal for bulk selected asset deletion
  const handleRequestDeleteSelected = () => {
    const ids = selectedAssets.map((a) => a.id);
    if (ids.length === 0) return;
    setDeleteModal({
      isOpen: true,
      assetIds: ids,
      assetName: ids.length === 1 ? selectedAssets[0].name : undefined,
    });
  };

  // Execute deletion after user confirms in dialog
  const handleConfirmDelete = async () => {
    const idsToDelete = new Set(deleteModal.assetIds);
    if (idsToDelete.size === 0) return;

    setIsDeleting(true);

    // 1. Optimistically remove from state
    setAssets((prev) => prev.filter((a) => !idsToDelete.has(a.id)));

    // 2. Close modal
    setDeleteModal({ isOpen: false, assetIds: [] });

    // 3. Cloud deletion via API
    if (user) {
      setIsSyncing?.(true);
      try {
        await Promise.all(
          Array.from(idsToDelete).map((id) => deleteUserAsset(user.uid, id))
        );
      } catch (e) {
        console.error("Cloud deletion failed for some assets:", e);
      } finally {
        setIsSyncing?.(false);
      }
    }

    setIsDeleting(false);
  };

  const handleDownload = (asset: Asset) => {
    downloadFile(asset.data, asset.name);
  };

  // Handler to open an asset in the Studio
  const handleOpenStudio = (asset: Asset) => {
    if (onOpenAssetInStudio) {
      onOpenAssetInStudio(asset);
    } else if (onNavigateToWorkspace) {
      onNavigateToWorkspace();
    }
  };

  const isFiltered = activeFilter !== 'all' || searchQuery.trim().length > 0;

  return (
    <div className="flex-1 overflow-y-auto bg-white dark:bg-slate-950 p-4 sm:p-6 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Toolbar: Header, Actions, Search, Filter Tabs, Sort */}
        <AssetLibraryToolbar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
          counts={counts}
          onOpenGenerate={() => setIsGenerateOpen(true)}
          onOpenUpload={() => setIsUploadOpen(true)}
          onBack={onBack || onNavigateToWorkspace}
        />

        {/* Responsive Asset Grid */}
        <AssetGrid
          assets={filteredAssets}
          isFiltered={isFiltered}
          onToggleSelect={handleToggleSelect}
          onPreview={setPreviewAsset}
          onDownload={handleDownload}
          onDelete={handleRequestDeleteSingle}
          onOpenInStudio={handleOpenStudio}
          onClearFilters={() => {
            setActiveFilter('all');
            setSearchQuery('');
          }}
          onOpenUpload={() => setIsUploadOpen(true)}
          onOpenGenerate={() => setIsGenerateOpen(true)}
        />
      </div>

      {/* Floating Selection Bar */}
      <AssetSelectionBar
        selectedCount={selectedCount}
        onClearSelection={handleClearSelection}
        onOpenSingleInStudio={() => {
          if (singleSelectedAsset) {
            handleOpenStudio(singleSelectedAsset);
          }
        }}
        onDeleteSelected={handleRequestDeleteSelected}
      />

      {/* Preview Modal */}
      <AssetPreviewModal
        asset={previewAsset}
        onClose={() => setPreviewAsset(null)}
        onToggleSelect={handleToggleSelect}
        onDelete={handleRequestDeleteSingle}
        onRequestDelete={(asset) => {
          setPreviewAsset(null);
          handleRequestDeleteSingle(asset.id);
        }}
        onOpenInStudio={handleOpenStudio}
        onUseInDestination={onUseAssetInDestination}
      />

      {/* Upload Modal */}
      <AssetUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        user={user}
        setAssets={setAssets}
        setIsSyncing={setIsSyncing}
      />

      {/* Generation Modal */}
      <AssetGenerationModal
        isOpen={isGenerateOpen}
        onClose={() => setIsGenerateOpen(false)}
        brandGuidelines={brandGuidelines}
        user={user}
        setAssets={setAssets}
        setIsSyncing={setIsSyncing}
      />

      {/* Safe Deletion Confirmation Modal */}
      <AssetDeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, assetIds: [] })}
        onConfirm={handleConfirmDelete}
        assetCount={deleteModal.assetIds.length}
        assetName={deleteModal.assetName}
        isDeleting={isDeleting}
      />
    </div>
  );
};
