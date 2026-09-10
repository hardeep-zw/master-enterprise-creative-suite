/**
 * Source Extraction & Normalization Layer for Writopedia Brand Intelligence.
 * Extracts DOM signals, public company content, and 5-tier logo candidates
 * safely via internal SSRF-protected /api/proxy.
 */

import type { NormalizedBrandSource } from '@shared-types/brand.js';

export function normalizeTargetUrl(rawUrl: string): string {
  let target = rawUrl.trim();
  if (!target.startsWith('http://') && !target.startsWith('https://')) {
    target = `https://${target.replace(/^www\./, '')}`;
  }
  return target;
}

export function extractDomainName(rawUrlOrDomain: string): string | null {
  const match = rawUrlOrDomain.match(
    /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9][-a-zA-Z0-9]*(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,})/i
  );
  return match ? match[1].toLowerCase().replace(/\/.*$/, '').trim() : null;
}

export async function fetchWithTimeout(url: string, timeoutMs: number = 8000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Converts a remote image URL to a base64 Data URL via internal proxy.
 */
export async function convertImageUrlToDataUrl(imageUrl: string, timeoutMs: number = 6000): Promise<string | null> {
  try {
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(imageUrl)}`;
    const res = await fetchWithTimeout(proxyUrl, timeoutMs);
    if (!res.ok) return null;

    const contentType = res.headers.get('content-type') || '';
    if (!contentType.startsWith('image/')) return null;

    const blob = await res.blob();
    if (blob.size < 100) return null;

    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn(`[sourceNormalizer] Image conversion failed for ${imageUrl}:`, err);
    return null;
  }
}

/**
 * 5-Tier Logo Candidate Crawler
 * 1. Apple Touch Icon (high-res PNG)
 * 2. SVG / High-res Vector Icon
 * 3. OpenGraph / Twitter Image
 * 4. In-page Header / Nav Brand Logo Image
 * 5. Standard Favicon
 */
export async function crawlLogoCandidates(doc: Document, baseUrl: string): Promise<string[]> {
  const candidates: string[] = [];

  try {
    // 1. Apple Touch Icon
    const appleTouch =
      doc.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') ||
      doc.querySelector('link[rel="apple-touch-icon-precomposed"]')?.getAttribute('href');
    if (appleTouch) candidates.push(appleTouch);

    // 2. SVG / High-res Vector Icon
    const svgIcon = doc.querySelector('link[rel="icon"][type="image/svg+xml"]')?.getAttribute('href');
    if (svgIcon) candidates.push(svgIcon);

    const highResIcon =
      doc.querySelector('link[rel="icon"][sizes="512x512"]')?.getAttribute('href') ||
      doc.querySelector('link[rel="icon"][sizes="192x192"]')?.getAttribute('href') ||
      doc.querySelector('link[rel="icon"][sizes="128x128"]')?.getAttribute('href');
    if (highResIcon) candidates.push(highResIcon);

    // 3. OpenGraph / Twitter Image
    const ogImage =
      doc.querySelector('meta[property="og:image"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="og:image"]')?.getAttribute('content') ||
      doc.querySelector('meta[name="twitter:image"]')?.getAttribute('content');
    if (ogImage) candidates.push(ogImage);

    // 4. In-page Header / Nav Brand Logo Image
    const logoImgs = Array.from(
      doc.querySelectorAll<HTMLImageElement>(
        'header img[class*="logo" i], header img[alt*="logo" i], nav img[class*="logo" i], img[class*="logo" i], img[id*="logo" i], header img'
      )
    );
    for (const img of logoImgs) {
      const src = img.getAttribute('src');
      if (src && !candidates.includes(src)) {
        candidates.push(src);
      }
    }

    // 5. Standard Favicon
    const standardIcon =
      doc.querySelector('link[rel="icon"]')?.getAttribute('href') ||
      doc.querySelector('link[rel="shortcut icon"]')?.getAttribute('href');
    if (standardIcon) candidates.push(standardIcon);

    // Resolve candidates to absolute URLs
    const resolvedUrls: string[] = [];
    for (const c of candidates) {
      try {
        const abs = new URL(c, baseUrl).href;
        if (!resolvedUrls.includes(abs)) {
          resolvedUrls.push(abs);
        }
      } catch {
        // Skip malformed relative URLs
      }
    }

    // Validate candidates concurrently and convert to data URLs
    const validatedDataUrls: string[] = [];
    for (const u of resolvedUrls.slice(0, 6)) {
      const dataUrl = await convertImageUrlToDataUrl(u, 5000);
      if (dataUrl && !validatedDataUrls.includes(dataUrl)) {
        validatedDataUrls.push(dataUrl);
        if (validatedDataUrls.length >= 4) break; // Keep top 4 distinct candidates
      }
    }

    return validatedDataUrls;
  } catch (err) {
    console.warn('[sourceNormalizer] Error crawling logo candidates:', err);
    return [];
  }
}

/**
 * Extracts visible, clean text signals from DOM without HTML noise or boilerplate.
 */
export function extractTextSignals(doc: Document) {
  // Title
  const title =
    doc.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
    doc.querySelector('title')?.textContent?.trim() ||
    '';

  // Meta Description
  const metaDescription =
    doc.querySelector('meta[name="description"]')?.getAttribute('content') ||
    doc.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
    '';

  // Headings
  const headings: string[] = [];
  const headingEls = Array.from(doc.querySelectorAll('h1, h2, h3'));
  for (const h of headingEls) {
    const text = h.textContent?.replace(/\s+/g, ' ').trim();
    if (text && text.length > 3 && text.length < 120 && !headings.includes(text)) {
      headings.push(text);
      if (headings.length >= 12) break;
    }
  }

  // Key paragraphs (filter out cookie banners, privacy disclaimers, copyrights)
  const keyParagraphs: string[] = [];
  const paragraphEls = Array.from(doc.querySelectorAll('main p, article p, section p, p'));
  const ignorePatterns = /cookie|privacy policy|terms of service|all rights reserved|copyright|subscribe to our newsletter|accept all/i;

  let totalChars = 0;
  for (const p of paragraphEls) {
    const text = p.textContent?.replace(/\s+/g, ' ').trim();
    if (text && text.length >= 30 && text.length <= 400 && !ignorePatterns.test(text)) {
      if (!keyParagraphs.includes(text)) {
        keyParagraphs.push(text);
        totalChars += text.length;
        if (keyParagraphs.length >= 8 || totalChars > 2200) break;
      }
    }
  }

  // Navigation Items (signals regarding products/solutions/features)
  const navigationItems: string[] = [];
  const navEls = Array.from(doc.querySelectorAll('header nav a, nav a, header a'));
  for (const a of navEls) {
    const text = a.textContent?.replace(/\s+/g, ' ').trim();
    if (text && text.length >= 3 && text.length <= 30 && !navigationItems.includes(text)) {
      if (!/home|sign in|login|log in|register|sign up|cart/i.test(text)) {
        navigationItems.push(text);
        if (navigationItems.length >= 10) break;
      }
    }
  }

  // Social Links
  const socialLinks: string[] = [];
  const anchorEls = Array.from(doc.querySelectorAll('a[href]'));
  for (const a of anchorEls) {
    const href = a.getAttribute('href') || '';
    if (/twitter\.com|x\.com|linkedin\.com|instagram\.com|youtube\.com|facebook\.com/i.test(href)) {
      if (!socialLinks.includes(href)) {
        socialLinks.push(href);
        if (socialLinks.length >= 5) break;
      }
    }
  }

  // Detected Colors (from theme-color meta or inline style hints)
  const detectedColors: string[] = [];
  const themeColor = doc.querySelector('meta[name="theme-color"]')?.getAttribute('content');
  if (themeColor && /^#[0-9a-f]{3,6}$/i.test(themeColor.trim())) {
    detectedColors.push(themeColor.trim().toUpperCase());
  }

  // Detected Typography (from Google Fonts or font-family links)
  let detectedTypography: { primary?: string; secondary?: string } | undefined;
  const fontLinks = Array.from(doc.querySelectorAll('link[href*="fonts.googleapis.com"]'));
  for (const fl of fontLinks) {
    const href = fl.getAttribute('href') || '';
    const familyMatch = href.match(/family=([a-zA-Z+]+)/);
    if (familyMatch && familyMatch[1]) {
      const fontName = familyMatch[1].replace(/\+/g, ' ');
      if (!detectedTypography) {
        detectedTypography = { primary: fontName };
      } else if (!detectedTypography.secondary && detectedTypography.primary !== fontName) {
        detectedTypography.secondary = fontName;
      }
    }
  }

  return {
    title,
    metaDescription,
    headings,
    keyParagraphs,
    navigationItems,
    socialLinks,
    detectedColors,
    detectedTypography
  };
}

/**
 * Attempts a lightweight fetch of an linked /about or /company page to collect richer background facts.
 */
export async function tryFetchAboutPage(doc: Document, baseUrl: string): Promise<string | undefined> {
  try {
    const aboutAnchor = doc.querySelector<HTMLAnchorElement>(
      'a[href*="/about" i], a[href*="about-us" i], a[href*="/company" i]'
    );
    if (!aboutAnchor) return undefined;

    const rawHref = aboutAnchor.getAttribute('href');
    if (!rawHref) return undefined;

    const absAboutUrl = new URL(rawHref, baseUrl).href;
    const proxyUrl = `/api/proxy?url=${encodeURIComponent(absAboutUrl)}`;
    const res = await fetchWithTimeout(proxyUrl, 3500);
    if (!res.ok) return undefined;

    const html = await res.text();
    if (!html || html.length < 100) return undefined;

    const parser = new DOMParser();
    const aboutDoc = parser.parseFromString(html, 'text/html');

    const paragraphs = Array.from(aboutDoc.querySelectorAll('main p, article p, section p, p'));
    const aboutSnippets: string[] = [];
    for (const p of paragraphs) {
      const text = p.textContent?.replace(/\s+/g, ' ').trim();
      if (text && text.length > 40 && text.length < 350) {
        aboutSnippets.push(text);
        if (aboutSnippets.length >= 3) break;
      }
    }

    return aboutSnippets.length > 0 ? aboutSnippets.join('\n\n') : undefined;
  } catch {
    // Non-critical background enrichment; fail silently
    return undefined;
  }
}

export interface ExtractSourceOptions {
  url?: string;
  description?: string;
  userLogo?: string;
}

/**
 * Master extraction & normalization function.
 */
export async function extractAndNormalizeSource(
  options: ExtractSourceOptions
): Promise<NormalizedBrandSource> {
  const { url, description, userLogo } = options;

  // Case 1: URL provided
  if (url && url.trim().length > 0) {
    const targetUrl = normalizeTargetUrl(url);

    const proxyUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    const response = await fetchWithTimeout(proxyUrl, 9000);

    if (!response.ok) {
      throw new Error(
        `Failed to reach website (${response.status} ${response.statusText}). You can retry or continue with a brand description.`
      );
    }

    const html = await response.text();
    if (!html || html.length < 50) {
      throw new Error("Target website returned an empty response. Please verify the URL or enter a description.");
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Run DOM extraction and logo crawling concurrently
    const [signals, crawledLogos, aboutText] = await Promise.all([
      Promise.resolve(extractTextSignals(doc)),
      crawlLogoCandidates(doc, targetUrl),
      tryFetchAboutPage(doc, targetUrl)
    ]);

    // Ensure user logo takes precedence if provided
    const detectedLogoCandidates = [...crawledLogos];
    if (userLogo && !detectedLogoCandidates.includes(userLogo)) {
      detectedLogoCandidates.unshift(userLogo);
    }

    return {
      sourceType: 'url',
      sourceUrl: targetUrl,
      title: signals.title,
      metaDescription: signals.metaDescription,
      headings: signals.headings,
      keyParagraphs: signals.keyParagraphs,
      navigationItems: signals.navigationItems,
      socialLinks: signals.socialLinks,
      detectedLogoCandidates,
      detectedColors: signals.detectedColors,
      detectedTypography: signals.detectedTypography,
      rawDescription: description?.trim() || undefined,
      aboutText
    };
  }

  // Case 2: Description provided
  if (description && description.trim().length > 0) {
    return {
      sourceType: 'description',
      headings: [],
      keyParagraphs: [description.trim()],
      navigationItems: [],
      socialLinks: [],
      detectedLogoCandidates: userLogo ? [userLogo] : [],
      detectedColors: [],
      rawDescription: description.trim()
    };
  }

  throw new Error("Please provide either a brand website URL or a brand description.");
}
