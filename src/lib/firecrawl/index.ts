import FirecrawlApp from '@mendable/firecrawl-js';
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
