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

interface FirecrawlSearchResponse {
  success: boolean;
  data?: {
    web?: Array<{
      title?: string;
      url?: string;
      description?: string;
      markdown?: string;
    }>;
  };
  error?: string;
}

export async function searchWeb(query: string, limit: number = 5): Promise<WebSearchResult> {
  console.log('[Firecrawl] Searching:', query);
  try {
    const firecrawl = getFirecrawl();
    const response = (await firecrawl.search(query, {
      limit,
    })) as unknown as FirecrawlSearchResponse;

    console.log('[Firecrawl] Raw response type:', typeof response);
    console.log('[Firecrawl] Raw response keys:', response ? Object.keys(response) : 'null');

    if (!response.success) {
      console.error('[Firecrawl] Search failed:', response.error);
      console.error('[Firecrawl] Full response:', JSON.stringify(response, null, 2));
      return {
        query,
        results: [],
        error: response.error || 'Search failed',
      };
    }

    const webResults = response.data?.web || [];
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
    console.error('Firecrawl search error:', message);
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

// FindRFP authentication cookie from environment
const FINDRFP_AUTH_COOKIE = process.env.FINDRFP_AUTH_COOKIE || '';

/**
 * Generate a unique ID for an RFP based on its source URL
 */
function generateRfpId(url: string): string {
  return crypto.createHash('md5').update(url).digest('hex').slice(0, 12);
}

/**
 * Scrape FindRFP search results using authenticated cookie injection
 */
export async function scrapeRfpSearchResults(
  searchQuery: string = 'Market research',
  limit: number = 20
): Promise<RfpData[]> {
  const firecrawl = getFirecrawl();
  const url = `https://www.findrfp.com/service/search.aspx?s=${encodeURIComponent(searchQuery)}&t=FE&is=0`;

  console.log('[Firecrawl] Scraping FindRFP search:', url);

  try {
    // Use firecrawl.scrape() with actions for cookie injection
    const result = await firecrawl.scrape(url, {
      formats: ['markdown'],
      actions: [
        {
          type: 'executeJavascript',
          // Escape cookie value to prevent JS injection
          script: `document.cookie = ${JSON.stringify(FINDRFP_AUTH_COOKIE)};`,
        },
        { type: 'wait', milliseconds: 2000 },
        { type: 'scrape' },
      ],
    });

    const markdown = result.markdown || '';
    console.log('[Firecrawl] Got markdown, length:', markdown.length);

    return parseSearchResults(markdown, limit);
  } catch (error) {
    console.error('[Firecrawl] Search scrape failed:', error);
    // Fall back to basic scrape without auth if actions not supported
    try {
      console.log('[Firecrawl] Retrying without actions...');
      const result = await firecrawl.scrape(url, {
        formats: ['markdown'],
      });
      return parseSearchResults(result.markdown || '', limit);
    } catch (fallbackError) {
      console.error('[Firecrawl] Fallback also failed:', fallbackError);
      return [];
    }
  }
}

/**
 * Parse FindRFP search results markdown into structured RFP data
 */
function parseSearchResults(markdown: string, limit: number): RfpData[] {
  const results: RfpData[] = [];

  // FindRFP search results are in a table format
  // Each row has: ID | Title (with link) | Agency | Location | Issued
  // Example: | 1 | [Market Research for...](https://...) | State/Local | Federal | 01/26/2026 |

  // Match table rows with links
  const rowPattern = /\|\s*\d+\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]*)\|\s*([^|]*)\|\s*(\d{2}\/\d{2}\/\d{4})\s*\|/g;

  let match;
  while ((match = rowPattern.exec(markdown)) !== null && results.length < limit) {
    const [, title, detailUrl, agency, location, issuedDate] = match;

    // Clean up extracted values
    const cleanTitle = title.trim();
    const cleanAgency = agency.trim() || 'Unknown';
    const cleanLocation = location.trim() || 'Unknown';
    const cleanIssuedDate = issuedDate.trim();

    // Calculate deadline as issuedDate + 30 days
    const issuedParts = cleanIssuedDate.split('/');
    const issuedDateObj = new Date(
      parseInt(issuedParts[2]),
      parseInt(issuedParts[0]) - 1,
      parseInt(issuedParts[1])
    );
    const deadlineDate = new Date(issuedDateObj.getTime() + 30 * 24 * 60 * 60 * 1000);
    const deadline = deadlineDate.toISOString();

    // Determine category from title keywords
    const category = inferCategory(cleanTitle);

    // Generate description with link to full details
    const description = generateRfpDescription({
      title: cleanTitle,
      agency: cleanAgency,
      location: cleanLocation,
      issuedDate: cleanIssuedDate,
      sourceUrl: detailUrl,
    });

    results.push({
      id: generateRfpId(detailUrl),
      sourceUrl: detailUrl,
      title: cleanTitle,
      agency: cleanAgency,
      location: cleanLocation,
      issuedDate: cleanIssuedDate,
      deadline,
      estimatedValue: null, // Not available from search results
      category,
      description,
    });
  }

  console.log('[Firecrawl] Parsed', results.length, 'RFPs from search results');
  return results;
}

/**
 * Infer category from RFP title keywords
 */
function inferCategory(title: string): string {
  const lowerTitle = title.toLowerCase();

  const categoryKeywords: Record<string, string[]> = {
    marketing: ['marketing', 'advertising', 'brand', 'promotion', 'campaign'],
    copywriting: ['copywriting', 'content', 'writing', 'editorial', 'copy'],
    design: ['design', 'ui', 'ux', 'graphic', 'visual', 'creative'],
    research: ['research', 'study', 'analysis', 'survey', 'data', 'market research'],
    translation: ['translation', 'localization', 'interpreter', 'language'],
    engineering: ['software', 'development', 'engineering', 'technical', 'it', 'technology'],
  };

  for (const [cat, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some(kw => lowerTitle.includes(kw))) {
      return cat;
    }
  }

  return 'general';
}

/**
 * Generate task description with link to FindRFP detail page
 */
function generateRfpDescription(rfp: {
  title: string;
  agency: string;
  location: string;
  issuedDate: string;
  sourceUrl: string;
}): string {
  return `## RFP Opportunity

**Title:** ${rfp.title}
**Agency:** ${rfp.agency}
**Location:** ${rfp.location}
**Issued:** ${rfp.issuedDate}

### Full RFP Details
View the complete RFP document at:
${rfp.sourceUrl}

### Task
Review this RFP and create a proposal response that addresses the requirements.`;
}

// Re-export calculateBounty from utils for server-side usage
export { calculateBounty } from './utils';
