/**
 * Pure domain definitions for Brand Identity and Guidelines.
 * Framework-free: MUST NOT import React, Firebase, Express, or vendor SDKs.
 */

export interface BrandTypography {
  primary: string;
  secondary: string;
}

export interface BrandFacts {
  name?: string;
  description?: string;
  industry?: string;
  products?: string[];
  services?: string[];
  markets?: string[];
  locations?: string[];
  claims?: string[];
  language?: string;
}

export interface BrandInferences {
  positioning?: string;
  targetAudience?: string;
  customerSegments?: string[];
  personality?: string[];
  archetype?: string;
  differentiation?: string;
  perceivedMaturity?: string;
  communicationStyle?: string;
}

export interface VisualSignals {
  colors?: string[];
  typography?: { primary?: string; secondary?: string };
  imagery?: string;
  composition?: string;
  visualMotifs?: string[];
}

export interface MessagingSignals {
  tone?: string;
  vocabulary?: {
    preferred?: string[];
    avoid?: string[];
  };
  recurringPhrases?: string[];
  valuePropositions?: string[];
}

export interface CreativeDirectives {
  visual?: string;
  copy?: string;
  video?: string;
  presentation?: string;
}

export interface BrandEvidenceItem {
  statement: string;
  source: string;
  basis: string;
}

export interface BrandConfidence {
  industry?: 'high' | 'medium' | 'low';
  positioning?: 'high' | 'medium' | 'low';
  audience?: 'high' | 'medium' | 'low';
  location?: 'high' | 'medium' | 'low';
}

export interface BrandIntelligenceProfile {
  facts: BrandFacts;
  inferences: BrandInferences;
  visualSignals: VisualSignals;
  messagingSignals: MessagingSignals;
  creativeDirectives?: CreativeDirectives;
  evidence?: BrandEvidenceItem[];
  confidence?: BrandConfidence;
  missingOrUncertain?: string[];
}

export interface NormalizedBrandSource {
  sourceType: 'url' | 'description';
  sourceUrl?: string;
  title?: string;
  metaDescription?: string;
  headings: string[];
  keyParagraphs: string[];
  navigationItems: string[];
  socialLinks: string[];
  detectedLogoCandidates: string[];
  detectedColors: string[];
  detectedTypography?: { primary?: string; secondary?: string };
  rawDescription?: string;
  aboutText?: string;
}

export interface UserBrandOverrides {
  name?: string;
  industry?: string;
  tone?: string;
  targetAudience?: string;
  tagline?: string;
  location?: string;
  voiceAccentStyle?: string;
  visualEthnicityStyle?: string;
  colors?: string[];
  logo?: string;
  additionalNotes?: string;
}

export interface BrandGuidelines {
  name: string;
  industry: string;
  tone: string;
  pillars: string[];
  colors: string[];
  typography: BrandTypography;
  logo?: string;
  logoDescription?: string;
  tagline?: string;
  location?: string;
  voiceAccentStyle?: string;
  visualEthnicityStyle?: string;
  mission?: string;
  updatedAt?: number;
  intelligence?: BrandIntelligenceProfile;
  creativeDirectives?: CreativeDirectives;
}

