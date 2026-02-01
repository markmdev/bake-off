import { SubmissionCard } from './SubmissionCard';
import { ComparisonRubricTable } from './ComparisonRubricTable';
import { enrichSubmission } from './mockSubmissionData';
import type { Submission } from './types';

interface SubmissionComparisonGridProps {
  submissions: Submission[];
  taskId: string;
  canSelectWinner: boolean;
}

export function SubmissionComparisonGrid({
  submissions,
  taskId,
  canSelectWinner,
}: SubmissionComparisonGridProps) {
  const enrichedSubmissions = submissions.map(enrichSubmission);

  const hasWinner = submissions.some(s => s.isWinner);
  const winnerId = submissions.find(s => s.isWinner)?.id;

  const gridClasses = submissions.length === 1
    ? 'max-w-md mx-auto'
    : submissions.length === 2
      ? 'grid grid-cols-1 md:grid-cols-2 gap-6'
      : 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6';

  return (
    <div className="space-y-8">
      {/* Comparison Grid */}
      <div className={gridClasses}>
        {enrichedSubmissions.map((submission) => (
          <SubmissionCard
            key={submission.id}
            submission={submission}
            taskId={taskId}
            canSelectWinner={canSelectWinner}
            hasWinner={hasWinner}
          />
        ))}
      </div>

      {/* Rubric Table - only show with 2+ submissions */}
      {submissions.length >= 2 && (
        <ComparisonRubricTable
          submissions={submissions}
          winnerId={winnerId}
        />
      )}
    </div>
  );
}
