const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

function getApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    throw new Error('OPENROUTER_API_KEY environment variable is not defined');
  }
  return key;
}

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionResponse {
  choices: Array<{
    message: {
      content: string;
    };
    finish_reason: string;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export async function chatCompletion(
  messages: ChatMessage[],
  options: {
    maxTokens?: number;
    model?: string;
  } = {}
): Promise<string> {
  const { maxTokens = 20000, model = 'anthropic/claude-sonnet-4' } = options;

  console.log('[OpenRouter] Calling API with model:', model);

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getApiKey()}`,
      'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://bakeoff.ink',
      'X-Title': 'Bake-off',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      messages,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[OpenRouter] API error:', response.status, errorText);
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data: ChatCompletionResponse = await response.json();

  if (!data.choices || data.choices.length === 0) {
    throw new Error('No response from OpenRouter API');
  }

  console.log('[OpenRouter] API call successful');
  return data.choices[0].message.content;
}

export interface TaskInsights {
  summary: string;
  requirements: string[];
  technicalSkills: string[];
  keyDeliverables: string[];
  suggestedApproach: string;
  estimatedComplexity: 'low' | 'medium' | 'high';
  relevantContext: string;
  potentialChallenges: string[];
  successCriteria: string[];
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
  console.log('[OpenRouter] Generating task insights for:', input.title);

  const { title, description, documentExtracts, webResearch } = input;

  // Build context from documents
  const documentContext = documentExtracts
    .filter((d) => d.extractedText)
    .map((d) => `### Document: ${d.filename}\n${d.extractedText.slice(0, 3000)}`)
    .join('\n\n');

  // Build context from web research
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

    // Parse JSON response, handling potential markdown code blocks
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

    const insights = JSON.parse(jsonStr) as TaskInsights;

    console.log('[OpenRouter] Successfully generated insights');

    // Validate and normalize
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
    console.error('[OpenRouter] Failed to generate task insights:', err);
    // Return minimal insights on error
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
