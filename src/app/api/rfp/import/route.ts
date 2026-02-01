/**
 * SSE streaming endpoint for RFP import
 *
 * POST /api/rfp/import
 * Body: { categories?: string[], limit?: number }
 * Returns: text/event-stream with SSE events
 */

import { NextRequest } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { mapRfpSource, scrapeRfpPage, calculateBounty } from '@/lib/firecrawl';
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
  // Auth check
  const user = await getCurrentUser();
  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Parse body
  let categories: string[] | undefined;
  let limit = 20;

  try {
    const body = await request.json();
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
        send({ type: 'status', message: 'Connecting to RFP source...', progress: 0 });

        // Map the source to discover URLs
        let urls: string[];
        try {
          urls = await mapRfpSource(limit);
        } catch (error) {
          console.error('Failed to map RFP source:', error);
          send({ type: 'error', message: 'Could not reach RFP source. Try again later.' });
          controller.close();
          return;
        }

        if (urls.length === 0) {
          send({ type: 'status', message: 'No RFP listings found', progress: 100 });
          send({ type: 'complete', totalFound: 0 });
          controller.close();
          return;
        }

        send({ type: 'status', message: `Found ${urls.length} listings to scan`, progress: 10 });

        // Scrape each URL and stream results
        const rfps: RfpData[] = [];
        for (let i = 0; i < urls.length; i++) {
          const url = urls[i];
          const progress = 10 + Math.floor((i / urls.length) * 85);

          send({
            type: 'status',
            message: `Scanning ${i + 1}/${urls.length}...`,
            progress,
          });

          try {
            const rfpData = await scrapeRfpPage(url);

            if (rfpData) {
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
              }
            }
          } catch (error) {
            // Skip failed pages silently
            console.error(`Failed to scrape ${url}:`, error);
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));
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
