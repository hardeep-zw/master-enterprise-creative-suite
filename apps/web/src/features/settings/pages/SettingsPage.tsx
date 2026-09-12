import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, 
  Sun, 
  Moon, 
  Monitor, 
  Layout, 
  Sidebar, 
  Maximize2, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  Upload, 
  Trash2, 
  Check, 
  Loader2, 
  ShieldAlert, 
  User, 
  Coins, 
  Layers, 
  Building2, 
  Palette, 
  Type, 
  Sliders, 
  ExternalLink,
  RefreshCw,
  SlidersHorizontal,
  HelpCircle
} from 'lucide-react';
import { AppIcon } from '@web/shared/components/icons/AppIconRegistry.js';
import { BrandLogo } from '@web/features/brand/components/BrandLogo.js';
import type { BrandGuidelines } from '@shared-types/brand.js';
import { generateBrandLogoAI } from '@web/infrastructure/ai/promptBuilders.js';
import { savePreferences } from '@web/lib/preferences.js';
import { cn } from '@web/lib/utils.js';

export interface SettingsPageProps {
  navigateTo: (path: string, options?: { replace?: boolean }) => void;
  theme: 'dark' | 'light' | 'system';
  setTheme: (theme: 'dark' | 'light' | 'system') => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  brandGuidelines: BrandGuidelines;
  setBrandGuidelines: React.Dispatch<React.SetStateAction<BrandGuidelines>>;
  onSaveBrandGuidelines: (guidelines: BrandGuidelines) => Promise<void>;
  onWipeBrandParameters: () => Promise<void>;
  user: any;
  credits: number;
  isSyncing?: boolean;
  aspectRatio: string;
  setAspectRatio: (ratio: string) => void;
  audioVoice: string;
  setAudioVoice: (voice: string) => void;
  audioVolume: number;
  setAudioVolume: (vol: number) => void;
  bakeLogoOnGeneration: boolean;
  setBakeLogoOnGeneration: React.Dispatch<React.SetStateAction<boolean>>;
  logoPosition: { x: number; y: number };
  setLogoPosition: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  logoScale: number;
  setLogoScale: React.Dispatch<React.SetStateAction<number>>;
}

const OFFICIAL_GEMINI_VOICES = [
  { id: 'Kore', label: 'Kore (Female - Warm)' },
  { id: 'Puck', label: 'Puck (Male - Dynamic)' },
  { id: 'Charon', label: 'Charon (Male - Deep)' },
  { id: 'Fenrir', label: 'Fenrir (Male - Resonant)' },
  { id: 'Zephyr', label: 'Zephyr (Female - Calm)' },
  { id: 'Aoede', label: 'Aoede (Female - Expressive)' },
  { id: 'Callirrhoe', label: 'Callirrhoe (Female - Commercial)' },
  { id: 'Enceladus', label: 'Enceladus (Male - Cinematic)' },
  { id: 'Iapetus', label: 'Iapetus (Male - Executive)' },
  { id: 'Achird', label: 'Achird (Female - Professional)' },
  { id: 'Despina', label: 'Despina (Female - Energetic)' },
  { id: 'Rasalgethi', label: 'Rasalgethi (Male - Storyteller)' }
];

const ASPECT_RATIO_OPTIONS = [
  { id: '1:1', label: '1:1', description: 'Square (Posts & Profile)' },
  { id: '16:9', label: '16:9', description: 'Landscape (YouTube & Web)' },
  { id: '9:16', label: '9:16', description: 'Portrait (Reels & Stories)' }
];

const WATERMARK_POSITIONS = [
  { id: 'tl', label: 'Top Left', pos: { x: 15, y: 15 } },
  { id: 'tr', label: 'Top Right', pos: { x: 85, y: 15 } },
  { id: 'bl', label: 'Bottom Left', pos: { x: 15, y: 85 } },
  { id: 'br', label: 'Bottom Right', pos: { x: 85, y: 85 } }
];

