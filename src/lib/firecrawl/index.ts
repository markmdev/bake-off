import FirecrawlApp from '@mendable/firecrawl-js';

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
