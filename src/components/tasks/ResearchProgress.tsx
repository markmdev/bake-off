'use client';

import useSWR from 'swr';
import { useState } from 'react';

interface ResearchProgressData {
  documentsTotal: number;
  documentsParsed: number;
  queriesTotal: number;
  queriesCompleted: number;
}

interface ResearchSummary {
  documentCount: number;
  documentsWithText: number;
  searchCount: number;
  totalResults: number;
}

interface TaskInsights {
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

interface ResearchStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial' | null;
  currentStep: 'parsing_documents' | 'researching_web' | 'analyzing' | 'finalizing' | null;
  progress: ResearchProgressData | null;
  error: string | null;
  summary: ResearchSummary;
  insights: TaskInsights | null;
}

interface ResearchProgressProps {
  taskId: string;
  initialStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial' | null;
}

const complexityColors = {
  low: 'bg-[var(--accent-green-light)] text-[var(--accent-green)]',
  medium: 'bg-[var(--accent-yellow-light)] text-[var(--accent-yellow)]',
  high: 'bg-[var(--accent-pink-light)] text-[var(--accent-pink)]',
};

const fetcher = (url: string) => fetch(url).then((res) => res.json());

function isTerminalStatus(status: ResearchStatusResponse['status']): boolean {
  return status === 'completed' || status === 'failed' || status === 'partial' || status === null;
}

