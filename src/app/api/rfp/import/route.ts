/**
 * SSE streaming endpoint for RFP import
 *
 * POST /api/rfp/import
 * Body: { categories?: string[], limit?: number }
 * Returns: text/event-stream with SSE events
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { scrapeRfpSearchResults } from '@/lib/firecrawl';
import type { SSEEvent, RfpData } from '@/types/rfp';

const AI_COMPATIBLE_CATEGORIES = [
  'marketing',
  'copywriting',
  'design',
  'research',
  'translation',
  'engineering',
  'general',
];

export async function POST(request: NextRequest) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return new Response(JSON.stringify({ error: 'API key authentication not allowed on this endpoint' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse body
  let searchQuery = 'Market research';
  let categories: string[] | undefined;
  let limit = 20;

  try {
    const body = await request.json();
    searchQuery = body.searchQuery || 'Market research';
    categories = body.categories;
    limit = body.limit || 20;
  } catch {
    // Empty body is fine, use defaults
  }

  // Create SSE stream
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: SSEEvent) => {
        try {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
        } catch {
          // Stream may have been closed
        }
      };

      try {
        send({ type: 'status', message: 'Connecting to FindRFP...', progress: 0 });

        // Scrape FindRFP search results with authenticated cookie
        let allRfps: RfpData[];
        try {
          send({ type: 'status', message: `Searching for "${searchQuery}"...`, progress: 20 });
          allRfps = await scrapeRfpSearchResults(searchQuery, limit);
        } catch (error) {
          console.error('Failed to scrape RFP search:', error);
          send({ type: 'error', message: 'Could not reach FindRFP. Try again later.' });
          controller.close();
          return;
        }

        if (allRfps.length === 0) {
          send({ type: 'status', message: 'No RFP listings found', progress: 100 });
          send({ type: 'complete', totalFound: 0 });
          controller.close();
          return;
        }

        send({ type: 'status', message: `Found ${allRfps.length} RFPs, filtering...`, progress: 60 });

        // Filter and stream results
        const rfps: RfpData[] = [];
        for (const rfpData of allRfps) {
          // Filter by category if specified
          const matchesCategory =
            !categories ||
            categories.length === 0 ||
            categories.includes(rfpData.category);

          // Only include AI-compatible categories
          const isAiCompatible = AI_COMPATIBLE_CATEGORIES.includes(rfpData.category);

          if (matchesCategory && isAiCompatible) {
            rfps.push(rfpData);
            send({ type: 'rfp', data: rfpData });
            // Small delay for visual streaming effect
            await new Promise(resolve => setTimeout(resolve, 50));
          }
        }

        send({ type: 'status', message: 'Scan complete', progress: 100 });
        send({ type: 'complete', totalFound: rfps.length });
      } catch (error) {
        console.error('RFP import error:', error);
        send({ type: 'error', message: 'An error occurred during import' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  });
}
