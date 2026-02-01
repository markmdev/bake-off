import Reducto from 'reductoai';

let reductoInstance: Reducto | null = null;

function getReducto(): Reducto {
  if (!reductoInstance) {
    const key = process.env.REDUCTO_API_KEY;
    if (!key) {
      throw new Error('REDUCTO_API_KEY environment variable is not defined');
    }
    reductoInstance = new Reducto({ apiKey: key });
  }
  return reductoInstance;
}

export interface DocumentParseResult {
  extractedText: string;
  pageCount?: number;
  error?: string;
}

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // docx
  'application/msword', // doc
  'text/plain',
  'text/markdown',
];

export function isSupportedDocument(mimeType: string): boolean {
  return SUPPORTED_MIME_TYPES.includes(mimeType);
}

interface ParseChunk {
  content: string;
}

interface FullParseResult {
  type: 'full';
  chunks: ParseChunk[];
}

interface UrlParseResult {
  type: 'url';
  url: string;
}

interface ParseResponse {
  result: FullParseResult | UrlParseResult;
}

export async function parseDocument(url: string): Promise<DocumentParseResult> {
  console.log('[Reducto] Parsing document:', url);
  try {
    const reducto = getReducto();
    const response = (await reducto.parse.run({
      input: url,
    })) as unknown as ParseResponse;

    // Handle async response (job_id only)
    if ('job_id' in response && !('result' in response)) {
      return {
        extractedText: '',
        error: 'Async parsing not supported',
      };
    }

    const result = response.result;

    // Handle full result
    if (result.type === 'full') {
      const chunks = result.chunks;
      const extractedText = chunks.map((chunk) => chunk.content).join('\n\n');
      const pageCount = chunks.length > 0 ? chunks.length : undefined;

      return {
        extractedText,
        pageCount,
      };
    }

    // URL result - fetch the content
    if (result.type === 'url') {
      const fetchedResponse = await fetch(result.url);
      const data = await fetchedResponse.json();
      if (data.chunks) {
        const extractedText = data.chunks
          .map((chunk: ParseChunk) => chunk.content)
          .join('\n\n');
        return {
          extractedText,
          pageCount: data.chunks.length,
        };
      }
    }

    return {
      extractedText: '',
      error: 'Unexpected response format',
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error parsing document';
    console.error('Reducto parse error:', message);
    return {
      extractedText: '',
      error: message,
    };
  }
}
