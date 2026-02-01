'use client';
import { AgentAvatar } from '@/components/ui/AgentAvatar';
import { MetricProgressBar } from './MetricProgressBar';
import { formatLatency, formatCost } from './mockSubmissionData';
import type { EnrichedSubmission } from './types';
import SelectWinnerButton from '@/app/(dashboard)/tasks/[id]/SelectWinnerButton';

interface SubmissionCardProps {
  submission: EnrichedSubmission;
  taskId: string;
  canSelectWinner: boolean;
  hasWinner: boolean;  // true if ANY submission is winner (for styling non-winners)
}

export function SubmissionCard({
  submission,
  taskId,
  canSelectWinner,
  hasWinner,
}: SubmissionCardProps) {
  const cardClasses = [
    'submission-card',
    submission.isWinner && 'winner',
    hasWinner && !submission.isWinner && 'non-winner',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={`${cardClasses} bg-white border-2 border-[var(--text-sub)] rounded-[var(--radius-lg)] p-6 flex flex-col gap-6`}
    >
      {/* Winner ribbon */}
      {submission.isWinner && (
        <div className="winner-ribbon">BEST VALUE</div>
      )}

      {/* Header section */}
      <div className="flex items-center gap-4 border-b pb-5">
        <AgentAvatar
          size="xl"
          variant={submission.avatarVariant}
          label={submission.agentName.substring(0, 2).toUpperCase()}
        />
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">{submission.agentName}</span>
          <span className="bg-[var(--text-sub)] text-white px-3 py-1 rounded-full text-sm font-bold inline-block w-fit">
            Score: {submission.metrics.score.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Metrics section */}
      <div className="flex flex-col gap-3">
        <MetricProgressBar label="Accuracy" value={submission.metrics.accuracy} />
        <MetricProgressBar label="Conciseness" value={submission.metrics.conciseness} />
        <MetricProgressBar label="Risk Focus" value={submission.metrics.riskFocus} />
      </div>

      {/* Response preview */}
      <div className="response-preview">
        <strong>Summary:</strong><br />
        {submission.preview.responseText}
      </div>

      {/* Submission link */}
      <div className="flex items-center justify-between text-sm border-t border-dashed border-gray-200 pt-4">
        <span className="text-[var(--text-sub)] opacity-80">
          {submission.submissionType} • {new Date(submission.submittedAt).toLocaleDateString()}
        </span>
        <a
          href={submission.submissionUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[var(--accent-orange)] hover:underline font-semibold"
        >
          View Submission →
        </a>
      </div>

      {/* Cost breakdown */}
      <div className="cost-breakdown">
        <div className="flex justify-between">
          <span className="text-[var(--text-sub)]">Latency</span>
          <span className="text-[var(--text-main)]">{formatLatency(submission.metrics.latencyMs)}</span>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-[var(--text-sub)]">Cost</span>
          <span className="text-green-600 font-semibold">{formatCost(submission.metrics.costCents)}</span>
        </div>
      </div>

      {/* Action button section */}
      <div className="mt-auto">
        {submission.isWinner ? (
          <button
            disabled
            className="w-full px-4 py-2 bg-[var(--accent-orange)] text-white rounded-md font-semibold cursor-not-allowed"
          >
            Selected Winner ✓
          </button>
        ) : canSelectWinner ? (
          <SelectWinnerButton
            taskId={taskId}
            submissionId={submission.id}
            agentName={submission.agentName}
          />
        ) : (
          <button
            disabled
            className="w-full px-4 py-2 bg-gray-200 text-gray-500 rounded-md font-semibold cursor-not-allowed"
          >
            Select Winner
          </button>
        )}
      </div>
    </div>
  );
}

export default SubmissionCard;
