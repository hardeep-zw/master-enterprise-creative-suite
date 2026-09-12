import React, { useState, useMemo } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ArrowLeft, 
  ExternalLink, 
  FileText, 
  FileImage, 
  Download,
  Info,
  Calendar,
  Layers,
  Sparkles,
  MessageSquare,
  Film,
  Music,
  FolderPlus,
  ArrowUpRight,
  Copy,
  Check,
  Search,
  Filter,
  RefreshCw,
  SlidersHorizontal,
  Ban
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '@web/lib/utils.js';

export interface UserHumanTouchRequest {
  id: string;
  assetType: string;
  assetUrl: string;
  originalPrompt: string;
  modelsUsed: string;
  userComment: string;
  emailReceipt: string;
  status: string;
  timestamp: number;
  completedAssetUrl?: string;
  completedComment?: string;
  completedTimestamp?: number;
}

interface CurationQueuePanelProps {
  requests: UserHumanTouchRequest[];
  onClose: () => void;
  selectedRequestId?: string | null;
  onSelectRequest?: (id: string | null) => void;
  onOpenAssetInStudio?: (asset: any) => void;
  onSaveAssetToLibrary?: (asset: any) => Promise<void>;
  onCancelRequest?: (requestId: string) => Promise<void>;
}

type StatusFilter = 'all' | 'pending' | 'in_review' | 'completed' | 'rejected';

function formatTimestamp(ts?: number | null): string {
  if (!ts) return 'Pending';
  const d = new Date(ts);
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  const day = d.getDate();
  const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `${month} ${day} · ${time}`;
}

