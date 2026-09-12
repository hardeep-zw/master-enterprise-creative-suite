/**
 * User Asset Repository.
 * Backed authoritatively by Supabase PostgreSQL (public.assets) and Supabase Storage (user-assets).
 */

import { uploadAssetToStorage } from '../storage/storageClient.js';
import { apiClient } from '../api/apiClient.js';
import type { Asset } from '@shared-types/creative.js';

export function subscribeUserAssets(
  _userId: string,
  onData: (assets: Asset[]) => void,
  onError?: (err: any) => void
): () => void {
  let isCancelled = false;

  apiClient.get<{ success: boolean; assets: any[] }>('/api/assets')
    .then((res) => {
      if (!isCancelled && res?.assets && res.assets.length > 0) {
        const loaded: Asset[] = res.assets.map((d) => ({
          id: d.id,
          name: d.name || 'Untitled Asset',
          data: d.signedUrl || d.storagePath || '',
          storagePath: d.storagePath,
          signedUrl: d.signedUrl,
          type: d.type || 'image',
          selected: false,
          analysis: d.analysis
        }));
        onData(loaded);
      }
    })
    .catch((err) => {
      console.warn('[AssetRepository] Supabase fetch error:', err.message);
      if (onError) onError(err);
    });

  return () => {
    isCancelled = true;
  };
}

/**
 * Refreshes an ephemeral signed download URL for a specific asset if expired.
 */
export async function refreshAssetSignedUrl(assetId: string): Promise<string | null> {
  try {
    const res = await apiClient.get<{ success: boolean; signedUrl?: string }>(`/api/assets/${assetId}/signed-url`);
    return res?.signedUrl || null;
  } catch (err) {
    console.warn(`[AssetRepository] Failed to refresh signed URL for asset ${assetId}:`, err);
    return null;
  }
}

export async function saveUserAsset(
  userId: string,
  assetId: string,
  name: string,
  dataUrl: string,
  type: 'image' | 'doc' | 'video' | 'audio',
  prompt?: string
): Promise<string> {
  // Upload to Supabase Storage (or keep clean hosted URL)
  const hostedUrl = await uploadAssetToStorage(userId, assetId, dataUrl, type);

  // Save to Supabase PostgreSQL (public.assets)
  try {
    await apiClient.post('/api/assets', {
      name,
      storagePath: hostedUrl,
      type,
      prompt: prompt || ''
    });
  } catch (err) {
    console.warn('[AssetRepository] API save error:', err);
  }

  return hostedUrl;
}

export async function updateUserAsset(
  _userId: string,
  assetId: string,
  updates: Partial<Asset>
): Promise<void> {
  try {
    await apiClient.patch(`/api/assets/${assetId}`, updates);
  } catch (err) {
    console.warn('[AssetRepository] updateUserAsset error:', err);
  }
}

export async function deleteUserAsset(_userId: string, assetId: string): Promise<void> {
  try {
    await apiClient.delete(`/api/assets/${assetId}`);
  } catch (err) {
    console.warn('[AssetRepository] API delete error:', err);
  }
}
