import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { parseDocument, isSupportedDocument } from '@/lib/reducto';
import { searchWeb } from '@/lib/firecrawl';
import { chatCompletion, generateTaskInsights } from '@/lib/openrouter';
import { stripMarkdownJson } from '@/lib/utils/json';

export type ResearchStep = 'parsing_documents' | 'researching_web' | 'analyzing' | 'finalizing';

/**
 * Uses LLM to generate effective search queries based on task context.
 * This function lives in the research orchestrator because it combines
 * LLM capabilities (openrouter) with web search intent (firecrawl).
 */
async function generateSearchQueries(
  title: string,
  description: string,
  extractedTexts: string[]
): Promise<string[]> {
  console.log('[Research] Generating search queries with AI...');

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

    const cleaned = stripMarkdownJson(response);
    const queries = JSON.parse(cleaned) as string[];

    if (!Array.isArray(queries) || queries.length === 0) {
      throw new Error('Invalid response format');
    }

    console.log('[Research] AI generated queries:', queries);
    return queries.slice(0, 5);
  } catch (err) {
    console.error('[Research] AI query generation failed:', err);
    // Fallback to simple approach
    const fallback = [title, `${title} tutorial`, `${title} examples`];
    console.log('[Research] Using fallback queries:', fallback);
    return fallback;
  }
}

export async function runTaskResearch(taskId: string): Promise<void> {
  console.log('[Research] Starting for task:', taskId);

  await connectDB();

  // Fetch task once to get attachments (read-only data needed for processing)
  const task = await Task.findById(taskId);
  if (!task) {
    console.error('[Research] Task not found:', taskId);
    return;
  }

  console.log('[Research] Task found, attachments:', task.attachments.length);

  // Count parseable documents upfront
  const parseableAttachments = task.attachments.filter((att) =>
    isSupportedDocument(att.mimeType)
  );

  try {
    // Initialize research status atomically
    await Task.findByIdAndUpdate(taskId, {
      $set: {
        'research.status': 'processing',
        'research.currentStep': 'parsing_documents',
        'research.startedAt': new Date(),
        'research.documentExtracts': [],
        'research.webResearch': [],
        'research.progress': {
          documentsTotal: parseableAttachments.length,
          documentsParsed: 0,
          queriesTotal: 0,
          queriesCompleted: 0,
        },
      },
    });
    console.log('[Research] Step 1: Parsing', parseableAttachments.length, 'documents');

    // Step 1: Parse documents
    const extractedTexts: string[] = [];

    for (const attachment of parseableAttachments) {
      const result = await parseDocument(attachment.url);

      const documentExtract = {
        filename: attachment.filename,
        mimeType: attachment.mimeType,
        extractedText: result.extractedText,
        pageCount: result.pageCount,
        extractedAt: new Date(),
        error: result.error,
      };

      if (result.extractedText) {
        extractedTexts.push(result.extractedText);
      }

      // Push document extract and increment counter atomically
      await Task.findByIdAndUpdate(taskId, {
        $push: { 'research.documentExtracts': documentExtract },
        $inc: { 'research.progress.documentsParsed': 1 },
      });
    }

    // Step 2: Web research
    await Task.findByIdAndUpdate(taskId, {
      $set: { 'research.currentStep': 'researching_web' },
    });
    console.log('[Research] Step 2: Web research starting');

    const queries = await generateSearchQueries(
      task.title,
      task.description,
      extractedTexts
    );

    await Task.findByIdAndUpdate(taskId, {
      $set: { 'research.progress.queriesTotal': queries.length },
    });
    console.log('[Research] Generated', queries.length, 'search queries:', queries);

    // Track web research results locally for insights generation
    const webResearchResults: Array<{
      query: string;
      results: Array<{ title: string; url: string; description: string; content: string }>;
      error?: string;
    }> = [];

    for (const query of queries) {
      const result = await searchWeb(query, 5);

      const webResearchEntry = {
        query: result.query,
        results: result.results,
        searchedAt: new Date(),
        error: result.error,
      };

      webResearchResults.push({
        query: result.query,
        results: result.results,
        error: result.error,
      });

      // Push web research result and increment counter atomically
      await Task.findByIdAndUpdate(taskId, {
        $push: { 'research.webResearch': webResearchEntry },
        $inc: { 'research.progress.queriesCompleted': 1 },
      });
    }

    // Step 3: AI Analysis - Generate insights using LLM
    await Task.findByIdAndUpdate(taskId, {
      $set: { 'research.currentStep': 'analyzing' },
    });
    console.log('[Research] Step 3: AI analysis starting');

    // Fetch updated task to get document extracts for insights generation
    const updatedTask = await Task.findById(taskId);
    const documentExtracts = updatedTask?.research?.documentExtracts || [];

    const insights = await generateTaskInsights({
      title: task.title,
      description: task.description,
      documentExtracts: documentExtracts.map((d) => ({
        filename: d.filename,
        extractedText: d.extractedText,
      })),
      webResearch: webResearchResults.map((w) => ({
        query: w.query,
        results: w.results,
      })),
    });

    await Task.findByIdAndUpdate(taskId, {
      $set: { 'research.insights': insights },
    });

    // Step 4: Finalize
    await Task.findByIdAndUpdate(taskId, {
      $set: { 'research.currentStep': 'finalizing' },
    });

    // Determine final status using local tracking data
    const hasDocErrors = documentExtracts.some((d) => d.error);
    const hasSearchErrors = webResearchResults.some((w) => w.error);
    const hasAnyResults =
      documentExtracts.some((d) => d.extractedText) ||
      webResearchResults.some((w) => w.results.length > 0);
    const hasInsights = insights.summary.length > 0;

    let finalStatus: 'completed' | 'partial' | 'failed' = 'completed';
    let errorMessage: string | undefined;

    if (hasDocErrors || hasSearchErrors) {
      finalStatus = hasAnyResults || hasInsights ? 'partial' : 'failed';
      if (!hasAnyResults && !hasInsights) {
        errorMessage = 'All document parsing and web searches failed';
      }
    }

    // Final atomic update with status and completion timestamp
    await Task.findByIdAndUpdate(taskId, {
      $set: {
        'research.status': finalStatus,
        'research.completedAt': new Date(),
        ...(errorMessage && { 'research.error': errorMessage }),
      },
    });

    console.log('[Research] Completed for task:', taskId, 'Status:', finalStatus);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    const stack = err instanceof Error ? err.stack : '';
    console.error('[Research] Failed for task:', taskId, message);
    console.error('[Research] Stack trace:', stack);

    // Update task with error status atomically
    await Task.findByIdAndUpdate(taskId, {
      $set: {
        'research.status': 'failed',
        'research.error': message,
        'research.completedAt': new Date(),
      },
    });
  }
}
