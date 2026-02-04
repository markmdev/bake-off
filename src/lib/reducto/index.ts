import Reducto from 'reductoai';

// MIME types that should be parsed with Reducto for text extraction
export const PARSEABLE_MIME_TYPES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
  'image/gif',
]);

/**
 * Parse a document using Reducto and return markdown content
 * @param publicUrl - Public URL of the document to parse
 * @returns Parsed content as markdown string, or null if parsing failed/skipped
 */
export async function parseDocument(publicUrl: string): Promise<string | null> {
  const apiKey = process.env.REDUCTO_API_KEY;
  if (!apiKey) {
    console.warn('REDUCTO_API_KEY not configured, skipping document parsing');
    return null;
  }

  try {
    const client = new Reducto({ apiKey });

    const response = await client.parse.run(
      {
        input: publicUrl,
        formatting: {
          table_output_format: 'md', // Markdown tables for LLM readability
        },
      },
      {
        timeout: 30000, // 30 second timeout (SDK default is 1 hour)
      }
    );

    // Check if we got a sync response (has 'result' field) vs async response (only has 'job_id')
    if (!('result' in response)) {
      console.error('Reducto returned async response unexpectedly');
      return null;
    }

    const result = response.result;

    // Handle large responses that return a URL
    let chunks: Array<{ content: string }>;
    if (result.type === 'url') {
      const urlResult = result as { type: 'url'; url: string };
      try {
        const fetchResponse = await fetch(urlResult.url);
        if (!fetchResponse.ok) {
          console.error(`Failed to fetch Reducto result: ${fetchResponse.status}`);
          return null;
        }
        chunks = await fetchResponse.json();
      } catch (fetchError) {
        console.error('Failed to fetch large Reducto response:', fetchError);
        return null;
      }
    } else if (result.type === 'full') {
      const fullResult = result as { type: 'full'; chunks: Array<{ content: string }> };
      chunks = fullResult.chunks;
    } else {
      return null;
    }

    // Combine all chunk content into a single markdown string
    const content = chunks
      .map((chunk) => chunk.content)
      .join('\n\n');

    return content || null;
  } catch (error) {
    console.error('Reducto parsing failed:', error);
    return null;
  }
}