export default function ResearchProgress({
  taskId,
  initialStatus,
}: ResearchProgressProps) {
  const [showFullInsights, setShowFullInsights] = useState(false);

  const { data, error, isLoading } = useSWR<ResearchStatusResponse>(
    `/api/tasks/${taskId}/research-status`,
    fetcher,
    {
      // Poll every 2s while in progress, stop when terminal
      refreshInterval: (latestData) => {
        if (!latestData) {
          // Initial load - poll if initialStatus suggests we should
          return initialStatus === 'pending' || initialStatus === 'processing' ? 2000 : 0;
        }
        return isTerminalStatus(latestData.status) ? 0 : 2000;
      },
      revalidateOnFocus: true,
    }
  );

  // Don't render anything if loading initial data or no research data
  if (isLoading) {
    return null;
  }

  // Show error state if fetch failed
  if (error) {
    return (
      <div className="bg-[var(--accent-pink-light)] border-2 border-[var(--accent-pink)] rounded-[var(--radius-md)] p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">!</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">Unable to load research status</h3>
            <p className="text-sm text-[var(--text-sub)]">
              Failed to fetch research progress. Please refresh the page.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.status === null) {
    return null;
  }

  const { status, currentStep, progress, error: researchError, summary, insights } = data;

  // Completed state with insights
  if (status === 'completed' || status === 'partial') {
    return (
      <div className="bg-[var(--surface-white)] shadow-soft rounded-[var(--radius-md)] p-6 mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">{status === 'completed' ? '✓' : '⚠'}</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-main)]">
                {status === 'completed' ? 'Research complete' : 'Research partially complete'}
              </h3>
              <p className="text-sm text-[var(--text-sub)] opacity-80">
                {summary.documentsWithText} document{summary.documentsWithText !== 1 ? 's' : ''} parsed
                {' • '}
                {summary.totalResults} source{summary.totalResults !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          {insights && insights.estimatedComplexity && (
            <span className={`px-2 py-1 text-xs font-bold rounded-[var(--radius-sm)] border-2 border-[var(--text-sub)] ${complexityColors[insights.estimatedComplexity]}`}>
              {insights.estimatedComplexity.charAt(0).toUpperCase() + insights.estimatedComplexity.slice(1)} complexity
            </span>
          )}
        </div>

        {/* AI Insights Summary */}
        {insights && insights.summary && (
          <div className="border-t-2 border-dashed border-[rgba(26,43,60,0.1)] pt-4">
            <h4 className="text-sm font-bold text-[var(--text-sub)] mb-2">AI Analysis</h4>
            <p className="text-sm text-[var(--text-main)] mb-3">{insights.summary}</p>

            {!showFullInsights && (
              <button
                onClick={() => setShowFullInsights(true)}
                className="text-sm text-[var(--accent-orange)] hover:underline font-bold"
              >
                Show full analysis →
              </button>
            )}

            {showFullInsights && (
              <div className="space-y-4 mt-4">
                {insights.requirements.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide mb-1">
                      Requirements
                    </h5>
                    <ul className="text-sm text-[var(--text-main)] list-disc list-inside space-y-1">
                      {insights.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.technicalSkills.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide mb-1">
                      Technical Skills Needed
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {insights.technicalSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-[var(--bg-cream)] text-[var(--text-main)] text-xs rounded-[var(--radius-sm)] border border-[var(--text-sub)] border-opacity-20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {insights.keyDeliverables.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide mb-1">
                      Key Deliverables
                    </h5>
                    <ul className="text-sm text-[var(--text-main)] list-disc list-inside space-y-1">
                      {insights.keyDeliverables.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.suggestedApproach && (
                  <div>
                    <h5 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide mb-1">
                      Suggested Approach
                    </h5>
                    <p className="text-sm text-[var(--text-main)]">{insights.suggestedApproach}</p>
                  </div>
                )}

                {insights.potentialChallenges.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide mb-1">
                      Potential Challenges
                    </h5>
                    <ul className="text-sm text-[var(--text-main)] list-disc list-inside space-y-1">
                      {insights.potentialChallenges.map((challenge, i) => (
                        <li key={i}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.successCriteria.length > 0 && (
                  <div>
                    <h5 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide mb-1">
                      Success Criteria
                    </h5>
                    <ul className="text-sm text-[var(--text-main)] list-disc list-inside space-y-1">
                      {insights.successCriteria.map((criterion, i) => (
                        <li key={i}>{criterion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.relevantContext && (
                  <div>
                    <h5 className="text-xs font-bold text-[var(--text-sub)] uppercase tracking-wide mb-1">
                      Relevant Context
                    </h5>
                    <p className="text-sm text-[var(--text-main)]">{insights.relevantContext}</p>
                  </div>
                )}

                <button
                  onClick={() => setShowFullInsights(false)}
                  className="text-sm text-[var(--text-sub)] opacity-60 hover:opacity-100"
                >
                  ← Hide details
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <div className="bg-[var(--accent-pink-light)] border-2 border-[var(--accent-pink)] rounded-[var(--radius-md)] p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">✗</span>
          </div>
          <div>
            <h3 className="text-lg font-bold text-[var(--text-main)]">Research failed</h3>
            <p className="text-sm text-[var(--text-sub)]">
              {researchError || 'An error occurred while researching your task.'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Processing/pending state
  const steps = [
    { key: 'parsing_documents', label: 'Parsing documents' },
    { key: 'researching_web', label: 'Researching the web' },
    { key: 'analyzing', label: 'Analyzing with AI' },
    { key: 'finalizing', label: 'Finalizing' },
  ];

  const currentStepIndex = steps.findIndex((s) => s.key === currentStep);

  // Calculate overall progress percentage
  const docProgress =
    progress && progress.documentsTotal > 0
      ? progress.documentsParsed / progress.documentsTotal
      : 1;
  const queryProgress =
    progress && progress.queriesTotal > 0
      ? progress.queriesCompleted / progress.queriesTotal
      : 0;

  let overallProgress = 0;
  if (currentStep === 'parsing_documents') {
    overallProgress = docProgress * 30;
  } else if (currentStep === 'researching_web') {
    overallProgress = 30 + queryProgress * 30;
  } else if (currentStep === 'analyzing') {
    overallProgress = 70;
  } else if (currentStep === 'finalizing') {
    overallProgress = 95;
  }

  return (
    <div className="bg-[var(--surface-white)] shadow-soft rounded-[var(--radius-md)] p-6 mb-6">
      <h3 className="text-lg font-bold text-[var(--text-main)] mb-4">
        Preparing your task...
      </h3>

      <div className="space-y-3 mb-6">
        {steps.map((step, idx) => {
          const isActive = step.key === currentStep;
          const isComplete = idx < currentStepIndex;

          let stepDetail = '';
          if (step.key === 'parsing_documents' && progress) {
            if (progress.documentsTotal > 0) {
              stepDetail = `(${progress.documentsParsed}/${progress.documentsTotal})`;
            }
          } else if (step.key === 'researching_web' && progress) {
            if (progress.queriesTotal > 0) {
              stepDetail = `(${progress.queriesCompleted}/${progress.queriesTotal})`;
            }
          }

          return (
            <div key={step.key} className="flex items-center gap-3">
              <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                {isComplete ? (
                  <span className="text-[var(--accent-green)] font-bold">✓</span>
                ) : isActive ? (
                  <span className="w-4 h-4 border-2 border-[var(--accent-purple)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-[var(--text-sub)] opacity-30" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive
                    ? 'text-[var(--text-main)] font-bold'
                    : isComplete
                      ? 'text-[var(--text-sub)] opacity-60'
                      : 'text-[var(--text-sub)] opacity-40'
                }`}
              >
                {step.label} {stepDetail}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-[var(--text-sub)] bg-opacity-20 rounded-full h-2">
        <div
          className="bg-[var(--accent-orange)] h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(overallProgress, 100)}%` }}
        />
      </div>
      <p className="text-xs text-[var(--text-sub)] opacity-40 text-right mt-2">
        Live • Updates every 2s
      </p>
    </div>
  );
}
