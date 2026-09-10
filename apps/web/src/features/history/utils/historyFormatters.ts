import React from 'react';
import {
  Aperture,
  Clapperboard,
  Presentation,
  AudioWaveform,
  Compass,
  ShoppingBag,
  MessageSquareQuote,
  Film,
  Sparkles,
  History,
  FileText
} from 'lucide-react';
import { GENERIC_GEMS } from '@web/infrastructure/ai/modelRegistry.js';
import type { HistoryItem } from '../../layout/components/AppSidebar.js';

/**
 * Maps gem ID to an appropriate Lucide icon.
 */
export function getGemIcon(gemId?: string): React.ComponentType<{ size?: number; className?: string }> {
  if (!gemId) return Sparkles;

  const norm = gemId.toLowerCase();
  if (norm.includes('video') || norm.includes('kling') || norm.includes('omni') || norm.includes('veo')) {
    return Clapperboard;
  }
  if (norm.includes('image') || norm.includes('render') || norm.includes('photo')) {
    return Aperture;
  }
  if (norm.includes('presentation') || norm.includes('deck') || norm.includes('slide')) {
    return Presentation;
  }
  if (norm.includes('audio') || norm.includes('voice') || norm.includes('sound') || norm.includes('music')) {
    return AudioWaveform;
  }
  if (norm.includes('storyline') || norm.includes('narrative')) {
    return Film;
  }
  if (norm.includes('bundle') || norm.includes('ecommerce')) {
    return ShoppingBag;
  }
  if (norm.includes('caption') || norm.includes('copy')) {
    return MessageSquareQuote;
  }
  if (norm.includes('campaign') || norm.includes('strategy')) {
    return Compass;
  }
  if (norm.includes('doc') || norm.includes('text')) {
    return FileText;
  }

  return History;
}

/**
 * Returns the human-friendly name of the tool/gem from its ID.
 */
export function getGemName(gemId?: string): string {
  if (!gemId) return 'Creative Tool';
  const found = GENERIC_GEMS.find(g => g.id === gemId);
  if (found) return found.name;

  const norm = gemId.toLowerCase();
  if (norm.includes('video')) return 'Video Generation';
  if (norm.includes('image')) return 'Image Generation';
  if (norm.includes('presentation') || norm.includes('deck')) return 'Corporate Deck';
  if (norm.includes('audio')) return 'Audio Studio';
  if (norm.includes('storyline')) return 'Storyline';
  if (norm.includes('caption')) return 'Captions';
  if (norm.includes('campaign')) return 'Campaign Strategy';
  return 'Creative Generation';
}

/**
 * Computes a smart, deterministic display title for a creative history item.
 * Eliminates repetitive "Creative Generation" rows by prioritizing substantive prompts.
 */
export function getCreativeDisplayTitle(item: HistoryItem): string {
  if (item.title && item.title.trim() && item.title.trim() !== 'Creative Generation' && item.title.trim() !== 'Creative Output') {
    return item.title.trim();
  }

  if (item.prompt && item.prompt.trim()) {
    let clean = item.prompt.trim().replace(/^["']|["']$/g, '');
    clean = clean.replace(/^(create|generate|design|write)\s+(an?|the)?\s*/i, '');
    clean = clean.charAt(0).toUpperCase() + clean.slice(1);
    return clean;
  }

  return getGemName(item.gemId);
}

/**
 * Formats a timestamp into a compact relative or date-time string.
 */
export function formatRelativeTime(timestamp: number | string): string {
  const time = typeof timestamp === 'string' ? new Date(timestamp).getTime() : timestamp;
  if (!time || isNaN(time)) return '';

  const now = Date.now();
  const diffSec = Math.floor((now - time) / 1000);

  if (diffSec < 60) return 'Just now';
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  if (diffSec < 172800) return 'Yesterday';

  const date = new Date(time);
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

/**
 * Formats a timestamp into date and time for ledger rows (e.g., "Sep 10, 2026 · 04:15").
 */
export function formatLedgerTime(timestamp: string | number): string {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return '';

  const dateStr = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  const timeStr = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: false });
  return `${dateStr} · ${timeStr}`;
}
