import { hashString, hashToRange } from '@/lib/utils/hash';
import type { Submission, EnrichedSubmission, SubmissionMetrics, SubmissionPreview, RubricCriterion } from './types';

const AVATAR_VARIANTS = ['purple', 'green', 'yellow', 'default'] as const;

const SAMPLE_RESPONSES = [
  "Based on my analysis of the provided requirements, I've implemented a comprehensive solution that addresses all key deliverables. The architecture follows best practices with clear separation of concerns...",
  "After reviewing the task specifications, I developed a modular approach that prioritizes maintainability and performance. Key features include error handling, input validation, and comprehensive logging...",
  "The solution I've built focuses on scalability and clean code principles. I've included unit tests covering the main functionality and documented the API endpoints thoroughly...",
  "I approached this task by first breaking down the requirements into smaller components. The implementation uses industry-standard patterns and includes detailed comments explaining the design decisions...",
];

/**
 * Generates deterministic mock metrics for a submission based on agent ID.
 */
export function generateMockMetrics(agentId: string): SubmissionMetrics {
  const hash = hashString(agentId);
  return {
    score: 7.0 + (hashToRange(hash, 0, 30, 1) / 10),
    accuracy: hashToRange(hash, 70, 100, 2),
    conciseness: hashToRange(hash, 60, 100, 3),
    riskFocus: hashToRange(hash, 65, 100, 4),
    latencyMs: hashToRange(hash, 800, 4500, 5),
    costCents: hashToRange(hash, 5, 35, 6),
  };
}

/**
 * Generates deterministic mock preview for a submission based on agent ID.
 */
export function generateMockPreview(agentId: string): SubmissionPreview {
  const hash = hashString(agentId);
  return {
    responseText: SAMPLE_RESPONSES[hash % SAMPLE_RESPONSES.length],
  };
}

/**
 * Returns a deterministic avatar variant for an agent based on agent ID.
 */
export function getAvatarVariant(agentId: string): 'purple' | 'green' | 'yellow' | 'default' {
  const hash = hashString(agentId);
  return AVATAR_VARIANTS[hash % AVATAR_VARIANTS.length];
}

/**
 * Enriches a submission with mock metrics, preview, and avatar variant.
 */
export function enrichSubmission(submission: Submission): EnrichedSubmission {
  return {
    ...submission,
    metrics: generateMockMetrics(submission.agentId),
    preview: generateMockPreview(submission.agentId),
    avatarVariant: getAvatarVariant(submission.agentId),
  };
}

/**
 * Formats latency in milliseconds to a human-readable string.
 * @example formatLatency(1234) => "1.2s"
 */
export function formatLatency(ms: number): string {
  return `${(ms / 1000).toFixed(1)}s`;
}

/**
 * Formats cost in cents to a human-readable dollar string.
 * @example formatCost(12) => "$0.12"
 */
export function formatCost(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

/**
 * Generates rubric scores for a list of submissions.
 * Each criterion has a score 1-5 for each submission based on agent hash.
 */
export function generateRubricScores(submissions: Submission[]): RubricCriterion[] {
  const criteria = [
    'Completeness',
    'Technical Accuracy',
    'Clarity',
    'Risk Assessment',
    'Cost Efficiency',
  ];

  return criteria.map((name, criterionIndex) => {
    const scores: Record<string, number> = {};
    for (const submission of submissions) {
      const hash = hashString(submission.agentId);
      scores[submission.id] = hashToRange(hash, 1, 5, criterionIndex);
    }
    return { name, scores };
  });
}
