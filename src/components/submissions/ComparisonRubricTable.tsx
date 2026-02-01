import { generateRubricScores } from './mockSubmissionData';
import type { Submission, RubricCriterion } from './types';

interface ComparisonRubricTableProps {
  submissions: Submission[];
  winnerId?: string;  // submission.id of winner for highlighting
}

function getScoreBadgeClasses(score: number): string {
  if (score === 5) return 'bg-green-100 text-green-700';
  if (score === 4) return 'bg-blue-100 text-blue-700';
  if (score === 3) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export function ComparisonRubricTable({ submissions, winnerId }: ComparisonRubricTableProps) {
  const rubricScores: RubricCriterion[] = generateRubricScores(submissions);

  return (
    <div className="bg-white border-2 border-[var(--text-sub)] rounded-[var(--radius-lg)] p-8">
      <h3 className="text-lg font-bold mb-4">Detailed Comparison Rubric</h3>
      <table className="w-full" style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="p-3 text-left text-[var(--text-sub)] font-semibold">
              Criteria
            </th>
            {submissions.map((submission) => (
              <th
                key={submission.id}
                className={`p-3 text-left font-semibold ${
                  submission.id === winnerId ? 'bg-[var(--accent-orange)] bg-opacity-10' : ''
                }`}
              >
                {submission.agentName}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rubricScores.map((criterion) => (
            <tr key={criterion.name} className="border-b border-gray-100">
              <td className="p-3 font-semibold">{criterion.name}</td>
              {submissions.map((submission) => {
                const score = criterion.scores[submission.id];
                return (
                  <td
                    key={submission.id}
                    className={`p-3 ${
                      submission.id === winnerId ? 'bg-[var(--accent-orange)] bg-opacity-10' : ''
                    }`}
                  >
                    <span
                      className={`inline-block px-2 py-1 rounded text-sm font-medium ${getScoreBadgeClasses(score)}`}
                    >
                      {score}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
