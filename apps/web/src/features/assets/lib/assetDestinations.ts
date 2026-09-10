import type { Asset, Gem } from '@shared-types/creative.js';
import { GENERIC_GEMS } from '@web/infrastructure/ai/modelRegistry.js';

export interface ReferenceRole {
  id: string;
  name: string;
  description: string;
  targetField: 'productContext' | 'faceContext' | 'ingredientsContexts' | 'videoReferences' | 'firstFrameContext' | 'lastFrameContext' | 'selectedAssets';
  maxLimit?: number;
  badge?: string;
}

export type DestinationCategory = 'Image' | 'Video' | 'Campaign' | 'Text' | 'Presentation' | 'Audio' | 'Storyline';

export interface AssetDestination {
  gemId: string;
  gemName: string;
  gemType: string;
  category: DestinationCategory;
  description: string;
  iconKey?: string;
  roles: ReferenceRole[];
  isRecommended?: boolean;
}

/**
 * Deterministic capability resolver that maps an asset to all valid, compatible
 * creative Gem destinations and their specific supported input slots.
 *
 * NO LLMs or runtime heuristics are used.
 */
export function getAssetReferenceDestinations(
  asset: Asset,
  availableGems: Gem[] = GENERIC_GEMS
): AssetDestination[] {
  const destinations: AssetDestination[] = [];
  const gemMap = new Map(availableGems.map((g) => [g.id, g]));

  if (asset.type === 'image') {
    // 1. Standard Brand Image
    const standardImage = gemMap.get('standard-image');
    if (standardImage) {
      destinations.push({
        gemId: standardImage.id,
        gemName: standardImage.name,
        gemType: standardImage.type,
        category: 'Image',
        description: 'Attach as product, model, or ingredient reference for branded imagery.',
        iconKey: standardImage.iconKey,
        isRecommended: true,
        roles: [
          {
            id: 'product',
            name: 'Product Context Image',
            description: 'Direct product photo anchor for branded commercial generation.',
            targetField: 'productContext',
            badge: 'Direct Anchor'
          },
          {
            id: 'face',
            name: 'Face / Model Reference',
            description: 'Character or demographic face consistency reference.',
            targetField: 'faceContext',
            badge: 'Character'
          },
          {
            id: 'ingredient',
            name: 'Ingredient Reference',
            description: 'Prompt-guided ingredient element (up to 3 elements).',
            targetField: 'ingredientsContexts',
            maxLimit: 3,
            badge: 'Elements'
          }
        ]
      });
    }

    // 2. Cinematic & Social Video
    const cinematicVideo = gemMap.get('cinematic-video');
    if (cinematicVideo) {
      destinations.push({
        gemId: cinematicVideo.id,
        gemName: cinematicVideo.name,
        gemType: cinematicVideo.type,
        category: 'Video',
        description: 'Condition video generation with subject references or keyframe photos.',
        iconKey: cinematicVideo.iconKey,
        isRecommended: true,
        roles: [
          {
            id: 'general_ref',
            name: 'Subject Consistency Reference',
            description: 'Multimodal conditioning reference for visual subject guidance (up to 3).',
            targetField: 'videoReferences',
            maxLimit: 3,
            badge: 'Conditioning'
          },
          {
            id: 'first_frame',
            name: 'Start Keyframe Image',
            description: 'Source image to animate with Veo Fast or Kling starting frame.',
            targetField: 'firstFrameContext',
            badge: 'Animation'
          },
          {
            id: 'last_frame',
            name: 'End Keyframe Image',
            description: 'Ending keyframe photo for smooth motion interpolation.',
            targetField: 'lastFrameContext',
            badge: 'Interpolation'
          }
        ]
      });
    }

    // 3. Ecommerce Bundle
    const ecommerceBundle = gemMap.get('bundles-campaigns');
    if (ecommerceBundle) {
      destinations.push({
        gemId: ecommerceBundle.id,
        gemName: ecommerceBundle.name,
        gemType: ecommerceBundle.type,
        category: 'Campaign',
        description: 'Supply product photo or demographic model for cohesive 5-asset marketing.',
        iconKey: ecommerceBundle.iconKey,
        isRecommended: true,
        roles: [
          {
            id: 'product_shot',
            name: 'Product Shot Reference',
            description: 'Primary product photo for multi-asset campaign generation.',
            targetField: 'productContext',
            badge: 'Hero Shot'
          },
          {
            id: 'character_face',
            name: 'Character / Face Model',
            description: 'Model or demographic reference for lifestyle campaign imagery.',
            targetField: 'faceContext',
            badge: 'Demographic'
          }
        ]
      });
    }

    // 4. Captions (Text)
    const captions = gemMap.get('strategy-captions');
    if (captions) {
      destinations.push({
        gemId: captions.id,
        gemName: captions.name,
        gemType: captions.type,
        category: 'Text',
        description: 'Generate platform-ready social caption packs conditioned on this image.',
        iconKey: captions.iconKey,
        roles: [
          {
            id: 'visual_context',
            name: 'Visual Context for Captions',
            description: 'Direct visual context for multi-platform copywriting and hooks.',
            targetField: 'selectedAssets',
            badge: 'Multimodal'
          }
        ]
      });
    }

    // 5. Corporate Presentations
    const presentations = gemMap.get('corporate-presentations');
    if (presentations) {
      destinations.push({
        gemId: presentations.id,
        gemName: presentations.name,
        gemType: presentations.type,
        category: 'Presentation',
        description: 'Visual theme and product context for executive slide deck creation.',
        iconKey: presentations.iconKey,
        roles: [
          {
            id: 'product_theme',
            name: 'Slide Theme & Product Reference',
            description: 'Context photo incorporated into presentation slides.',
            targetField: 'productContext',
            badge: 'Theme'
          }
        ]
      });
    }

    // 6. Storyline Generator
    const storyline = gemMap.get('brand-narrative-storyline');
    if (storyline) {
      destinations.push({
        gemId: storyline.id,
        gemName: storyline.name,
        gemType: storyline.type,
        category: 'Storyline',
        description: 'Visual anchor for multi-scene episodic brand narrative generation.',
        iconKey: storyline.iconKey,
        roles: [
          {
            id: 'story_ref',
            name: 'Narrative Reference Image',
            description: 'Anchor product and style across sequential story scenes.',
            targetField: 'productContext',
            badge: 'Narrative'
          }
        ]
      });
    }
  } else if (asset.type === 'video') {
    // Video as guide for video generation
    const cinematicVideo = gemMap.get('cinematic-video');
    if (cinematicVideo) {
      destinations.push({
        gemId: cinematicVideo.id,
        gemName: cinematicVideo.name,
        gemType: cinematicVideo.type,
        category: 'Video',
        description: 'Use as motion guide or camera timing track for video generation.',
        iconKey: cinematicVideo.iconKey,
        isRecommended: true,
        roles: [
          {
            id: 'video_guide',
            name: 'Motion / Video Guide',
            description: 'Guide motion, camera trajectory, and pacing (up to 3 guides).',
            targetField: 'videoReferences',
            maxLimit: 3,
            badge: 'Motion'
          }
        ]
      });
    }

    // Video as context for captions
    const captions = gemMap.get('strategy-captions');
    if (captions) {
      destinations.push({
        gemId: captions.id,
        gemName: captions.name,
        gemType: captions.type,
        category: 'Text',
        description: 'Analyze video content to generate platform captions and hooks.',
        iconKey: captions.iconKey,
        roles: [
          {
            id: 'visual_context',
            name: 'Video Context for Captions',
            description: 'Visual reference for high-converting social copy packs.',
            targetField: 'selectedAssets',
            badge: 'Multimodal'
          }
        ]
      });
    }
  } else if (asset.type === 'audio') {
    // Audio as timing track for video
    const cinematicVideo = gemMap.get('cinematic-video');
    if (cinematicVideo) {
      destinations.push({
        gemId: cinematicVideo.id,
        gemName: cinematicVideo.name,
        gemType: cinematicVideo.type,
        category: 'Video',
        description: 'Attach audio as a pacing and timing track for video clips.',
        iconKey: cinematicVideo.iconKey,
        isRecommended: true,
        roles: [
          {
            id: 'audio_track',
            name: 'Audio Timing Track',
            description: 'Synchronize video scene duration and pacing with this audio track.',
            targetField: 'videoReferences',
            maxLimit: 3,
            badge: 'Audio Sync'
          }
        ]
      });
    }
  } else if (asset.type === 'doc') {
    // Document for captions
    const captions = gemMap.get('strategy-captions');
    if (captions) {
      destinations.push({
        gemId: captions.id,
        gemName: captions.name,
        gemType: captions.type,
        category: 'Text',
        description: 'Generate captions based on document text or brief.',
        iconKey: captions.iconKey,
        isRecommended: true,
        roles: [
          {
            id: 'text_context',
            name: 'Document Context for Captions',
            description: 'Extract hooks, messaging, and copy from this document.',
            targetField: 'selectedAssets',
            badge: 'Brief'
          }
        ]
      });
    }

    // Document for Campaign Strategy
    const campaignStrategist = gemMap.get('campaign-strategist-y');
    if (campaignStrategist) {
      destinations.push({
        gemId: campaignStrategist.id,
        gemName: campaignStrategist.name,
        gemType: campaignStrategist.type,
        category: 'Campaign',
        description: 'Feed document into conversational brand strategy workshop.',
        iconKey: campaignStrategist.iconKey,
        isRecommended: true,
        roles: [
          {
            id: 'campaign_brief',
            name: 'Strategic Campaign Brief',
            description: 'Comprehensive context document for campaign discovery and pillars.',
            targetField: 'selectedAssets',
            badge: 'Discovery'
          }
        ]
      });
    }

    // Document as Voiceover Script
    const audioStudio = gemMap.get('audio-studio');
    if (audioStudio) {
      destinations.push({
        gemId: audioStudio.id,
        gemName: audioStudio.name,
        gemType: audioStudio.type,
        category: 'Audio',
        description: 'Use document text as the script source for professional voiceover.',
        iconKey: audioStudio.iconKey,
        roles: [
          {
            id: 'script_source',
            name: 'Voiceover Script Source',
            description: 'Pass document content to voice synthesizer as script input.',
            targetField: 'selectedAssets',
            badge: 'Script'
          }
        ]
      });
    }
  }

  return destinations;
}

export function groupDestinationsByCategory(
  destinations: AssetDestination[]
): { category: DestinationCategory; items: AssetDestination[] }[] {
  const categoryOrder: DestinationCategory[] = ['Image', 'Video', 'Campaign', 'Text', 'Presentation', 'Audio', 'Storyline'];
  const groups: Record<DestinationCategory, AssetDestination[]> = {
    Image: [],
    Video: [],
    Campaign: [],
    Text: [],
    Presentation: [],
    Audio: [],
    Storyline: []
  };

  for (const d of destinations) {
    if (groups[d.category]) {
      groups[d.category].push(d);
    }
  }

  return categoryOrder
    .filter(cat => groups[cat].length > 0)
    .map(cat => ({
      category: cat,
      items: groups[cat]
    }));
}