export const SettingsPage: React.FC<SettingsPageProps> = ({
  navigateTo,
  theme,
  setTheme,
  sidebarOpen,
  setSidebarOpen,
  brandGuidelines,
  setBrandGuidelines,
  onSaveBrandGuidelines,
  onWipeBrandParameters,
  user,
  credits,
  isSyncing = false,
  aspectRatio,
  setAspectRatio,
  audioVoice,
  setAudioVoice,
  audioVolume,
  setAudioVolume,
  bakeLogoOnGeneration,
  setBakeLogoOnGeneration,
  logoPosition,
  setLogoPosition,
  logoScale,
  setLogoScale
}) => {
  // Brand draft state for atomic save/cancel
  const [editingGuidelines, setEditingGuidelines] = useState<BrandGuidelines>(() => 
    JSON.parse(JSON.stringify(brandGuidelines))
  );
  const [isSavingBrand, setIsSavingBrand] = useState(false);
  const [brandSaveSuccess, setBrandSaveSuccess] = useState(false);
  const [brandSaveError, setBrandSaveError] = useState<string | null>(null);

  // AI Logo generator state
  const [isGeneratingLogo, setIsGeneratingLogo] = useState(false);
  const [logoPrompt, setLogoPrompt] = useState('');
  const [logoGenError, setLogoGenError] = useState<string | null>(null);
  const [logoStyle, setLogoStyle] = useState<'minimalist' | 'monogram' | 'luxury' | 'geometric' | 'badge'>('minimalist');
  const [logoImgError, setLogoImgError] = useState(false);

  // Danger Zone confirmation state
  const [eraseConfirmState, setEraseConfirmState] = useState<'idle' | 'confirming'>('idle');

  // Active section for smooth scroll & quick nav
  const [activeSection, setActiveSection] = useState<string>('appearance');

  // Keep editing guidelines in sync when external guidelines load from cloud
  useEffect(() => {
    setEditingGuidelines(JSON.parse(JSON.stringify(brandGuidelines)));
    setLogoImgError(false);
  }, [brandGuidelines]);

  // Handle hash scrolling on mount and hashchange
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '');
      if (hash) {
        setActiveSection(hash);
        const element = document.getElementById(`section-${hash}`);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    window.history.replaceState({}, '', `/settings#${sectionId}`);
    const element = document.getElementById(`section-${sectionId}`);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Immediate preference handlers
  const handleThemeChange = (newTheme: 'dark' | 'light' | 'system') => {
    setTheme(newTheme);
    savePreferences({ theme: newTheme });
  };

  const handleSidebarChange = (open: boolean) => {
    setSidebarOpen(open);
    savePreferences({ sidebarOpen: open });
  };

  const handleAspectRatioChange = (ratio: string) => {
    setAspectRatio(ratio);
    savePreferences({ aspectRatio: ratio });
  };

  const handleVoiceChange = (voice: string) => {
    setAudioVoice(voice);
    savePreferences({ audioVoice: voice });
  };

  const handleVolumeChange = (vol: number) => {
    setAudioVolume(vol);
    savePreferences({ audioVolume: vol });
  };

  const handleWatermarkToggle = (enabled: boolean) => {
    setBakeLogoOnGeneration(enabled);
    savePreferences({ bakeLogoOnGeneration: enabled });
  };

  const handleWatermarkPositionChange = (pos: { x: number; y: number }) => {
    setLogoPosition(pos);
    savePreferences({ logoPosition: pos });
  };

  const handleWatermarkScaleChange = (scale: number) => {
    setLogoScale(scale);
    savePreferences({ logoScale: scale });
  };

  // Brand identity handlers
  const handleSaveBrand = async () => {
    try {
      setIsSavingBrand(true);
      setBrandSaveError(null);
      await onSaveBrandGuidelines(editingGuidelines);
      setBrandSaveSuccess(true);
      setTimeout(() => setBrandSaveSuccess(false), 3000);
    } catch (e: any) {
      setBrandSaveError(e?.message || 'Failed to save brand identity. Please retry.');
    } finally {
      setIsSavingBrand(false);
    }
  };

  const handleCancelBrand = () => {
    setEditingGuidelines(JSON.parse(JSON.stringify(brandGuidelines)));
    setBrandSaveError(null);
    setBrandSaveSuccess(false);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoImgError(false);
        setEditingGuidelines(prev => ({ ...prev, logo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateLogo = async (overridePrompt?: string, overrideStyle?: 'minimalist' | 'monogram' | 'luxury' | 'geometric' | 'badge') => {
    const activePrompt = (overridePrompt !== undefined ? overridePrompt : logoPrompt).trim();
    const activeStyle = overrideStyle || logoStyle;
    if (!activePrompt && !editingGuidelines.name) return;
    try {
      setIsGeneratingLogo(true);
      setLogoGenError(null);
      setLogoImgError(false);
      const generated = await generateBrandLogoAI({
        name: editingGuidelines.name || 'Brand Studio',
        industry: editingGuidelines.industry || 'Modern Business',
        colors: editingGuidelines.colors || [],
        tone: editingGuidelines.tone || 'Modern and professional',
        tagline: editingGuidelines.tagline,
        style: activeStyle,
        userIdea: activePrompt
      });
      setEditingGuidelines(prev => ({ ...prev, logo: generated }));
    } catch (e: any) {
      console.error("Failed to generate AI logo:", e);
      setLogoGenError(e?.message || "Failed to generate logo. Please retry with a different prompt.");
    } finally {
      setIsGeneratingLogo(false);
    }
  };

  // Helper to determine active watermark position button
  const isPosActive = (target: { x: number; y: number }) => {
    return Math.abs(logoPosition.x - target.x) < 10 && Math.abs(logoPosition.y - target.y) < 10;
  };

  const hasBrandChanges = JSON.stringify(brandGuidelines) !== JSON.stringify(editingGuidelines);

  return (
    <div className="flex-1 overflow-y-auto bg-slate-50/50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20">
      {/* Top Header Bar */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800 px-4 md:px-8 py-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">
              <span className="hover:text-slate-700 dark:hover:text-slate-300 cursor-pointer" onClick={() => navigateTo('/workspace')}>Workspace</span>
              <span>/</span>
              <span className="text-slate-900 dark:text-white font-bold">Settings</span>
            </div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Settings
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Manage your Writopedia workspace, creative preferences, and brand configuration.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => navigateTo('/workspace')}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold uppercase tracking-wider rounded-sm transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>Back to Workspace</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Settings Body */}
      <div className="max-w-4xl mx-auto px-4 md:px-8 py-8 space-y-12">
        {/* ====================================================
            SECTION 1: APPEARANCE
           ==================================================== */}
        <section id="section-appearance" className="scroll-mt-36 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sun size={16} className="text-rose-500" />
              <span>Appearance</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose how Writopedia looks across your active session and workspace.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Theme Mode
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                Select between light, dark, or automatic system appearance. Updates immediately.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 max-w-md">
              <button
                type="button"
                onClick={() => handleThemeChange('light')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3.5 rounded-sm border text-xs font-bold transition-all cursor-pointer",
                  theme === 'light'
                    ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                <Sun size={18} />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('dark')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3.5 rounded-sm border text-xs font-bold transition-all cursor-pointer",
                  theme === 'dark'
                    ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                <Moon size={18} />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => handleThemeChange('system')}
                className={cn(
                  "flex flex-col items-center justify-center gap-2 p-3.5 rounded-sm border text-xs font-bold transition-all cursor-pointer",
                  theme === 'system'
                    ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500 shadow-xs"
                    : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                )}
              >
                <Monitor size={18} />
                <span>System</span>
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 2: WORKSPACE & INTERFACE
           ==================================================== */}
        <section id="section-workspace" className="scroll-mt-36 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Sidebar size={16} className="text-rose-500" />
              <span>Workspace & Interface</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure default navigation and drawer behavior for creative sessions.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                  Sidebar Behavior
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Choose whether the studio navigation sidebar starts expanded or collapsed by default.
                </p>
              </div>

              <div className="inline-flex rounded-sm border border-slate-200 dark:border-slate-700 p-1 bg-slate-50 dark:bg-slate-800 shrink-0">
                <button
                  type="button"
                  onClick={() => handleSidebarChange(true)}
                  className={cn(
                    "px-4 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer",
                    sidebarOpen
                      ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  Expanded
                </button>
                <button
                  type="button"
                  onClick={() => handleSidebarChange(false)}
                  className={cn(
                    "px-4 py-1.5 rounded-sm text-xs font-bold transition-all cursor-pointer",
                    !sidebarOpen
                      ? "bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                >
                  Collapsed
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 3: CREATIVE CANVAS
           ==================================================== */}
        <section id="section-canvas" className="scroll-mt-36 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Maximize2 size={16} className="text-rose-500" />
              <span>Creative Canvas</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Set default aspect ratio framing used when opening new visual generation tools.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-xs space-y-4">
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                Default Canvas Format
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-3">
                New creative work sessions will initialize with this framing ratio.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {ASPECT_RATIO_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => handleAspectRatioChange(opt.id)}
                  className={cn(
                    "flex flex-col items-start p-3.5 rounded-sm border text-left transition-all cursor-pointer",
                    aspectRatio === opt.id
                      ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-500 ring-1 ring-rose-500 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600"
                  )}
                >
                  <span className={cn(
                    "text-sm font-bold",
                    aspectRatio === opt.id ? "text-rose-600 dark:text-rose-400" : "text-slate-900 dark:text-white"
                  )}>
                    {opt.label}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 4: AUDIO STUDIO
           ==================================================== */}
        <section id="section-audio" className="scroll-mt-36 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Volume2 size={16} className="text-rose-500" />
              <span>Audio Studio</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Configure default voice actor and playback level for audio and voiceover generation.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-xs space-y-6">
            {/* Audio Voice */}
            <div className="space-y-1.5">
              <label htmlFor="settings-audio-voice" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Default Voice
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                Official Google Gemini neural voice actor selected for commercial voiceovers.
              </p>
              <select
                id="settings-audio-voice"
                value={audioVoice}
                onChange={(e) => handleVoiceChange(e.target.value)}
                className="w-full sm:max-w-md bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-sm text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer"
              >
                {OFFICIAL_GEMINI_VOICES.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Audio Volume */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <label htmlFor="settings-audio-volume" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                    Default Playback Volume
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Master audio output volume for preview playback.
                  </p>
                </div>
                <div className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                  {Math.round(audioVolume * 100)}%
                </div>
              </div>

              <div className="flex items-center gap-4 max-w-md">
                <button
                  type="button"
                  onClick={() => handleVolumeChange(audioVolume === 0 ? 0.8 : 0)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  title={audioVolume === 0 ? "Unmute" : "Mute"}
                >
                  {audioVolume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
                </button>
                <input
                  id="settings-audio-volume"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  aria-label="Default Playback Volume"
                  aria-valuenow={Math.round(audioVolume * 100)}
                  className="flex-1 accent-rose-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 5: BRAND IDENTITY
           ==================================================== */}
        <section id="section-brand" className="scroll-mt-36 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Building2 size={16} className="text-rose-500" />
                <span>Brand Identity</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Core identity parameters injected into Gemini prompt engineering pipelines.
              </p>
            </div>

            {hasBrandChanges && (
              <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse self-start sm:self-auto">
                Unsaved Changes
              </span>
            )}
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-xs space-y-6">
            {brandSaveSuccess && (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-sm flex items-center gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 animate-in fade-in">
                <Check size={16} />
                <span>Brand identity saved and synchronized to cloud successfully!</span>
              </div>
            )}

            {brandSaveError && (
              <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-sm text-xs font-semibold text-rose-600 dark:text-rose-400">
                {brandSaveError}
              </div>
            )}

            {/* Brand Name */}
            <div className="space-y-1.5">
              <label htmlFor="settings-brand-name" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Brand Name
              </label>
              <input
                id="settings-brand-name"
                type="text"
                value={editingGuidelines.name}
                onChange={(e) => setEditingGuidelines(prev => ({ ...prev, name: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-sm text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="e.g. Acme Corp"
              />
            </div>

            {/* Industry */}
            <div className="space-y-1.5">
              <label htmlFor="settings-brand-industry" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Industry
              </label>
              <input
                id="settings-brand-industry"
                type="text"
                value={editingGuidelines.industry}
                onChange={(e) => setEditingGuidelines(prev => ({ ...prev, industry: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-sm text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="e.g. E-Commerce, Fintech, Fashion"
              />
            </div>

            {/* Tone & Voice */}
            <div className="space-y-1.5">
              <label htmlFor="settings-brand-tone" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Type size={13} className="text-rose-500" />
                <span>Tone & Voice</span>
              </label>
              <input
                id="settings-brand-tone"
                type="text"
                value={editingGuidelines.tone}
                onChange={(e) => setEditingGuidelines(prev => ({ ...prev, tone: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-sm text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="e.g. Accessible, Trustworthy, Dynamic"
              />
            </div>

            {/* Brand Tagline / Slogan */}
            <div className="space-y-1.5">
              <label htmlFor="settings-brand-tagline" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Sparkles size={13} className="text-rose-500" />
                <span>Brand Tagline / Slogan</span>
              </label>
              <input
                id="settings-brand-tagline"
                type="text"
                value={editingGuidelines.tagline || ''}
                onChange={(e) => setEditingGuidelines(prev => ({ ...prev, tagline: e.target.value }))}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-2.5 rounded-sm text-sm text-slate-900 dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-rose-500"
                placeholder="e.g. Elevate Everyday Fashion, Just Do It, Think Ahead"
              />
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Slogan integrated into typographic logos, campaign decks, and visual exports.
              </p>
            </div>

            {/* Palette Colors */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Palette size={13} className="text-rose-500" />
                <span>Palette Colors</span>
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Primary and accent colors used across visual asset compositions.
              </p>
              <div className="flex flex-wrap gap-3">
                {editingGuidelines.colors?.map((col, idx) => (
                  <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-2xs">
                    <input
                      type="color"
                      value={col}
                      aria-label={`Color swatch ${idx + 1} (${col})`}
                      onChange={(e) => {
                        const newColors = [...(editingGuidelines.colors || [])];
                        newColors[idx] = e.target.value;
                        setEditingGuidelines(prev => ({ ...prev, colors: newColors }));
                      }}
                      className="w-8 h-8 rounded-sm border-none cursor-pointer bg-transparent"
                    />
                    <input
                      type="text"
                      value={col}
                      aria-label={`Color hex value ${idx + 1}`}
                      onChange={(e) => {
                        const newColors = [...(editingGuidelines.colors || [])];
                        newColors[idx] = e.target.value;
                        setEditingGuidelines(prev => ({ ...prev, colors: newColors }));
                      }}
                      className="font-mono text-xs text-slate-700 dark:text-slate-300 w-20 bg-transparent border-none focus:outline-none uppercase"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Brand Logo */}
            <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <AppIcon name="brand-logo" size={13} strokeWidth={2} />
                <span>Brand Logo</span>
              </label>
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                <div className="w-20 h-20 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden p-2 shrink-0 relative group shadow-2xs">
                  {editingGuidelines.logo && !logoImgError ? (
                    <img 
                      src={editingGuidelines.logo} 
                      alt="Brand Logo" 
                      className="max-w-full max-h-full object-contain" 
                      referrerPolicy="no-referrer"
                      onError={() => setLogoImgError(true)} 
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-center p-1">
                      <div 
                        className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white shadow-xs mb-1"
                        style={{
                          backgroundColor: editingGuidelines.colors?.[0] || '#e11d48'
                        }}
                      >
                        {(editingGuidelines.name?.[0] || 'B').toUpperCase()}
                      </div>
                      <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                        {logoImgError ? 'Invalid URL' : 'No Logo'}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-sm text-xs font-bold cursor-pointer transition-colors">
                      <Upload size={14} />
                      <span>Upload Logo</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                    </label>

                    {editingGuidelines.logo && (
                      <button
                        type="button"
                        onClick={() => {
                          setLogoImgError(false);
                          setEditingGuidelines(prev => ({ ...prev, logo: '' }));
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-sm transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                        <span>Remove Logo</span>
                      </button>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 dark:text-slate-500">
                    Supports PNG, JPG, SVG, or WebP with transparent background.
                  </p>
                </div>
              </div>

              {/* AI Logo Generator */}
              <div className="p-4 sm:p-5 bg-gradient-to-b from-slate-50 to-slate-100/60 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200 dark:border-slate-700/80 rounded-lg space-y-4 mt-4 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={14} className="text-rose-500" />
                    <span>AI Brand Logo Synthesizer</span>
                  </span>
                  <span className="self-start sm:self-auto px-2 py-0.5 text-[10px] font-semibold rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                    2026 Vector Architecture
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Synthesize a brand symbol directly matching <strong className="text-slate-700 dark:text-slate-300 font-semibold">{editingGuidelines.name || 'your brand'}</strong>'s industry, color palette, and tagline on a solid pure white background.
                </p>

                {/* Style Selector */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider block">
                    Logo Style Archetype
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                    {[
                      { id: 'minimalist', label: 'Minimalist Vector', desc: 'Clean negative space' },
                      { id: 'monogram', label: 'Monogram', desc: 'Lettermark initials' },
                      { id: 'luxury', label: 'Luxury Crest', desc: 'High-end prestigious' },
                      { id: 'geometric', label: 'Geometric', desc: 'Golden ratio mark' },
                      { id: 'badge', label: 'Modern Badge', desc: 'Circular seal mark' }
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setLogoStyle(st.id as any)}
                        className={cn(
                          "flex flex-col items-start p-2 rounded-md border text-left transition-all cursor-pointer",
                          logoStyle === st.id
                            ? "bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300 shadow-2xs"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        <span className="text-xs font-bold leading-tight">{st.label}</span>
                        <span className="text-[10px] text-slate-400 leading-tight mt-0.5">{st.desc}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Relatable Smart Suggestions */}
                <div className="space-y-1.5 pt-1">
                  <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles size={11} className="text-amber-500" />
                    <span>Relatable Brand Ideas (Click to Populate)</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: `Minimalist ${editingGuidelines.name || 'Brand'} Symbol`,
                        style: 'minimalist' as const,
                        prompt: `Iconic minimalist vector symbol for ${editingGuidelines.name || 'Brand'} in ${editingGuidelines.industry || 'modern retail'}, pristine modern lines`
                      },
                      {
                        label: `Initials "${(editingGuidelines.name?.[0] || 'B').toUpperCase()}" Luxury Monogram`,
                        style: 'monogram' as const,
                        prompt: `Ultra-luxury typographic monogram mark featuring the letter "${(editingGuidelines.name?.[0] || 'B').toUpperCase()}" with elegant haute-couture balance`
                      },
                      {
                        label: `${editingGuidelines.industry || 'Lifestyle'} Geometric Emblem`,
                        style: 'geometric' as const,
                        prompt: `Golden-ratio sacred geometric brand emblem for ${editingGuidelines.name || 'Brand'}, high-tech negative space vector silhouette`
                      },
                      {
                        label: `Circular Heritage Badge`,
                        style: 'badge' as const,
                        prompt: `Prestigious circular brand seal for ${editingGuidelines.name || 'Brand'} with subtle subtext perimeter typography`
                      }
                    ].map((sug, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        onClick={() => {
                          setLogoPrompt(sug.prompt);
                          setLogoStyle(sug.style);
                        }}
                        className="px-2.5 py-1 text-[11px] rounded-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-rose-400 hover:text-rose-600 dark:hover:text-rose-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        + {sug.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt input & generate button */}
                <div className="flex flex-col sm:flex-row gap-2 pt-1">
                  <input
                    type="text"
                    value={logoPrompt}
                    onChange={(e) => setLogoPrompt(e.target.value)}
                    placeholder={`e.g. Modern vector emblem for ${editingGuidelines.name || 'brand'}, sleek golden-ratio lines`}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-3 py-2 text-xs rounded-md focus:outline-none focus:ring-1 focus:ring-rose-500 text-slate-900 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleGenerateLogo()}
                    disabled={isGeneratingLogo || (!logoPrompt.trim() && !editingGuidelines.name)}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-md disabled:opacity-40 transition-colors cursor-pointer flex items-center justify-center gap-1.5 shrink-0 shadow-sm active:scale-95"
                  >
                    {isGeneratingLogo ? (
                      <>
                        <Loader2 size={13} className="animate-spin" />
                        <span>Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} />
                        <span>Generate Logo</span>
                      </>
                    )}
                  </button>
                </div>
                {logoGenError && (
                  <p className="text-xs text-rose-500 font-medium">{logoGenError}</p>
                )}
              </div>
            </div>

            {/* Brand Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-3">
              <button
                type="button"
                onClick={handleCancelBrand}
                disabled={!hasBrandChanges || isSavingBrand}
                className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-sm text-xs font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveBrand}
                disabled={!hasBrandChanges || isSavingBrand}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-sm text-xs font-bold uppercase tracking-wider shadow-xs transition-colors disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1.5"
              >
                {isSavingBrand ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 6: BRAND APPLICATION / WATERMARK
           ==================================================== */}
        <section id="section-watermark" className="scroll-mt-36 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-rose-500" />
              <span>Brand Application & Watermark</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Control automated brand logo placement and scaling on future generated assets.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-6 shadow-xs space-y-6">
            {/* Watermark Toggle */}
            <div className="flex items-center justify-between gap-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block mb-1">
                  Logo Watermark
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Automatically apply the brand logo to generated images and videos.
                </p>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={bakeLogoOnGeneration}
                onClick={() => handleWatermarkToggle(!bakeLogoOnGeneration)}
                className={cn(
                  "w-12 h-6 rounded-full transition-colors relative cursor-pointer focus:outline-none shrink-0",
                  bakeLogoOnGeneration ? "bg-rose-600" : "bg-slate-300 dark:bg-slate-700"
                )}
              >
                <span
                  className={cn(
                    "block w-4 h-4 rounded-full bg-white transition-transform transform shadow-xs",
                    bakeLogoOnGeneration ? "translate-x-7" : "translate-x-1"
                  )}
                />
              </button>
            </div>

            {/* Placement & Scale (Only enabled when toggle is active) */}
            <div className={cn("space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800 transition-opacity", !bakeLogoOnGeneration && "opacity-40 pointer-events-none")}>
              {/* Position Grid */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                  Watermark Position
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
                  Select the target quadrant for brand logo placement.
                </p>

                <div className="grid grid-cols-2 gap-2 max-w-xs">
                  {WATERMARK_POSITIONS.map((pos) => {
                    const active = isPosActive(pos.pos);
                    return (
                      <button
                        key={pos.id}
                        type="button"
                        onClick={() => handleWatermarkPositionChange(pos.pos)}
                        className={cn(
                          "py-2.5 px-3 rounded-sm border text-xs font-bold text-center transition-all cursor-pointer",
                          active
                            ? "bg-rose-50/60 dark:bg-rose-950/30 border-rose-500 text-rose-600 dark:text-rose-400 ring-1 ring-rose-500"
                            : "bg-slate-50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600"
                        )}
                      >
                        {pos.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Logo Scale */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between max-w-md">
                  <div>
                    <label htmlFor="settings-watermark-scale" className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Logo Scale
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Proportional size of the logo relative to asset dimensions.
                    </p>
                  </div>
                  <div className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 dark:bg-slate-800 rounded text-slate-700 dark:text-slate-300">
                    {logoScale}%
                  </div>
                </div>

                <div className="max-w-md">
                  <input
                    id="settings-watermark-scale"
                    type="range"
                    min="5"
                    max="30"
                    step="1"
                    value={logoScale}
                    onChange={(e) => handleWatermarkScaleChange(parseInt(e.target.value))}
                    aria-label="Logo Scale"
                    aria-valuenow={logoScale}
                    className="w-full accent-rose-600 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 7: ACCOUNT / WORKSPACE INFORMATION
           ==================================================== */}
        <section id="section-account" className="scroll-mt-36 space-y-4">
          <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <User size={16} className="text-rose-500" />
              <span>Account & Workspace</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Active identity and balance details for this Writopedia workspace.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* User Account */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Signed In As</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-1">
                  {user?.email || 'Anonymous Guest'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Cloud Synced
                </span>
              </div>
            </div>

            {/* Workspace */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Workspace</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate mt-1">
                  {brandGuidelines.name ? `${brandGuidelines.name} Creative Suite` : 'Writopedia Workspace'}
                </p>
              </div>
              <span className="text-[11px] text-slate-400 font-mono">ID: default</span>
            </div>

            {/* Plan Tier */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Active Plan</span>
                <p className="text-sm font-bold text-slate-900 dark:text-white mt-1">
                  Professional Enterprise Tier
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => navigateTo('/pricing')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                >
                  <span>Manage Subscription</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>

            {/* Credits Balance */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-sm p-5 shadow-xs flex flex-col justify-between space-y-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">Creative Balance</span>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-1">
                  <Coins size={16} />
                  <span>{credits} Credits Available</span>
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => navigateTo('/pricing')}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                >
                  <span>Top-up Credits</span>
                  <ExternalLink size={12} />
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ====================================================
            SECTION 8: DANGER ZONE
           ==================================================== */}
        <section id="section-danger" className="scroll-mt-36 space-y-4">
          <div className="border-b border-rose-200 dark:border-rose-900/40 pb-3">
            <h2 className="text-base font-bold text-rose-600 dark:text-rose-400 uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={16} />
              <span>Danger Zone</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Destructive workspace actions. This will reset brand configuration.
            </p>
          </div>

          <div className="bg-rose-500/5 border border-rose-500/20 rounded-sm p-6 space-y-4">
            <div>
              <h3 className="text-sm font-bold text-rose-600 dark:text-rose-400">
                Reset Brand Profile
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mt-1">
                Clearing brand parameters will restore default settings and return your workspace to brand onboarding mode. This cannot be undone.
              </p>
            </div>

            {eraseConfirmState === 'idle' ? (
              <button
                type="button"
                onClick={() => setEraseConfirmState('confirming')}
                className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 text-xs font-bold rounded-sm cursor-pointer transition-colors"
              >
                Reset Brand Kit
              </button>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onWipeBrandParameters}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-sm cursor-pointer transition-colors shadow-xs"
                >
                  Confirm Reset
                </button>
                <button
                  type="button"
                  onClick={() => setEraseConfirmState('idle')}
                  className="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold rounded-sm cursor-pointer transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
};

export default SettingsPage;
