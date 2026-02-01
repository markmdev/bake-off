/**
 * Firecrawl client for RFP scraping
 *
 * Singleton pattern matching lib/stripe/index.ts
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import crypto from 'crypto';
import type { RfpData } from '@/types/rfp';

let firecrawlInstance: FirecrawlApp | null = null;

function getFirecrawl(): FirecrawlApp {
  if (!firecrawlInstance) {
    const key = process.env.FIRECRAWL_API_KEY;
    if (!key) {
      throw new Error('FIRECRAWL_API_KEY environment variable is not defined');
    }
    firecrawlInstance = new FirecrawlApp({ apiKey: key });
  }
  return firecrawlInstance;
}

// Default RFP source
const DEFAULT_RFP_SOURCE = 'https://findrfp.com';

// ExtractedRfp type used internally by extractFromMarkdown
interface ExtractedRfp {
  title: string;
  agency: string;
  deadline?: string;
  estimatedValue?: number;
  category?: string;
  description: string;
}

/**
 * Generate a unique ID for an RFP based on its source URL
 */
function generateRfpId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

/**
 * Map RFP source to discover listing URLs
 * Applies limit after receiving links (Firecrawl map doesn't have limit param)
 */
export async function mapRfpSource(limit: number = 20): Promise<string[]> {
  const firecrawl = getFirecrawl();

  const mapResult = await firecrawl.map(DEFAULT_RFP_SOURCE, {
    search: 'rfp bid contract proposal request',
  });

  // mapResult.links is an array of SearchResultWeb objects with url property
  const links = (mapResult.links || []).map(link => link.url);
  return links.slice(0, limit);
}

/**
 * Scrape a single RFP page and extract structured data
 */
export async function scrapeRfpPage(url: string): Promise<RfpData | null> {
  const firecrawl = getFirecrawl();

  try {
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
    });

    // Use the markdown content and try to parse it
    const markdown = result.markdown || '';

    // Extract structured data from the markdown
    // For now, we'll do basic extraction - in production, use LLM extraction
    const extracted = extractFromMarkdown(markdown, url);

    if (!extracted) return null;

    return {
      id: generateRfpId(url),
      sourceUrl: url,
      title: extracted.title,
      agency: extracted.agency,
      deadline: extracted.deadline || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      estimatedValue: extracted.estimatedValue ? Math.round(extracted.estimatedValue * 100) : null,
      category: extracted.category || 'general',
      description: extracted.description,
    };
  } catch (error) {
    console.error(`Failed to scrape ${url}:`, error);
    return null;
  }
}

/**
 * Basic extraction from markdown content
 * In production, this would use Firecrawl's LLM extraction or a separate LLM call
 */
function extractFromMarkdown(markdown: string, url: string): ExtractedRfp | null {
  if (!markdown || markdown.length < 100) return null;

  // Extract title from first heading or first line
  const titleMatch = markdown.match(/^#\s+(.+)$/m) || markdown.match(/^(.+)$/m);
  const title = titleMatch?.[1]?.trim().slice(0, 200) || 'Untitled RFP';

  // Look for agency/organization patterns
  const agencyPatterns = [
    /(?:agency|organization|company|client|issued by)[:\s]+([^\n]+)/i,
    /(?:city of|state of|county of|department of)\s+([^\n,]+)/i,
  ];
  let agency = 'Unknown Agency';
  for (const pattern of agencyPatterns) {
    const match = markdown.match(pattern);
    if (match) {
      agency = match[1].trim().slice(0, 100);
      break;
    }
  }

  // Look for deadline patterns
  const deadlinePatterns = [
    /(?:deadline|due date|due by|submission date|closes?)[:\s]+([^\n]+)/i,
    /(?:submit by|response due)[:\s]+([^\n]+)/i,
  ];
  let deadline: string | undefined;
  for (const pattern of deadlinePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      // Try to parse the date
      const dateStr = match[1].trim();
      const parsed = new Date(dateStr);
      if (!isNaN(parsed.getTime())) {
        deadline = parsed.toISOString();
      }
      break;
    }
  }

  // Look for estimated value patterns
  const valuePatterns = [
    /(?:estimated value|contract value|budget|worth)[:\s]*\$?([\d,]+(?:\.\d{2})?)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)\s*(?:million|m\b)/i,
    /\$\s*([\d,]+(?:\.\d{2})?)/i,
  ];
  let estimatedValue: number | undefined;
  for (const pattern of valuePatterns) {
    const match = markdown.match(pattern);
    if (match) {
      const numStr = match[1].replace(/,/g, '');
      const num = parseFloat(numStr);
      if (!isNaN(num)) {
        // Check if it's in millions
        if (match[0].toLowerCase().includes('million') || match[0].toLowerCase().includes(' m')) {
          estimatedValue = num * 1000000;
        } else {
          estimatedValue = num;
        }
      }
      break;
    }
  }

  // Determine category from content
  const categoryKeywords: Record<string, string[]> = {
    marketing: ['marketing', 'advertising', 'brand', 'promotion', 'campaign'],
    copywriting: ['copywriting', 'content', 'writing', 'editorial', 'copy'],
    design: ['design', 'ui', 'ux', 'graphic', 'visual', 'creative'],
    research: ['research', 'study', 'analysis', 'survey', 'data'],
    translation: ['translation', 'localization', 'interpreter', 'language'],
    engineering: ['software', 'development', 'engineering', 'technical', 'it'],
  };

  let category = 'general';
  const lowerMarkdown = markdown.toLowerCase();
  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerMarkdown.includes(kw))) {
      category = cat;
      break;
    }
  }

  // Use first ~500 chars of content as description
  const description = markdown
    .replace(/^#.*$/gm, '') // Remove headings
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .replace(/[*_`]/g, '') // Remove formatting
    .trim()
    .slice(0, 500);

  return {
    title,
    agency,
    deadline,
    estimatedValue,
    category,
    description: description || 'No description available.',
  };
}

// Re-export calculateBounty from utils for server-side usage
export { calculateBounty } from './utils';
