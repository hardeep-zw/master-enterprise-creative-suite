import React, { useState } from 'react';
import { 
  Fingerprint, 
  X, 
  Check, 
  Loader2, 
  Image as ImageIcon, 
  Video, 
  Music, 
  FileText, 
  ChevronDown, 
  ChevronUp, 
  AlertCircle,
  Send
} from 'lucide-react';
import { cn } from '@web/lib/utils.js';

export interface HumanTouchItem {
  title: string;
  prompt: string;
  imageUrl?: string;
  role: string;
  modelsUsed: string;
}

export interface HumanTouchRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: HumanTouchItem | null;
  comment: string;
  setComment: (val: string) => void;
  submitting: boolean;
  successMsg: string | null;
  onSubmit: () => Promise<void>;
}

export const HumanTouchRequestModal: React.FC<HumanTouchRequestModalProps> = ({
  isOpen,
  onClose,
  item,
  comment,
  setComment,
  submitting,
  successMsg,
  onSubmit
}) => {
  const [showFullPrompt, setShowFullPrompt] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (!isOpen || !item) return null;

  const handleDispatch = async () => {
    if (!comment.trim() || submitting) return;
    try {
      setSubmitError(null);
      await onSubmit();
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to send the curation request. Please try again.');
    }
  };

  const renderAssetThumbnail = () => {
    const roleLower = (item.role || '').toLowerCase();
    if (item.imageUrl && (roleLower.includes('image') || roleLower.includes('render') || roleLower === 'image')) {
      return (
        <img 
          src={item.imageUrl} 
          alt={item.title} 
          className="w-16 h-16 object-cover rounded-md border border-slate-200 dark:border-slate-700 shrink-0 bg-slate-900" 
          referrerPolicy="no-referrer"
        />
      );
    }
    if (roleLower.includes('video')) {
      return (
        <div className="w-16 h-16 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
          <Video size={20} className="text-rose-500" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold mt-1">Video</span>
        </div>
      );
    }
    if (roleLower.includes('audio') || roleLower.includes('voice')) {
      return (
        <div className="w-16 h-16 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
          <Music size={20} className="text-violet-500" />
          <span className="text-[9px] uppercase tracking-wider font-mono font-bold mt-1">Audio</span>
        </div>
      );
    }
    return (
      <div className="w-16 h-16 rounded-md bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-500 shrink-0">
        <FileText size={20} className="text-amber-500" />
        <span className="text-[9px] uppercase tracking-wider font-mono font-bold mt-1">Deck</span>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-110 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-slate-900 max-w-xl w-full border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">

        {/* Modal Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-md ring-1 ring-rose-500/20">
              <Fingerprint size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Human Touch
                </h3>
                <span className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-full bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Artist Service
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Have a Writopedia artist refine this creative.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 overflow-y-auto">

          {/* Source Asset Card */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Source Creative
            </label>
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/70 rounded-md border border-slate-200 dark:border-slate-700/80 space-y-2">
              <div className="flex items-center gap-3.5">
                {renderAssetThumbnail()}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                      {item.title}
                    </p>
                    <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {item.role}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                    Generated with {item.modelsUsed || 'Writopedia AI Engine'}
                  </p>
                </div>
              </div>

              {item.prompt && (
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase text-slate-400">Original Prompt</span>
                    <button
                      type="button"
                      onClick={() => setShowFullPrompt(!showFullPrompt)}
                      className="text-[10px] font-semibold text-rose-500 hover:text-rose-600 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{showFullPrompt ? 'Collapse' : 'Expand'}</span>
                      {showFullPrompt ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                    </button>
                  </div>
                  <p className={cn(
                    "text-[11px] text-slate-600 dark:text-slate-300 font-mono mt-1 leading-relaxed bg-white dark:bg-slate-900 p-2 rounded border border-slate-200/60 dark:border-slate-800",
                    !showFullPrompt && "line-clamp-2"
                  )}>
                    "{item.prompt}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* User Feedback Textarea */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="human-touch-comment" className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                What should the artist change?
              </label>
              <span className="text-[10px] text-slate-400 font-medium">Instructions for human artist</span>
            </div>
            <textarea
              id="human-touch-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g. Please improve the lighting, move the logo to the top-right, adjust color balance to warm tones, and reduce background clutter."
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md p-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-rose-500 h-28 resize-none leading-relaxed"
            />
            {/* Descriptive Guidance Hints */}
            <p className="text-[11px] text-slate-400 dark:text-slate-500 leading-normal">
              <span className="font-semibold text-slate-500 dark:text-slate-400">Suggestions:</span> Lighting · Composition · Typography · Brand alignment · Logo placement · Color correction · Retouching
            </p>
          </div>

          {/* Subtext info */}
          <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded border border-slate-200/60 dark:border-slate-800">
            The request will be reviewed by the Writopedia creative team before refinement begins. Completed deliverables will arrive in your Curation Inbox and can be saved to your Asset Library.
          </div>

          {/* Error Message */}
          {submitError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-md flex items-center gap-2 text-xs font-semibold">
              <AlertCircle size={14} className="shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {/* Success Message */}
          {successMsg && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-md flex items-center gap-2 text-xs font-semibold">
              <Check size={14} className="shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 bg-slate-50/50 dark:bg-slate-900/50">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-xs font-bold uppercase tracking-wider hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDispatch}
            disabled={submitting || !comment.trim()}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-md text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 shadow-sm active:scale-95"
          >
            {submitting ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Dispatching...</span>
              </>
            ) : successMsg ? (
              <>
                <Check size={13} />
                <span>Request Sent</span>
              </>
            ) : (
              <>
                <Send size={13} />
                <span>Dispatch Request</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