export default function CurationQueuePanel({ 
  requests, 
  onClose, 
  selectedRequestId,
  onSelectRequest,
  onOpenAssetInStudio,
  onSaveAssetToLibrary,
  onCancelRequest
}: CurationQueuePanelProps) {
  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [savedAssetIds, setSavedAssetIds] = useState<Set<string>>(new Set());
  const [isSavingAsset, setIsSavingAsset] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Active selected request
  const [activeRequestId, setActiveRequestId] = useState<string | null>(() => {
    if (selectedRequestId) return selectedRequestId;
    return requests.length > 0 ? requests[0].id : null;
  });

  // Keep in sync with parent props
  React.useEffect(() => {
    if (selectedRequestId) {
      setActiveRequestId(selectedRequestId);
    } else if (!activeRequestId && requests.length > 0) {
      setActiveRequestId(requests[0].id);
    }
  }, [selectedRequestId, requests]);

  const activeRequest = useMemo(() => {
    return requests.find(r => r.id === activeRequestId) || (requests.length > 0 ? requests[0] : null);
  }, [requests, activeRequestId]);

  // Status badge helper
  const getStatusBadge = (rawStatus: string) => {
    const status = rawStatus === 'under-review' ? 'in_review' : rawStatus;
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-xs bg-emerald-500/10 border border-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-mono uppercase tracking-wider">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'in_review':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-xs bg-sky-500/10 border border-sky-500/25 text-sky-600 dark:text-sky-400 font-mono uppercase tracking-wider">
            <Clock size={12} className="animate-spin" />
            In Review
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-xs bg-rose-500/10 border border-rose-500/25 text-rose-600 dark:text-rose-400 font-mono uppercase tracking-wider">
            <XCircle size={12} />
            Unable to Fulfill
          </span>
        );
      case 'pending':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-xs bg-amber-500/10 border border-amber-500/25 text-amber-600 dark:text-amber-400 font-mono uppercase tracking-wider">
            <Clock size={12} />
            Pending Review
          </span>
        );
    }
  };

  const getAssetTypeIcon = (type?: string) => {
    switch (type?.toLowerCase()) {
      case 'video':
        return <Film size={14} className="text-sky-500" />;
      case 'audio':
        return <Music size={14} className="text-amber-500" />;
      case 'doc':
      case 'presentation':
      case 'deck':
        return <FileText size={14} className="text-rose-500" />;
      case 'image':
      default:
        return <FileImage size={14} className="text-slate-400" />;
    }
  };

  // Filter requests
  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const normalizedStatus = req.status === 'under-review' ? 'in_review' : req.status;
      const matchesTab = activeTab === 'all' ? true : normalizedStatus === activeTab;
      const q = searchQuery.toLowerCase().trim();
      const matchesQuery = !q || 
        req.id.toLowerCase().includes(q) ||
        req.originalPrompt?.toLowerCase().includes(q) ||
        req.userComment?.toLowerCase().includes(q) ||
        req.assetType?.toLowerCase().includes(q);
      return matchesTab && matchesQuery;
    });
  }, [requests, activeTab, searchQuery]);

  // Counts by status
  const counts = useMemo(() => {
    return {
      all: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      in_review: requests.filter(r => r.status === 'in_review' || r.status === 'under-review').length,
      completed: requests.filter(r => r.status === 'completed').length,
      rejected: requests.filter(r => r.status === 'rejected').length
    };
  }, [requests]);

  // Handler: Open in Studio
  const handleOpenInStudio = (req: UserHumanTouchRequest) => {
    if (!req.completedAssetUrl || !onOpenAssetInStudio) return;
    onOpenAssetInStudio({
      type: req.assetType || 'image',
      data: req.completedAssetUrl,
      prompt: req.originalPrompt,
      name: `Curated ${req.assetType || 'Creative'} (${req.id.slice(0, 8)})`
    });
  };

  // Handler: Save to Asset Library
  const handleSaveToLibrary = async (req: UserHumanTouchRequest) => {
    if (!req.completedAssetUrl || !onSaveAssetToLibrary || savedAssetIds.has(req.id)) return;
    try {
      setIsSavingAsset(true);
      await onSaveAssetToLibrary({
        id: `curated-${req.id}-${Date.now()}`,
        name: `Curated: ${req.originalPrompt ? req.originalPrompt.slice(0, 35) + '...' : 'Refined Deliverable'}`,
        data: req.completedAssetUrl,
        type: req.assetType || 'image',
        role: req.assetType || 'image',
        timestamp: Date.now()
      });
      setSavedAssetIds(prev => new Set(prev).add(req.id));
    } catch (err) {
      console.error("Failed to persist deliverable to Asset Library:", err);
    } finally {
      setIsSavingAsset(false);
    }
  };

  // Handler: Download
  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Handler: Copy Prompt
  const handleCopyPrompt = (prompt: string) => {
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  // Handler: Cancel Request
  const handleCancel = async (reqId: string) => {
    if (!window.confirm("Are you sure you want to cancel this curation request? Your instructions will remain on file, but our artist team will stop work.")) {
      return;
    }
    if (!onCancelRequest) return;
    try {
      setIsCancelling(true);
      await onCancelRequest(reqId);
    } catch (err) {
      console.error("Failed to cancel request:", err);
    } finally {
      setIsCancelling(false);
    }
  };

  return (
    <div id="user-curation-inbox" className="flex-1 flex flex-col h-full bg-slate-950 text-slate-100 overflow-hidden">
      {/* Top Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between shrink-0 gap-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={onClose} 
            className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-xs transition-colors border border-slate-800"
            title="Back to Suite"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <h1 className="text-base font-bold tracking-tight text-white uppercase font-mono">
                Curation Inbox
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5 font-sans">
              Human refinement requests and completed deliverables
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-slate-950 border border-slate-800">
            <span className="text-[10px] uppercase text-slate-500">Tracked:</span>
            <span className="font-bold text-white">{requests.length}</span>
          </div>
          {counts.in_review > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xs bg-sky-950/60 border border-sky-800/60 text-sky-400">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-ping" />
              <span className="text-[10px] uppercase">{counts.in_review} In Review</span>
            </div>
          )}
        </div>
      </header>

      {/* Main Workspace 2-Column Split */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden min-h-0">
        
        {/* Left Column: Work Orders Feed */}
        <div className="w-full lg:w-5/12 flex flex-col border-r border-slate-800 overflow-hidden min-h-0 bg-slate-900/50">
          
          {/* Filter Bar & Search */}
          <div className="p-3 bg-slate-900 border-b border-slate-800 space-y-2.5 shrink-0">
            {/* Search Input */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Search orders, prompts, instructions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xs text-xs text-slate-200 placeholder-slate-500 focus:outline-hidden focus:border-slate-600 transition-colors font-mono"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar pt-1">
              {(
                [
                  { key: 'all', label: 'All', count: counts.all },
                  { key: 'pending', label: 'Pending', count: counts.pending },
                  { key: 'in_review', label: 'In Review', count: counts.in_review },
                  { key: 'completed', label: 'Completed', count: counts.completed },
                  { key: 'rejected', label: 'Declined', count: counts.rejected }
                ] as const
              ).map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded-xs whitespace-nowrap transition-all flex items-center gap-1.5 border",
                    activeTab === tab.key
                      ? "bg-slate-800 border-slate-700 text-white font-bold"
                      : "bg-slate-950/60 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850"
                  )}
                >
                  {tab.label}
                  {tab.count > 0 && (
                    <span className={cn(
                      "text-[9px] px-1 rounded-xs font-bold",
                      activeTab === tab.key ? "bg-slate-700 text-white" : "bg-slate-800 text-slate-400"
                    )}>
                      {tab.count}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Deliverables List */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/70 min-h-0">
            {filteredRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center h-64 space-y-2">
                <Info className="w-8 h-8 text-slate-600 mb-1" />
                <p className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400">
                  {requests.length === 0 ? "No Curation Requests Sent Yet" : "No Matching Requests"}
                </p>
                <p className="text-xs text-slate-500 max-w-xs leading-relaxed font-sans">
                  {requests.length === 0 
                    ? "Generate creatives in the workspace and click Human Touch to request fine-tuning by Writopedia artists." 
                    : "Try selecting a different filter tab or clearing your search term."}
                </p>
              </div>
            ) : (
              filteredRequests.map((req) => {
                const isActive = activeRequest?.id === req.id;
                const normalizedStatus = req.status === 'under-review' ? 'in_review' : req.status;

                return (
                  <button
                    key={req.id}
                    onClick={() => {
                      setActiveRequestId(req.id);
                      if (onSelectRequest) onSelectRequest(req.id);
                    }}
                    className={cn(
                      "w-full text-left p-4 transition-all flex flex-col gap-2.5 relative border-l-2",
                      isActive 
                        ? 'bg-slate-800/60 border-rose-500 text-white' 
                        : 'border-transparent hover:bg-slate-850/50 text-slate-300'
                    )}
                  >
                    {/* Card Header: Type, Code & Status */}
                    <div className="flex items-center justify-between gap-2 shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-slate-950 rounded-xs flex items-center justify-center border border-slate-800 shrink-0">
                          {getAssetTypeIcon(req.assetType)}
                        </div>
                        <span className="text-xs font-mono font-bold text-slate-200">
                          {req.id.toUpperCase().slice(0, 16)}
                        </span>
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded-xs bg-slate-800 text-slate-400">
                          {req.assetType || 'creative'}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500">
                        {formatTimestamp(req.timestamp)}
                      </span>
                    </div>

                    {/* Excerpt of instructions or prompt */}
                    <div className="space-y-1">
                      {req.userComment ? (
                        <p className="text-xs text-slate-300 font-sans line-clamp-2 leading-snug">
                          <span className="text-[10px] font-mono uppercase text-slate-500 mr-1">Feedback:</span>
                          "{req.userComment}"
                        </p>
                      ) : (
                        <p className="text-xs text-slate-400 font-mono line-clamp-2 leading-snug">
                          {req.originalPrompt}
                        </p>
                      )}
                    </div>

                    {/* Footer: status badge & delivery flag */}
                    <div className="flex items-center justify-between pt-1 border-t border-dashed border-slate-800 shrink-0">
                      <span className="text-[9px] font-mono uppercase text-slate-500 truncate max-w-[180px]">
                        {req.modelsUsed || 'Writopedia Production'}
                      </span>
                      {getStatusBadge(normalizedStatus)}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Work Order Inspector */}
        <div className="w-full lg:w-7/12 overflow-y-auto flex flex-col p-6 space-y-6 bg-slate-950 min-h-0">
          <AnimatePresence mode="wait">
            {activeRequest ? (
              <motion.div
                key={activeRequest.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="space-y-6 max-w-3xl"
              >
                {/* Visual Order Card */}
                <div className="bg-slate-900 border border-slate-800 rounded-xs p-5 shadow-xs space-y-5">
                  
                  {/* Title & Status Bar */}
                  <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                          Work Order
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-800 rounded-xs text-slate-400 uppercase">
                          {activeRequest.assetType || 'image'}
                        </span>
                      </div>
                      <h2 className="text-base font-bold font-mono text-white tracking-wide break-all">
                        {activeRequest.id.toUpperCase()}
                      </h2>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {getStatusBadge(activeRequest.status)}
                      {activeRequest.status === 'pending' && onCancelRequest && (
                        <button
                          onClick={() => handleCancel(activeRequest.id)}
                          disabled={isCancelling}
                          className="px-2.5 py-1 text-[11px] font-mono uppercase text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-slate-800 hover:border-rose-900 rounded-xs transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                          title="Cancel pending request"
                        >
                          <Ban size={12} />
                          Cancel Request
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Lifecycle Milestones Timeline */}
                  <div className="bg-slate-950 border border-slate-800 rounded-xs p-3.5">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-500 font-bold block mb-3">
                      Production Lifecycle
                    </span>

                    <div className="grid grid-cols-3 gap-2 text-left relative">
                      {/* Step 1: Submitted */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span className="text-xs font-mono font-bold text-slate-200">1. Submitted</span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-400">
                          {formatTimestamp(activeRequest.timestamp)}
                        </p>
                      </div>

                      {/* Step 2: In Review */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            activeRequest.status === 'in_review' || activeRequest.status === 'under-review'
                              ? "bg-sky-400 animate-ping"
                              : activeRequest.status === 'completed'
                              ? "bg-emerald-400"
                              : "bg-slate-600"
                          )} />
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            activeRequest.status === 'in_review' || activeRequest.status === 'under-review'
                              ? "text-sky-400"
                              : activeRequest.status === 'completed'
                              ? "text-slate-200"
                              : "text-slate-500"
                          )}>
                            2. In Review
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500">
                          {activeRequest.status === 'in_review' || activeRequest.status === 'under-review'
                            ? 'Artist active'
                            : activeRequest.status === 'completed'
                            ? 'Reviewed'
                            : 'Awaiting desk'}
                        </p>
                      </div>

                      {/* Step 3: Delivered / Complete */}
                      <div className="space-y-1">
                        <div className="flex items-center gap-1.5">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            activeRequest.status === 'completed'
                              ? "bg-emerald-400"
                              : activeRequest.status === 'rejected'
                              ? "bg-rose-400"
                              : "bg-slate-600"
                          )} />
                          <span className={cn(
                            "text-xs font-mono font-bold",
                            activeRequest.status === 'completed'
                              ? "text-emerald-400"
                              : activeRequest.status === 'rejected'
                              ? "text-rose-400"
                              : "text-slate-500"
                          )}>
                            {activeRequest.status === 'rejected' ? 'Declined' : '3. Completed'}
                          </span>
                        </div>
                        <p className="text-[10px] font-mono text-slate-500">
                          {activeRequest.completedTimestamp 
                            ? formatTimestamp(activeRequest.completedTimestamp)
                            : activeRequest.status === 'rejected'
                            ? 'Unable to fulfill'
                            : 'Pending release'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* High Fidelity Completed Deliverable Section */}
                  {activeRequest.status === 'completed' && activeRequest.completedAssetUrl ? (
                    <div className="p-4 bg-emerald-950/30 border border-emerald-500/30 rounded-xs space-y-4">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-emerald-400 font-mono font-bold text-xs uppercase tracking-wider">
                          <CheckCircle2 size={15} className="text-emerald-400" />
                          Professional Deliverable Released
                        </div>
                        {activeRequest.completedTimestamp && (
                          <span className="text-[10px] font-mono text-emerald-400/80">
                            {formatTimestamp(activeRequest.completedTimestamp)}
                          </span>
                        )}
                      </div>

                      {activeRequest.completedComment && (
                        <div className="space-y-1">
                          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1">
                            <MessageSquare size={10} />
                            Artist Delivery Notes
                          </span>
                          <div className="p-3 bg-slate-900 border border-emerald-500/20 rounded-xs text-xs text-emerald-300/90 leading-relaxed font-sans italic">
                            "{activeRequest.completedComment}"
                          </div>
                        </div>
                      )}

                      {/* Completed Deliverable Media Preview */}
                      <div className="space-y-2">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-mono block">
                          Curated Output
                        </span>

                        {activeRequest.assetType?.toLowerCase() === 'video' ? (
                          <div className="relative border border-emerald-500/20 rounded-xs overflow-hidden bg-black max-h-80 flex items-center justify-center">
                            <video 
                              src={activeRequest.completedAssetUrl} 
                              controls 
                              className="w-full max-h-80 object-contain"
                            />
                          </div>
                        ) : activeRequest.assetType?.toLowerCase() === 'audio' ? (
                          <div className="p-4 bg-slate-900 border border-emerald-500/20 rounded-xs flex flex-col gap-2">
                            <div className="flex items-center gap-2 text-xs font-mono text-slate-300">
                              <Music size={16} className="text-amber-400" />
                              <span>Audio Deliverable Ready</span>
                            </div>
                            <audio src={activeRequest.completedAssetUrl} controls className="w-full" />
                          </div>
                        ) : activeRequest.assetType?.toLowerCase() === 'doc' || activeRequest.assetType?.toLowerCase() === 'presentation' ? (
                          <div className="p-5 bg-slate-900 border border-emerald-500/20 rounded-xs flex items-center gap-3">
                            <FileText size={24} className="text-rose-400 shrink-0" />
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-mono font-bold text-white truncate">Curated Document</p>
                              <p className="text-[10px] font-mono text-slate-400 truncate">{activeRequest.completedAssetUrl}</p>
                            </div>
                          </div>
                        ) : (
                          <div className="relative border border-emerald-500/20 rounded-xs overflow-hidden bg-slate-950 max-h-96 flex items-center justify-center">
                            <img 
                              src={activeRequest.completedAssetUrl} 
                              alt="Writopedia Curation release" 
                              className="object-contain max-h-96 w-full"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        )}

                        {/* Real Production Deliverable Actions */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                          {onOpenAssetInStudio && (
                            <button
                              onClick={() => handleOpenInStudio(activeRequest)}
                              className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-slate-100 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider rounded-xs transition-colors shadow-xs cursor-pointer"
                            >
                              <ArrowUpRight size={14} />
                              Open in Studio
                            </button>
                          )}

                          <button
                            onClick={() => handleDownload(
                              activeRequest.completedAssetUrl!, 
                              `curated_${activeRequest.id}.${activeRequest.assetType === 'video' ? 'mp4' : activeRequest.assetType === 'audio' ? 'mp3' : 'png'}`
                            )}
                            className="flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs font-mono uppercase tracking-wider rounded-xs transition-colors border border-slate-700 cursor-pointer"
                          >
                            <Download size={13} />
                            Download
                          </button>

                          {onSaveAssetToLibrary && (
                            <button
                              onClick={() => handleSaveToLibrary(activeRequest)}
                              disabled={isSavingAsset || savedAssetIds.has(activeRequest.id)}
                              className={cn(
                                "flex items-center justify-center gap-1.5 py-2 px-3 font-bold text-xs font-mono uppercase tracking-wider rounded-xs transition-colors border cursor-pointer",
                                savedAssetIds.has(activeRequest.id)
                                  ? "bg-emerald-950/60 border-emerald-800 text-emerald-400 cursor-default"
                                  : "bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                              )}
                            >
                              {savedAssetIds.has(activeRequest.id) ? (
                                <>
                                  <Check size={13} />
                                  Saved in Library
                                </>
                              ) : (
                                <>
                                  <FolderPlus size={13} />
                                  Save to Library
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ) : activeRequest.status === 'rejected' ? (
                    <div className="p-4 bg-rose-950/30 border border-rose-500/30 rounded-xs space-y-2 text-rose-300">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono text-rose-400">
                        <XCircle size={15} />
                        Unable to Fulfill Request
                      </div>
                      <p className="text-xs leading-relaxed font-sans text-rose-200/80">
                        {activeRequest.completedComment || "This request could not be fulfilled by the creative curation desk. If this was a misunderstanding or you need assistance, you can submit a new request with updated instructions."}
                      </p>
                    </div>
                  ) : activeRequest.status === 'in_review' || activeRequest.status === 'under-review' ? (
                    <div className="p-4 bg-sky-950/30 border border-sky-500/30 rounded-xs space-y-2 text-sky-300">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono text-sky-400">
                        <Clock size={15} className="animate-spin" />
                        Artist Actively Refining Asset
                      </div>
                      <p className="text-xs leading-relaxed font-sans text-sky-200/80">
                        A Writopedia professional artist has picked up your work order. The retouched deliverable and artist notes will be released directly into this inbox once completed.
                      </p>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-950/30 border border-amber-500/30 rounded-xs space-y-2 text-amber-300">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider font-mono text-amber-400">
                        <Clock size={15} />
                        Queued for Artist Review
                      </div>
                      <p className="text-xs leading-relaxed font-sans text-amber-200/80">
                        Your request is in the curation queue. An artist will review your instructions and begin refinement shortly.
                      </p>
                    </div>
                  )}

                  {/* Requested Adjustments / User Feedback */}
                  {activeRequest.userComment && (
                    <div className="space-y-1.5 pt-3 border-t border-slate-800">
                      <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold block">
                        What Should the Artist Change?
                      </span>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs text-xs text-slate-200 font-sans leading-relaxed whitespace-pre-wrap">
                        {activeRequest.userComment}
                      </div>
                    </div>
                  )}

                  {/* Source Asset & Original Prompt */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <span className="text-[10px] uppercase tracking-widest text-slate-400 font-mono font-bold block">
                      Original AI Generation Details
                    </span>

                    {/* Original Prompt */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                        <span>ORIGINAL PROMPT</span>
                        <button
                          onClick={() => handleCopyPrompt(activeRequest.originalPrompt)}
                          className="flex items-center gap-1 hover:text-slate-300 transition-colors"
                        >
                          {copiedPrompt ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                          <span>{copiedPrompt ? 'Copied' : 'Copy'}</span>
                        </button>
                      </div>
                      <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs text-xs text-slate-300 font-mono leading-relaxed select-all">
                        {activeRequest.originalPrompt || 'No prompt recorded'}
                      </div>
                    </div>

                    {/* Source Creative Thumbnail */}
                    {activeRequest.assetUrl && (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                          <span>SOURCE CREATIVE SENT TO ARTIST</span>
                          <a
                            href={activeRequest.assetUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1 text-slate-400 hover:text-white transition-colors"
                          >
                            <span>Open Source</span>
                            <ExternalLink size={10} />
                          </a>
                        </div>

                        {activeRequest.assetType?.toLowerCase() === 'image' || activeRequest.assetUrl.includes('.png') || activeRequest.assetUrl.includes('.jpg') || activeRequest.assetUrl.includes('.webp') || activeRequest.assetUrl.includes('/generations/') || activeRequest.assetUrl.startsWith('data:image/') ? (
                          <div className="relative border border-slate-800 rounded-xs overflow-hidden bg-slate-950 max-h-60 flex items-center justify-center">
                            <img 
                              src={activeRequest.assetUrl} 
                              alt="Source Creative" 
                              className="object-contain max-h-60"
                              referrerPolicy="no-referrer"
                            />
                          </div>
                        ) : (
                          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xs text-xs font-mono text-slate-400 break-all">
                            {activeRequest.assetUrl}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Metadata specs */}
                    <div className="grid grid-cols-2 gap-3 pt-2 text-[10px] font-mono">
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs">
                        <span className="text-slate-500 uppercase block">Model Engine</span>
                        <span className="text-slate-300 font-bold mt-0.5 block truncate">
                          {activeRequest.modelsUsed || 'Writopedia Ensemble'}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xs">
                        <span className="text-slate-500 uppercase block">Email Receipt</span>
                        <span className="text-slate-300 font-bold mt-0.5 block truncate">
                          {activeRequest.emailReceipt || 'Registered Account'}
                        </span>
                      </div>
                    </div>
                  </div>

                </div>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-12 text-center h-96 space-y-3">
                <div className="w-12 h-12 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                  <Layers size={20} />
                </div>
                <h3 className="text-sm font-semibold text-slate-300 font-mono uppercase tracking-wider">
                  Curation Work Order Inspector
                </h3>
                <p className="text-xs text-slate-500 max-w-sm font-sans">
                  Select an order from the list on the left to track its artist refinement status, inspect notes, or access your retouched deliverables.
                </p>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}

export { CurationQueuePanel };
