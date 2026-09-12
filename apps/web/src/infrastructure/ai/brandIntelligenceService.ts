/**
 * Brand Intelligence & Guidelines Synthesis Engine.
 * Two-stage AI pipeline:
 * Stage 1: Brand Intelligence Analysis (Separating Facts vs. Inferences)
 * Stage 2: Canonical Brand Guidelines Synthesis + Derived Creative Directives
 * Stage 3: Deterministic Foundational Document Renderer
 */

import { Type } from "@google/genai";
import { getAI, parseJSON, withRetry } from "./geminiClient.js";
import { MODELS } from "./modelRegistry.js";
import { getSupportedLogoData } from "./promptBuilders.js";
import type {
  BrandGuidelines,
  BrandIntelligenceProfile,
  NormalizedBrandSource,
  UserBrandOverrides,
  CreativeDirectives
} from "@shared-types/brand.js";
import type { Asset } from "@shared-types/creative.js";

export interface BrandIntelligenceOptions {
  model?: string;
  userContext?: {
    logo?: string;
    colors?: string[];
    tone?: string;
    brandName?: string;
    location?: string;
    industry?: string;
  };
}

/**
 * Stage 1: Brand Intelligence Analysis
 * Extracts verifiable facts, infers positioning & audience, identifies signals,
 * and marks confidence levels.
 */
