/**
 * Firecrawl client for web scraping and RFP discovery
 *
 * Singleton pattern matching lib/stripe/index.ts
 */

import FirecrawlApp from '@mendable/firecrawl-js';
import crypto from 'crypto';
import type { RfpData } from '@/types/rfp';
import { chatCompletion } from '@/lib/openrouter';

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

// =============================================================================
// Web Search (for task research)
// =============================================================================

export interface SearchResult {
  title: string;
  url: string;
  description: string;
  content: string;
}

export interface WebSearchResult {
  query: string;
  results: SearchResult[];
  error?: string;
}

interface FirecrawlWebResult {
  title?: string;
  url?: string;
  description?: string;
  markdown?: string;
}

// Firecrawl API can return different response formats
interface FirecrawlSearchResponse {
  success?: boolean;
  data?: FirecrawlWebResult[];
  web?: FirecrawlWebResult[];
  error?: string;
}

export async function searchWeb(query: string, limit: number = 5): Promise<WebSearchResult> {
  console.log('[Firecrawl] Searching:', query);
  try {
    const firecrawl = getFirecrawl();
    const response = (await firecrawl.search(query, {
      limit,
    })) as unknown as FirecrawlSearchResponse;

    // Handle different response formats from Firecrawl API
    let webResults: FirecrawlWebResult[] = [];

    if (response.web && Array.isArray(response.web)) {
      // Format: { web: [...] }
      webResults = response.web;
    } else if (response.data && Array.isArray(response.data)) {
      // Format: { success: true, data: [...] }
      webResults = response.data;
    } else if (response.success === false) {
      console.error('[Firecrawl] Search failed:', response.error);
      return {
        query,
        results: [],
        error: response.error || 'Search failed',
      };
    }

    console.log('[Firecrawl] Got', webResults.length, 'results for:', query.slice(0, 50));

    const results: SearchResult[] = webResults.map((item) => ({
      title: item.title || '',
      url: item.url || '',
      description: item.description || '',
      content: item.markdown || '',
    }));

    return {
      query,
      results,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error during web search';
    console.error('[Firecrawl] Search error:', message);
    return {
      query,
      results: [],
      error: message,
    };
  }
}

export async function generateSearchQueries(
  title: string,
  description: string,
  extractedTexts: string[]
): Promise<string[]> {
  console.log('[Firecrawl] Generating search queries with AI...');

  // Build context from extracted documents
  const docContext = extractedTexts
    .slice(0, 2)
    .map((text, i) => `Document ${i + 1}:\n${text.slice(0, 1000)}`)
    .join('\n\n');

  const systemPrompt = `You are a search query generator. Given a task description and optional document context, generate 3-5 effective web search queries that would help gather relevant information, resources, examples, and documentation for completing the task.

Output ONLY a JSON array of search query strings. No explanation, no markdown, just the JSON array.

Example output:
["react dashboard templates", "compliance management software features", "SaaS UI design patterns"]`;

  const userPrompt = `Task Title: ${title}

Task Description: ${description}

${docContext ? `Attached Document Context:\n${docContext}` : ''}

Generate 3-5 search queries to research this task:`;

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 500 }
    );

    // Parse JSON response
    let jsonStr = response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.slice(7);
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.slice(3);
    }
    if (jsonStr.endsWith('```')) {
      jsonStr = jsonStr.slice(0, -3);
    }
    jsonStr = jsonStr.trim();

    const queries = JSON.parse(jsonStr) as string[];

    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('Invalid response format');
    }

    console.log('[Firecrawl] AI generated queries:', queries);
    return queries.slice(0, 5);
  } catch (err) {
    console.error('[Firecrawl] AI query generation failed:', err);
    // Fallback to simple approach
    const fallback = [title, `${title} tutorial`, `${title} examples`];
    console.log('[Firecrawl] Using fallback queries:', fallback);
    return fallback;
  }
}

// =============================================================================
// RFP Scraping (for task discovery)
// =============================================================================

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
