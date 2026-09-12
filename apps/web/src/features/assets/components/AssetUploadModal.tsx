import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, Loader2, AlertCircle, FileImage } from 'lucide-react';
import { cn } from '@web/lib/utils.js';
import { resizeImageIfNeeded } from '@utils/image.js';
import { analyzeAsset } from '@web/infrastructure/ai/geminiService.js';
import { saveUserAsset } from '@web/infrastructure/repositories/assetRepository.js';
import type { Asset } from '@shared-types/creative.js';

interface UploadQueueItem {
  id: string;
  name: string;
  size: number;
  status: 'queued' | 'uploading' | 'analyzing' | 'done' | 'error';
  errorMessage?: string;
}

interface AssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  setIsSyncing?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AssetUploadModal: React.FC<AssetUploadModalProps> = ({
  isOpen,
  onClose,
  user,
  setAssets,
  setIsSyncing,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  if (!isOpen) return null;

  const processFiles = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
    if (fileArray.length === 0) return;

    setIsProcessing(true);
    const newItems: UploadQueueItem[] = fileArray.map(f => ({
      id: Math.random().toString(36).substring(7),
      name: f.name,
      size: f.size,
      status: 'queued'
    }));

    setQueue(prev => [...prev, ...newItems]);

    // Process files in parallel
    await Promise.all(
      fileArray.map(async (file, idx) => {
        const queueItem = newItems[idx];
        const tempId = queueItem.id;

        try {
          // Read and resize
          setQueue(q => q.map(item => item.id === tempId ? { ...item, status: 'uploading' } : item));
          const rawData = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const base64Data = await resizeImageIfNeeded(rawData);

          const newAsset: Asset = {
            id: tempId,
            name: file.name,
            data: base64Data,
            type: 'image',
            selected: false
          };

          // Optimistically prepend to library
          setAssets(prev => [newAsset, ...prev]);

          // Cloud sync if authenticated
          if (user) {
            setIsSyncing?.(true);
            try {
              const hostedUrl = await saveUserAsset(user.uid, tempId, file.name, base64Data, 'image', file.name);
              if (hostedUrl !== base64Data) {
                setAssets(prev => prev.map(a => a.id === tempId ? { ...a, data: hostedUrl } : a));
              }
            } catch (err) {
              console.warn("Cloud persistence error:", err);
            } finally {
              setIsSyncing?.(false);
            }
          }

          // Trigger AI Visual Analysis
          setQueue(q => q.map(item => item.id === tempId ? { ...item, status: 'analyzing' } : item));
          try {
            const analysis = await analyzeAsset(base64Data);
            setAssets(prev => prev.map(a => a.id === tempId ? { ...a, analysis } : a));
          } catch (analysisErr) {
            console.warn("AI Visual style analysis skipped:", analysisErr);
          }

          setQueue(q => q.map(item => item.id === tempId ? { ...item, status: 'done' } : item));
        } catch (err: any) {
          console.error("Asset upload failed:", err);
          setQueue(q => q.map(item => item.id === tempId ? {
            ...item,
            status: 'error',
            errorMessage: err.message || 'Upload failed'
          } : item));
        }
      })
    );

    setIsProcessing(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      processFiles(e.target.files);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upload Assets</h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Upload images to use as references for creative generation.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-5 space-y-4">
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center",
              isDragging
                ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/20"
                : "border-slate-300 dark:border-slate-700/80 hover:border-slate-400 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-950/40"
            )}
          >
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 mb-2">
              <Upload size={20} />
            </div>
            <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
              Drop images here, or <span className="text-rose-600 dark:text-rose-400">browse files</span>
            </p>
            <p className="text-[10px] text-slate-400 mt-1">
              Supports PNG, JPG, WEBP, SVG. Files automatically optimized.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>

          {/* Upload Queue List */}
          {queue.length > 0 && (
            <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block">
                Queue ({queue.filter(q => q.status === 'done').length}/{queue.length})
              </span>
              {queue.map(item => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-2 rounded-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 text-xs"
                >
                  <div className="flex items-center gap-2 truncate pr-2">
                    <FileImage size={14} className="text-slate-400 shrink-0" />
                    <span className="truncate text-slate-800 dark:text-slate-200" title={item.name}>
                      {item.name}
                    </span>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 font-mono text-[10px]">
                    {item.status === 'uploading' && (
                      <span className="text-blue-500 flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" />
                        Uploading
                      </span>
                    )}
                    {item.status === 'analyzing' && (
                      <span className="text-amber-500 flex items-center gap-1">
                        <Loader2 size={11} className="animate-spin" />
                        Analyzing Style
                      </span>
                    )}
                    {item.status === 'done' && (
                      <span className="text-emerald-500 flex items-center gap-1">
                        <CheckCircle2 size={12} />
                        Ready
                      </span>
                    )}
                    {item.status === 'error' && (
                      <span className="text-rose-500 flex items-center gap-1">
                        <AlertCircle size={12} />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-1.5 text-xs font-semibold rounded-sm bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? 'Processing...' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
