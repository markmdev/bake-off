import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { parseDocument, isSupportedDocument } from '@/lib/reducto';
import { searchWeb, generateSearchQueries } from '@/lib/firecrawl';
import { generateTaskInsights } from '@/lib/openrouter';

export type ResearchStep = 'parsing_documents' | 'researching_web' | 'analyzing' | 'finalizing';

export async function runTaskResearch(taskId: string): Promise<void> {
  console.log('[Research] Starting for task:', taskId);

  await connectDB();

  const task = await Task.findById(taskId);
  if (!task) {
    console.error('[Research] Task not found:', taskId);
    return;
  }

  console.log('[Research] Task found, attachments:', task.attachments.length);

  try {
    // Initialize research status
    task.research = {
      ...task.research,
      status: 'processing',
      currentStep: 'parsing_documents',
      startedAt: new Date(),
      documentExtracts: [],
      webResearch: [],
      progress: {
        documentsTotal: 0,
        documentsParsed: 0,
        queriesTotal: 0,
        queriesCompleted: 0,
      },
    };

    // Count parseable documents
    const parseableAttachments = task.attachments.filter((att) =>
      isSupportedDocument(att.mimeType)
    );
    task.research.progress!.documentsTotal = parseableAttachments.length;
    await task.save();
    console.log('[Research] Step 1: Parsing', parseableAttachments.length, 'documents');

    // Step 1: Parse documents
    const extractedTexts: string[] = [];

    for (const attachment of parseableAttachments) {
      const result = await parseDocument(attachment.url);

      task.research.documentExtracts.push({
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        extractedText: result.extractedText,
        pageCount: result.pageCount,
        extractedAt: new Date(),
        error: result.error,
      });

      if (result.extractedText) {
        extractedTexts.push(result.extractedText);
      }

      task.research.progress!.documentsParsed += 1;
      await task.save();
    }

    // Step 2: Web research
    task.research.currentStep = 'researching_web';
    await task.save();
    console.log('[Research] Step 2: Web research starting');

    const queries = await generateSearchQueries(
      task.title,
      task.description,
      extractedTexts
    );
    task.research.progress!.queriesTotal = queries.length;
    await task.save();
    console.log('[Research] Generated', queries.length, 'search queries:', queries);

    for (const query of queries) {
      const result = await searchWeb(query, 5);

      task.research.webResearch.push({
        query: result.query,
        results: result.results,
        searchedAt: new Date(),
        error: result.error,
      });

      task.research.progress!.queriesCompleted += 1;
      await task.save();
    }

    // Step 3: AI Analysis - Generate insights using LLM
    task.research.currentStep = 'analyzing';
    await task.save();
    console.log('[Research] Step 3: AI analysis starting');

    const insights = await generateTaskInsights({
      title: task.title,
      description: task.description,
      documentExtracts: task.research.documentExtracts.map((d) => ({
        filename: d.filename,
        extractedText: d.extractedText,
      })),
      webResearch: task.research.webResearch.map((w) => ({
        query: w.query,
        results: w.results,
      })),
    });

    task.research.insights = insights;
    await task.save();

    // Step 4: Finalize
    task.research.currentStep = 'finalizing';
    await task.save();

    // Determine final status
    const hasDocErrors = task.research.documentExtracts.some((d) => d.error);
    const hasSearchErrors = task.research.webResearch.some((w) => w.error);
    const hasAnyResults =
      task.research.documentExtracts.some((d) => d.extractedText) ||
      task.research.webResearch.some((w) => w.results.length > 0);
    const hasInsights = insights.summary.length > 0;

    if (hasDocErrors || hasSearchErrors) {
      task.research.status = hasAnyResults || hasInsights ? 'partial' : 'failed';
      if (!hasAnyResults && !hasInsights) {
        task.research.error = 'All document parsing and web searches failed';
      }
    } else {
      task.research.status = 'completed';
    }

    task.research.completedAt = new Date();
    await task.save();

    console.log('[Research] Completed for task:', taskId, 'Status:', task.research.status);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : '';
    console.error('[Research] Failed for task:', taskId, message);
    console.error('[Research] Stack trace:', stack);

    // Update task with error status
    task.research = task.research || {
      status: 'failed',
      documentExtracts: [],
      webResearch: [],
    };
    task.research.status = 'failed';
    task.research.error = message;
    task.research.completedAt = new Date();
    await task.save();
  }
}
