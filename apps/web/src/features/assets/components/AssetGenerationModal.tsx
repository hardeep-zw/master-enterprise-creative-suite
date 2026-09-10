import React, { useState } from 'react';
import { Sparkles, X, Loader2, Send } from 'lucide-react';
import { generateImage } from '@web/infrastructure/ai/geminiService.js';
import { saveUserAsset } from '@web/infrastructure/repositories/assetRepository.js';
import type { BrandGuidelines } from '@shared-types/brand.js';
import type { Asset } from '@shared-types/creative.js';

interface AssetGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  brandGuidelines: BrandGuidelines;
  user: any;
  setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  setIsSyncing?: React.Dispatch<React.SetStateAction<boolean>>;
}

export const AssetGenerationModal: React.FC<AssetGenerationModalProps> = ({
  isOpen,
  onClose,
  brandGuidelines,
  user,
  setAssets,
  setIsSyncing,
}) => {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;
    setIsGenerating(true);
    setError(null);

    try {
      const res = await generateImage(prompt, brandGuidelines);
      const newId = Math.random().toString(36).substring(7);
      const newAsset: Asset = {
        id: newId,
        name: `${prompt.slice(0, 24).trim()}.jpg`,
        data: res.url,
        type: 'image',
        selected: false,
      };

      setAssets((prev) => [newAsset, ...prev]);

      if (user) {
        setIsSyncing?.(true);
        try {
          const hostedUrl = await saveUserAsset(user.uid, newId, newAsset.name, res.url, 'image', prompt);
          if (hostedUrl !== res.url) {
            setAssets((prev) => prev.map((a) => (a.id === newId ? { ...a, data: hostedUrl } : a)));
          }
        } catch (syncErr) {
          console.warn("Generated asset cloud sync warning:", syncErr);
        } finally {
          setIsSyncing?.(false);
        }
      }

      setPrompt('');
      onClose();
    } catch (err: any) {
      console.error("Failed to generate asset:", err);
      setError(err.message || 'Asset generation failed. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-sm border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col overflow-hidden z-10">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-rose-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">AI Asset Generator</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-800 dark:text-slate-200 block mb-1.5">
              Asset Description
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the asset you want to generate (e.g. 'A sleek studio product shot of our bottle on a matte stone pedestal')..."
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700/80 rounded-sm p-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-600 resize-none leading-relaxed"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleGenerate();
                }
              }}
            />
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/60 p-2.5 rounded-sm border border-slate-200/80 dark:border-slate-700/60 flex items-center justify-between">
            <span>Brand Context: <strong className="text-slate-800 dark:text-slate-200">{brandGuidelines?.name || 'Default Brand'}</strong></span>
            <span className="font-mono text-[10px] text-slate-400 uppercase">{brandGuidelines?.industry || 'General'}</span>
          </div>

          {error && (
            <p className="text-xs text-rose-600 dark:text-rose-400 font-medium">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={isGenerating}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-sm bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isGenerating ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
            <span>{isGenerating ? 'Generating...' : 'Generate'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