export async function analyzeBrandIntelligence(
  source: NormalizedBrandSource,
  options?: BrandIntelligenceOptions
): Promise<BrandIntelligenceProfile> {
  const ai = getAI();
  const model = options?.model || MODELS.TEXT_FAST;

  // Build structured prompt grounded in the normalized source
  let prompt = `You are an elite Brand Strategy Intelligence Analyst.
Your task is to analyze the provided normalized brand source and produce a structured BRAND INTELLIGENCE PROFILE.

CRITICAL INSTRUCTIONS:
1. EXPLICITLY SEPARATE FACTS FROM INFERENCES:
   - "facts": ONLY include things the source explicitly and verifiably states (e.g. products sold, stated company name, stated locations, explicit claims).
   - "inferences": What you strategically infer from their copy, positioning, visual style, and tone (e.g. audience segment, brand archetype, positioning strategy, differentiation).
2. DO NOT blur facts and inferences. If an attribute is inferred rather than explicitly stated, place it under inferences.
3. CONFIDENCE & UNCERTAINTY:
   - For industry, positioning, audience, and location, assign confidence as "high", "medium", or "low".
   - If key information is missing or ambiguous, add an item to "missingOrUncertain" (e.g., "Target geographic market not explicitly stated").
4. ANTI-GENERIC MANDATE:
   - Avoid empty filler words like "innovative", "modern", "high-quality", "customer-centric" unless grounded in specific source evidence.
   - Focus on practical, concrete brand traits.

NORMALIZED BRAND SOURCE DATA:
- Source Type: ${source.sourceType}
${source.sourceUrl ? `- Source URL: ${source.sourceUrl}` : ''}
${source.title ? `- Website Title: ${source.title}` : ''}
${source.metaDescription ? `- Meta Description: ${source.metaDescription}` : ''}
${source.headings.length > 0 ? `- Page Headings:\n  * ${source.headings.join('\n  * ')}` : ''}
${source.navigationItems.length > 0 ? `- Navigation / Product Links:\n  * ${source.navigationItems.join(', ')}` : ''}
${source.keyParagraphs.length > 0 ? `- Visible Body Text:\n  ${source.keyParagraphs.slice(0, 5).join('\n\n  ')}` : ''}
${source.aboutText ? `- Company / About Information:\n  ${source.aboutText}` : ''}
${source.detectedColors.length > 0 ? `- Detected Site Theme Colors: ${source.detectedColors.join(', ')}` : ''}
${source.detectedTypography?.primary ? `- Detected Font: ${source.detectedTypography.primary}` : ''}
${source.rawDescription ? `- User Provided Description:\n  ${source.rawDescription}` : ''}
`;

  if (options?.userContext?.brandName) {
    prompt += `\nUSER SPECIFIED BRAND NAME: "${options.userContext.brandName}" (Treat as authoritative fact).`;
  }
  if (options?.userContext?.industry) {
    prompt += `\nUSER SPECIFIED INDUSTRY: "${options.userContext.industry}" (Treat as authoritative fact).`;
  }
  if (options?.userContext?.tone) {
    prompt += `\nUSER SPECIFIED DESIRED TONE: "${options.userContext.tone}".`;
  }
  if (options?.userContext?.colors && options.userContext.colors.length > 0) {
    prompt += `\nUSER SPECIFIED COLORS: ${options.userContext.colors.join(', ')}.`;
  }

  const parts: any[] = [{ text: prompt }];

  // If a logo is provided or detected, feed into model for visual palette analysis
  const logoCandidate = options?.userContext?.logo || source.detectedLogoCandidates[0];
  if (logoCandidate) {
    try {
      const supportedLogo = await getSupportedLogoData(logoCandidate);
      if (supportedLogo) {
        parts.push({
          inlineData: {
            mimeType: supportedLogo.mimeType,
            data: supportedLogo.data
          }
        });
        parts[0].text += "\n\nAttached is the brand's logo image. Analyze its geometric structure, primary colors, and visual aesthetic.";
      }
    } catch (e) {
      console.warn("[brandIntelligence] Could not attach logo data to analysis:", e);
    }
  }

  const response = await withRetry(() =>
    ai.models.generateContent({
      model,
      contents: { parts },
      config: {
        systemInstruction:
          "You are an elite Brand Strategy Intelligence Analyst. Ground your analysis strictly in evidence from the provided source. Output ONLY a valid JSON object conforming exactly to the requested schema.",
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            facts: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                industry: { type: Type.STRING },
                products: { type: Type.ARRAY, items: { type: Type.STRING } },
                services: { type: Type.ARRAY, items: { type: Type.STRING } },
                markets: { type: Type.ARRAY, items: { type: Type.STRING } },
                locations: { type: Type.ARRAY, items: { type: Type.STRING } },
                claims: { type: Type.ARRAY, items: { type: Type.STRING } },
                language: { type: Type.STRING }
              },
              required: ["name", "industry"]
            },
            inferences: {
              type: Type.OBJECT,
              properties: {
                positioning: { type: Type.STRING },
                targetAudience: { type: Type.STRING },
                customerSegments: { type: Type.ARRAY, items: { type: Type.STRING } },
                personality: { type: Type.ARRAY, items: { type: Type.STRING } },
                archetype: { type: Type.STRING },
                differentiation: { type: Type.STRING },
                perceivedMaturity: { type: Type.STRING },
                communicationStyle: { type: Type.STRING }
              },
              required: ["positioning", "targetAudience", "personality", "archetype"]
            },
            visualSignals: {
              type: Type.OBJECT,
              properties: {
                colors: { type: Type.ARRAY, items: { type: Type.STRING } },
                typography: {
                  type: Type.OBJECT,
                  properties: {
                    primary: { type: Type.STRING },
                    secondary: { type: Type.STRING }
                  }
                },
                imagery: { type: Type.STRING },
                composition: { type: Type.STRING },
                visualMotifs: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["colors"]
            },
            messagingSignals: {
              type: Type.OBJECT,
              properties: {
                tone: { type: Type.STRING },
                vocabulary: {
                  type: Type.OBJECT,
                  properties: {
                    preferred: { type: Type.ARRAY, items: { type: Type.STRING } },
                    avoid: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
                },
                recurringPhrases: { type: Type.ARRAY, items: { type: Type.STRING } },
                valuePropositions: { type: Type.ARRAY, items: { type: Type.STRING } }
              },
              required: ["tone"]
            },
            confidence: {
              type: Type.OBJECT,
              properties: {
                industry: { type: Type.STRING, enum: ["high", "medium", "low"] },
                positioning: { type: Type.STRING, enum: ["high", "medium", "low"] },
                audience: { type: Type.STRING, enum: ["high", "medium", "low"] },
                location: { type: Type.STRING, enum: ["high", "medium", "low"] }
              }
            },
            evidence: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  statement: { type: Type.STRING },
                  source: { type: Type.STRING },
                  basis: { type: Type.STRING }
                },
                required: ["statement", "source", "basis"]
              }
            },
            missingOrUncertain: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["facts", "inferences", "visualSignals", "messagingSignals"]
        }
      }
    })
  );

  const intelligence: BrandIntelligenceProfile = parseJSON(response.text);
  return intelligence;
}

