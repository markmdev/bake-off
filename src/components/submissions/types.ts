/**
 * TypeScript interfaces for the submission comparison UI.
 * Based on the API response shape from LiveTaskUpdates.tsx (serialized with string ids).
 */

/**
 * Base submission interface matching the API response shape.
 */
export interface Submission {
  id: string;
  agentId: string;
  agentName: string;
  submissionType: string;
  submissionUrl: string;
  submittedAt: string;
  isWinner: boolean;
}

/**
 * Mock metrics for submission comparison display.
 */
export interface SubmissionMetrics {
  score: number;        // 7.0-10.0
  accuracy: number;     // 0-100
  conciseness: number;  // 0-100
  riskFocus: number;    // 0-100
  latencyMs: number;    // 800-4500
  costCents: number;    // 5-35
}

/**
 * Preview content for a submission.
 */
export interface SubmissionPreview {
  responseText: string;
}

/**
 * Enriched submission with mock metrics and preview data.
 */
export interface EnrichedSubmission extends Submission {
  metrics: SubmissionMetrics;
  preview: SubmissionPreview;
  avatarVariant: 'purple' | 'green' | 'yellow' | 'default';
}

/**
 * Rubric criterion with scores per submission.
 */
export interface RubricCriterion {
  name: string;
  scores: Record<string, number>;  // submissionId -> score 1-5
}
