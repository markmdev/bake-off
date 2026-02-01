import Anthropic from '@anthropic-ai/sdk';
import { TaskInsights } from '@/types';
import { stripMarkdownJson } from '@/lib/utils/json';

// Provider detection
type Provider = 'openrouter' | 'anthropic';

function getProvider(): Provider {
  if (process.env.OPENROUTER_API_KEY) {
    return 'openrouter';
  }
  if (process.env.ANTHROPIC_API_KEY) {
    return 'anthropic';
  }
  throw new Error('No AI provider configured. Set OPENROUTER_API_KEY or ANTHROPIC_API_KEY.');
}

// OpenRouter implementation
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

interface OpenRouterResponse {
  choices: Array<{
    message: { content: string };
    finish_reason: string;
  }>;
}

async function openRouterCompletion(
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 60000);

  try {
    const response = await fetch(OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://bakeoff.ink',
        'X-Title': 'Bake-off',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        max_tokens: maxTokens,
        messages,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data: OpenRouterResponse = await response.json();

    if (!data.choices || data.choices.length === 0) {
      throw new Error('No response from OpenRouter API');
    }

    return data.choices[0].message.content;
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('OpenRouter request timed out after 60 seconds');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

// Anthropic SDK implementation
let anthropicClient: Anthropic | null = null;

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    anthropicClient = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropicClient;
}

async function anthropicCompletion(
  messages: ChatMessage[],
  maxTokens: number
): Promise<string> {
  const client = getAnthropicClient();

  const systemMessage = messages.find((m) => m.role === 'system')?.content;
  const nonSystemMessages = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    }));

  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: systemMessage,
    messages: nonSystemMessages,
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('No text response from Anthropic API');
  }

  return textBlock.text;
}

// Public interface
interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: { maxTokens?: number } = {}
): Promise<string> {
  const { maxTokens = 4096 } = options;
  const provider = getProvider();

  console.log(`[AI] Using ${provider} provider`);

  if (provider === 'openrouter') {
    return openRouterCompletion(messages, maxTokens);
  } else {
    return anthropicCompletion(messages, maxTokens);
  }
}

export async function generateTaskInsights(input: {
  title: string;
  description: string;
  documentExtracts: Array<{
    filename: string;
    extractedText: string;
  }>;
  webResearch: Array<{
    query: string;
    results: Array<{
      title: string;
      url: string;
      description: string;
      content: string;
    }>;
  }>;
}): Promise<TaskInsights> {
  const provider = getProvider();
  console.log(`[AI] Generating task insights for: ${input.title}`);

  const { title, description, documentExtracts, webResearch } = input;

  const documentContext = documentExtracts
    .filter((d) => d.extractedText)
    .map((d) => `### Document: ${d.filename}\n${d.extractedText.slice(0, 3000)}`)
    .join('\n\n');

  const webContext = webResearch
    .flatMap((w) =>
      w.results.slice(0, 3).map((r) => `### ${r.title}\nURL: ${r.url}\n${r.content.slice(0, 1500)}`)
    )
    .slice(0, 10)
    .join('\n\n');

  const systemPrompt = `You are an expert task analyst for a platform where AI agents compete to complete tasks. Your job is to analyze task requirements and provide comprehensive insights that will help agents understand and successfully complete tasks.

You must respond with valid JSON matching this exact structure:
{
  "summary": "A clear 2-3 sentence summary of what this task requires",
  "requirements": ["requirement 1", "requirement 2", ...],
  "technicalSkills": ["skill 1", "skill 2", ...],
  "keyDeliverables": ["deliverable 1", "deliverable 2", ...],
  "suggestedApproach": "A paragraph describing the recommended approach",
  "estimatedComplexity": "low" | "medium" | "high",
  "relevantContext": "Important background information from documents and research",
  "potentialChallenges": ["challenge 1", "challenge 2", ...],
  "successCriteria": ["criterion 1", "criterion 2", ...]
}

Be thorough but concise. Extract actionable insights. Focus on what an AI agent needs to know to complete this task successfully.`;

  const userPrompt = `Analyze this task and provide detailed insights:

# Task Title
${title}

# Task Description
${description}

${documentContext ? `# Attached Documents\n${documentContext}` : ''}

${webContext ? `# Relevant Web Research\n${webContext}` : ''}

Respond with the JSON analysis only, no additional text.`;

  try {
    const response = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      { maxTokens: 4096 }
    );

    const cleaned = stripMarkdownJson(response);
    const insights = JSON.parse(cleaned) as TaskInsights;

    console.log(`[AI] Successfully generated insights using ${provider}`);

    return {
      summary: insights.summary || '',
      requirements: Array.isArray(insights.requirements) ? insights.requirements : [],
      technicalSkills: Array.isArray(insights.technicalSkills) ? insights.technicalSkills : [],
      keyDeliverables: Array.isArray(insights.keyDeliverables) ? insights.keyDeliverables : [],
      suggestedApproach: insights.suggestedApproach || '',
      estimatedComplexity: ['low', 'medium', 'high'].includes(insights.estimatedComplexity)
        ? insights.estimatedComplexity
        : 'medium',
      relevantContext: insights.relevantContext || '',
      potentialChallenges: Array.isArray(insights.potentialChallenges)
        ? insights.potentialChallenges
        : [],
      successCriteria: Array.isArray(insights.successCriteria) ? insights.successCriteria : [],
    };
  } catch (err) {
    console.error(`[AI] Failed to generate task insights:`, err);
    return {
      summary: description.slice(0, 200),
      requirements: [],
      technicalSkills: [],
      keyDeliverables: [],
      suggestedApproach: '',
      estimatedComplexity: 'medium',
      relevantContext: '',
      potentialChallenges: [],
      successCriteria: [],
    };
  }
}
