import * as cheerio from 'cheerio';
import { ApiError } from '../utils/ApiError.js';
import { logger } from '../utils/logger.js';

const FETCH_TIMEOUT_MS = 10000;
const MAX_CONTENT_LENGTH = 5000;

/**
 * Validates a web URL format.
 *
 * @param {string} urlString
 * @returns {boolean}
 */
export function isValidUrl(urlString) {
  try {
    const parsed = new URL(urlString);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Fetches and parses a web page, extracting clean title, meta description, and article body.
 *
 * @param {string} url - Web URL to scrape
 * @returns {Promise<{ url: string, title: string, description: string, content: string }>}
 */
export async function extractLinkContent(url) {
  if (!isValidUrl(url)) {
    throw new ApiError(400, 'INVALID_URL', 'Please provide a valid http or https URL');
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response;
  try {
    response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 NexAI/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new ApiError(
        408,
        'LINK_FETCH_TIMEOUT',
        'Request to fetch webpage timed out after 10 seconds',
      );
    }
    logger.warn({ error: err.message, url }, 'Failed to fetch webpage');
    throw new ApiError(
      400,
      'LINK_FETCH_FAILED',
      `Unable to reach URL: ${err.message || 'Network error'}`,
    );
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) {
    throw new ApiError(
      400,
      'LINK_FETCH_FAILED',
      `Webpage returned HTTP status ${response.status} (${response.statusText})`,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('text/html') && !contentType.includes('application/xhtml+xml')) {
    throw new ApiError(
      400,
      'UNSUPPORTED_CONTENT_TYPE',
      `URL returned ${contentType}. Only HTML pages can be summarized.`,
    );
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  // Remove non-content elements
  $(
    'script, style, noscript, nav, footer, header, aside, svg, iframe, form, button, dialog, menu, [aria-hidden="true"]',
  ).remove();

  // Extract title with fallbacks
  const ogTitle = $('meta[property="og:title"]').attr('content');
  const twitterTitle = $('meta[name="twitter:title"]').attr('content');
  const docTitle = $('title').text().trim();
  const h1Title = $('h1').first().text().trim();
  const title = (ogTitle || twitterTitle || docTitle || h1Title || url)
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);

  // Extract description
  const ogDesc = $('meta[property="og:description"]').attr('content');
  const metaDesc = $('meta[name="description"]').attr('content');
  const description = (ogDesc || metaDesc || '').replace(/\s+/g, ' ').trim().slice(0, 300);

  // Extract readable body text
  let bodyText = '';
  const article = $('article, main, .content, #content, [role="main"]').first();
  if (article.length > 0) {
    bodyText = article.text();
  } else {
    bodyText = $('body').text();
  }

  // Normalize whitespace
  const cleanedContent = bodyText
    .replace(/\r\n|\r/g, '\n')
    .replace(/\t/g, ' ')
    .replace(/[ \u00a0]+/g, ' ')
    .replace(/\n\s*\n/g, '\n\n')
    .trim()
    .slice(0, MAX_CONTENT_LENGTH);

  return {
    url,
    title: title || 'Untitled Page',
    description,
    content: cleanedContent || description || title,
  };
}
