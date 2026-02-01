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
      <div className="bg-[var(--surface-white)] shadow-soft rounded-[var(--radius-md)] p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)]">Research</h2>
          <span className="px-3 py-1 text-xs font-bold rounded-full border-2 border-[var(--accent-pink)] bg-[var(--accent-pink-light)] text-[var(--accent-pink)]">
            Error
          </span>
        </div>
        <p className="text-sm text-[var(--text-sub)]">
          Failed to fetch research progress. Please refresh the page.
        </p>
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
      <div className="bg-[var(--surface-white)] shadow-soft rounded-[var(--radius-md)] p-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-main)]">Research Findings</h2>
          <div className="flex items-center gap-3">
            {insights && insights.estimatedComplexity && (
              <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 border-[var(--text-sub)] ${complexityColors[insights.estimatedComplexity]}`}>
                {insights.estimatedComplexity.charAt(0).toUpperCase() + insights.estimatedComplexity.slice(1)} complexity
              </span>
            )}
            <span className={`px-3 py-1 text-xs font-bold rounded-full border-2 border-[var(--text-sub)] ${status === 'completed' ? 'bg-[var(--accent-green-light)] text-[var(--accent-green)]' : 'bg-[var(--accent-yellow-light)] text-[var(--accent-yellow)]'}`}>
              {status === 'completed' ? 'Complete' : 'Partial'}
            </span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 pb-6 border-b-2 border-dashed border-[rgba(26,43,60,0.1)]">
          <div>
            <div className="text-sm font-medium text-[var(--text-sub)] opacity-60 mb-1">Documents</div>
            <div className="text-lg font-bold text-[var(--text-main)]">{summary.documentsWithText}</div>
          </div>
          <div>
            <div className="text-sm font-medium text-[var(--text-sub)] opacity-60 mb-1">Sources Found</div>
            <div className="text-lg font-bold text-[var(--text-main)]">{summary.totalResults}</div>
          </div>
          {insights && insights.keyDeliverables && (
            <div>
              <div className="text-sm font-medium text-[var(--text-sub)] opacity-60 mb-1">Deliverables</div>
              <div className="text-lg font-bold text-[var(--text-main)]">{insights.keyDeliverables.length}</div>
            </div>
          )}
          {insights && insights.requirements && (
            <div>
              <div className="text-sm font-medium text-[var(--text-sub)] opacity-60 mb-1">Requirements</div>
              <div className="text-lg font-bold text-[var(--text-main)]">{insights.requirements.length}</div>
            </div>
          )}
        </div>

        {/* AI Summary */}
        {insights && insights.summary && (
          <div className="mb-6">
            <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wide">Summary</h3>
            <p className="text-sm text-[var(--text-main)] leading-relaxed">{insights.summary}</p>
          </div>
        )}

        {/* Expandable details */}
        {insights && (
          <>
            {!showFullInsights ? (
              <button
                onClick={() => setShowFullInsights(true)}
                className="text-sm text-[var(--accent-orange)] hover:underline font-bold"
              >
                View detailed analysis →
              </button>
            ) : (
              <div className="space-y-6 pt-6 border-t-2 border-dashed border-[rgba(26,43,60,0.1)]">
                {insights.requirements.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wide">
                      Requirements
                    </h3>
                    <ul className="text-sm text-[var(--text-main)] space-y-1">
                      {insights.requirements.map((req, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--accent-orange)] mt-1">•</span>
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.keyDeliverables.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wide">
                      Key Deliverables
                    </h3>
                    <ul className="text-sm text-[var(--text-main)] space-y-1">
                      {insights.keyDeliverables.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--accent-green)] mt-1">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.technicalSkills.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wide">
                      Technical Skills
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {insights.technicalSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-[var(--bg-cream)] text-[var(--text-main)] text-xs font-medium rounded-full border border-[var(--text-sub)] border-opacity-20"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {insights.suggestedApproach && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wide">
                      Suggested Approach
                    </h3>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed">{insights.suggestedApproach}</p>
                  </div>
                )}

                {insights.potentialChallenges.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wide">
                      Potential Challenges
                    </h3>
                    <ul className="text-sm text-[var(--text-main)] space-y-1">
                      {insights.potentialChallenges.map((challenge, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--accent-pink)] mt-1">•</span>
                          <span>{challenge}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.successCriteria.length > 0 && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wide">
                      Success Criteria
                    </h3>
                    <ul className="text-sm text-[var(--text-main)] space-y-1">
                      {insights.successCriteria.map((criterion, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="text-[var(--accent-purple)] mt-1">✓</span>
                          <span>{criterion}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.relevantContext && (
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-sub)] mb-2 uppercase tracking-wide">
                      Relevant Context
                    </h3>
                    <p className="text-sm text-[var(--text-main)] leading-relaxed">{insights.relevantContext}</p>
                  </div>
                )}

                <button
                  onClick={() => setShowFullInsights(false)}
                  className="text-sm text-[var(--text-sub)] opacity-60 hover:opacity-100 font-medium"
                >
                  ← Hide details
                </button>
              </div>
            )}
          </>
        )}
      </div>
    );
  }

  // Failed state
  if (status === 'failed') {
    return (
      <div className="bg-[var(--surface-white)] shadow-soft rounded-[var(--radius-md)] p-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[var(--text-main)]">Research</h2>
          <span className="px-3 py-1 text-xs font-bold rounded-full border-2 border-[var(--accent-pink)] bg-[var(--accent-pink-light)] text-[var(--accent-pink)]">
            Failed
          </span>
        </div>
        <p className="text-sm text-[var(--text-sub)]">
          {researchError || 'An error occurred while researching your task.'}
        </p>
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
    <div className="bg-[var(--surface-white)] shadow-soft rounded-[var(--radius-md)] p-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-[var(--text-main)]">Research</h2>
        <span className="px-3 py-1 text-xs font-bold rounded-full border-2 border-[var(--accent-purple)] bg-[var(--accent-purple-light)] text-[var(--accent-purple)] animate-pulse">
          In Progress
        </span>
      </div>

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
                  <span className="w-4 h-4 border-2 border-[var(--accent-orange)] border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-[var(--text-sub)] opacity-30" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive
                    ? 'text-[var(--text-main)] font-bold'
                    : isComplete
                      ? 'text-[var(--text-sub)]'
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
        Updates every 2s
      </p>
    </div>
  );
}