/**
 * Stage 2: Brand Guidelines Synthesis
 * Synthesizes canonical BrandGuidelines JSON with high-specificity directives,
 * applying user overrides with strict precedence.
 */
export async function synthesizeBrandGuidelines(
  intelligence: BrandIntelligenceProfile,
  overrides: UserBrandOverrides,
  logoDataUrl?: string,
  modelName: string = MODELS.TEXT_FAST
): Promise<BrandGuidelines> {
  const ai = getAI();

  const prompt = `You are an elite Brand Identity Director.
Synthesize the structured Brand Intelligence into canonical, action-oriented BRAND GUIDELINES for Writopedia's creative AI suite.

THE CANONICAL QUESTION:
"HOW SHOULD WRITOPEDIA CREATE FOR THIS BRAND?"
Do not simply summarize what the website says. Dictate concrete creative rules, visual standards, voice parameters, and audience styling.

ANTI-GENERIC MANDATE:
- REJECT generic filler like "innovative", "customer-centric", "modern", "high-quality".
- Tone must be specific: e.g., "Confident and pragmatic. Direct declarative statements with plain-spoken clarity. Avoid hype words."
- Visual style must be specific: e.g., "High-contrast editorial photography with balanced product prominence, warm neutral backgrounds, and restrained rose accents."

PRIORITY OVERRIDES:
Any user override provided below MUST 100% supersede AI inferences:
${overrides.name ? `- Brand Name: "${overrides.name}" (AUTHORITATIVE OVERRIDE)` : ''}
${overrides.industry ? `- Industry: "${overrides.industry}" (AUTHORITATIVE OVERRIDE)` : ''}
${overrides.tone ? `- Tone: "${overrides.tone}" (AUTHORITATIVE OVERRIDE)` : ''}
${overrides.targetAudience ? `- Target Audience: "${overrides.targetAudience}" (AUTHORITATIVE OVERRIDE)` : ''}
${overrides.tagline ? `- Tagline: "${overrides.tagline}" (AUTHORITATIVE OVERRIDE)` : ''}
${overrides.location ? `- Location: "${overrides.location}" (AUTHORITATIVE OVERRIDE)` : ''}
${overrides.colors && overrides.colors.length > 0 ? `- Colors: ${overrides.colors.join(', ')} (AUTHORITATIVE OVERRIDE)` : ''}
${overrides.additionalNotes ? `- Additional Creative Notes: "${overrides.additionalNotes}"` : ''}

BRAND INTELLIGENCE CONTEXT:
- Facts Name: ${intelligence.facts.name || 'Brand'}
- Facts Industry: ${intelligence.facts.industry || 'Modern Business'}
- Facts Products/Services: ${(intelligence.facts.products || []).concat(intelligence.facts.services || []).join(', ')}
- Inferred Positioning: ${intelligence.inferences.positioning || ''}
- Inferred Audience: ${intelligence.inferences.targetAudience || ''}
- Inferred Personality: ${(intelligence.inferences.personality || []).join(', ')}
- Inferred Archetype: ${intelligence.inferences.archetype || ''}
- Visual Palette: ${(intelligence.visualSignals.colors || []).join(', ')}
- Messaging Tone: ${intelligence.messagingSignals.tone || ''}
- Value Propositions: ${(intelligence.messagingSignals.valuePropositions || []).join('; ')}

Return a JSON object conforming to the required schema. Include "creativeDirectives" with compact instructions for:
- visual: Composition, lighting, color usage, human demographic
- copy: Tone, headline rules, vocabulary
- video: Motion pacing, shot style, camera dynamics
- presentation: Slide architecture, typography hierarchy, density`;

  const response = await withRetry(() =>
    ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        systemInstruction:
          "You are an elite Brand Identity Director. Generate actionable, structured brand guidelines JSON. Strictly obey user overrides. Return ONLY valid JSON.",
        maxOutputTokens: 4096,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            industry: { type: Type.STRING },
            tone: { type: Type.STRING },
            pillars: { type: Type.ARRAY, items: { type: Type.STRING } },
            colors: { type: Type.ARRAY, items: { type: Type.STRING } },
            typography: {
              type: Type.OBJECT,
              properties: {
                primary: { type: Type.STRING },
                secondary: { type: Type.STRING }
              },
              required: ["primary", "secondary"]
            },
            logoDescription: { type: Type.STRING },
            tagline: { type: Type.STRING },
            location: { type: Type.STRING },
            voiceAccentStyle: { type: Type.STRING },
            visualEthnicityStyle: { type: Type.STRING },
            mission: { type: Type.STRING },
            creativeDirectives: {
              type: Type.OBJECT,
              properties: {
                visual: { type: Type.STRING },
                copy: { type: Type.STRING },
                video: { type: Type.STRING },
                presentation: { type: Type.STRING }
              },
              required: ["visual", "copy", "video", "presentation"]
            }
          },
          required: [
            "name",
            "industry",
            "tone",
            "pillars",
            "colors",
            "typography",
            "location",
            "creativeDirectives"
          ]
        }
      }
    })
  );

  const raw = parseJSON(response.text);

  // Quality Control Pass & Deterministic Sanitization
  const cleanName = overrides.name?.trim() || raw.name?.trim() || intelligence.facts.name || "Brand";
  const cleanIndustry = overrides.industry?.trim() || raw.industry?.trim() || intelligence.facts.industry || "General Industry";
  const cleanTone = overrides.tone?.trim() || raw.tone?.trim() || "Professional & Direct";

  // Validate hex colors
  let cleanColors: string[] = [];
  if (overrides.colors && overrides.colors.length > 0) {
    cleanColors = overrides.colors.filter(c => /^#[0-9a-f]{3,6}$/i.test(c.trim()));
  }
  if (cleanColors.length === 0 && Array.isArray(raw.colors)) {
    cleanColors = raw.colors.filter((c: any) => typeof c === 'string' && /^#[0-9a-f]{3,6}$/i.test(c.trim()));
  }
  if (cleanColors.length === 0 && intelligence.visualSignals.colors) {
    cleanColors = intelligence.visualSignals.colors.filter(c => /^#[0-9a-f]{3,6}$/i.test(c.trim()));
  }
  if (cleanColors.length === 0) {
    cleanColors = ["#0F172A", "#E11D48"]; // Safe default
  }

  // Ensure typography fallback
  const typography = {
    primary: raw.typography?.primary?.trim() || intelligence.visualSignals.typography?.primary || "Outfit",
    secondary: raw.typography?.secondary?.trim() || intelligence.visualSignals.typography?.secondary || "Inter"
  };

  // Ensure pillars have 3-4 actionable items
  let pillars: string[] = Array.isArray(raw.pillars) ? raw.pillars.filter((p: any) => typeof p === 'string' && p.trim()) : [];
  if (pillars.length === 0) {
    pillars = ["Reliability", "Purposeful Craft", "Impact"];
  }

  const finalGuidelines: BrandGuidelines = {
    name: cleanName,
    industry: cleanIndustry,
    tone: cleanTone,
    pillars,
    colors: cleanColors.slice(0, 4),
    typography,
    logo: logoDataUrl || overrides.logo || undefined,
    logoDescription: raw.logoDescription || "A balanced, modern geometric brand mark.",
    tagline: overrides.tagline?.trim() || raw.tagline?.trim() || undefined,
    location: overrides.location?.trim() || raw.location?.trim() || "India",
    voiceAccentStyle: overrides.voiceAccentStyle?.trim() || raw.voiceAccentStyle?.trim() || "Indian English",
    visualEthnicityStyle: overrides.visualEthnicityStyle?.trim() || raw.visualEthnicityStyle?.trim() || "Indian",
    mission: raw.mission || `Empower customers through authentic ${cleanIndustry} solutions.`,
    updatedAt: Date.now(),
    intelligence,
    creativeDirectives: raw.creativeDirectives as CreativeDirectives
  };

  return finalGuidelines;
}

/**
 * Stage 3: Deterministic Foundational Document Renderer
 * Generates Brand Manifesto.md and Market Context & Strategy.md strictly from canonical BrandGuidelines.
 */
export async function generateFoundationalDocuments(
  guidelines: BrandGuidelines,
  modelName: string = MODELS.TEXT_FAST
): Promise<Asset[]> {
  const ai = getAI();

  const prompt = `Based on the final canonical Brand Guidelines below, generate 2 foundational brand documents:
1. "Brand Manifesto" - Captures the soul, purpose, worldview, and unyielding principles of ${guidelines.name}.
2. "Market Context & Strategy" - Outlines the strategic positioning, competitive framing, customer demographics, and creative direction in the ${guidelines.industry} sector.

STRICT RULES:
- Both documents MUST strictly adhere to the guidelines:
  * Brand: "${guidelines.name}"
  * Industry: "${guidelines.industry}"
  * Tone: "${guidelines.tone}"
  * Core Pillars: "${guidelines.pillars.join(', ')}"
  * Location / Market Base: "${guidelines.location || 'India'}"
  * Directives: Visual (${guidelines.creativeDirectives?.visual || 'Clean focus'}), Copy (${guidelines.creativeDirectives?.copy || 'Direct'})
- FORMATTING: Use clear, beautiful Markdown hierarchy (# Title, ## Section, ### Subsection, bullet points, blockquotes).
- Do NOT hallucinate incompatible industries or products.

Return a JSON array of 2 objects:
[
  { "name": "Brand Manifesto", "content": "Full markdown..." },
  { "name": "Market Context & Strategy", "content": "Full markdown..." }
]`;

  try {
    const response = await withRetry(() =>
      ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                content: { type: Type.STRING }
              },
              required: ["name", "content"]
            }
          }
        }
      })
    );

    const docItems = parseJSON(response.text);
    return docItems.map((doc: { name: string; content: string }) => ({
      id: `doc-${Math.random().toString(36).substring(7)}`,
      name: `${doc.name}.md`,
      data: doc.content,
      type: 'doc' as const,
      selected: false
    }));
  } catch (err) {
    console.error("[brandIntelligence] Failed to generate foundational documents via AI, falling back to deterministic template:", err);

    // Fallback deterministic generator to never block user progress
    const manifestoMd = `# ${guidelines.name} Brand Manifesto

> "${guidelines.tagline || guidelines.mission || 'Crafting the future with conviction.'}"

## The Core Soul
At **${guidelines.name}**, our commitment is grounded in the reality of the **${guidelines.industry}** industry. We reject superficial posturing in favor of substantive excellence and unmistakable creative clarity.

## Guiding Principles
${guidelines.pillars.map(p => `### ${p}\nWe operationalize ${p.toLowerCase()} not merely as a sentiment, but as an active standard across all client deliverables, messaging, and visual assets.\n`).join('\n')}

## Voice & Tone
- **Operational Tone**: ${guidelines.tone}
- **Primary Audience Alignment**: Grounded in ${guidelines.location || 'global'} markets.
`;

    const strategyMd = `# ${guidelines.name} Market Context & Strategy

## Executive Summary
This document establishes the strategic context for **${guidelines.name}** within the **${guidelines.industry}** space.

## Positioning & Market Framing
- **Brand Identity**: ${guidelines.name}
- **Sector Focus**: ${guidelines.industry}
- **Tone & Persona**: ${guidelines.tone}
- **Key Brand Pillars**: ${guidelines.pillars.join(' · ')}

## Creative Directives
- **Visual Direction**: ${guidelines.creativeDirectives?.visual || 'Clean editorial compositions with strong product focus.'}
- **Copywriting Standard**: ${guidelines.creativeDirectives?.copy || 'Declarative, benefit-led messaging.'}
- **Video Standard**: ${guidelines.creativeDirectives?.video || 'Measured, cinematic pacing.'}
`;

    return [
      {
        id: `doc-${Date.now()}-1`,
        name: "Brand Manifesto.md",
        data: manifestoMd,
        type: 'doc' as const,
        selected: false
      },
      {
        id: `doc-${Date.now()}-2`,
        name: "Market Context & Strategy.md",
        data: strategyMd,
        type: 'doc' as const,
        selected: false
      }
    ];
  }
}
