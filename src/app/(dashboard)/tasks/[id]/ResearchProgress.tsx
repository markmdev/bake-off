'use client';

import { useEffect, useState } from 'react';

interface ResearchProgress {
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
  progress: ResearchProgress | null;
  error: string | null;
  summary: ResearchSummary;
  insights: TaskInsights | null;
}

interface ResearchProgressProps {
  taskId: string;
  initialStatus?: 'pending' | 'processing' | 'completed' | 'failed' | 'partial' | null;
}

const complexityColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export default function ResearchProgress({
  taskId,
  initialStatus,
}: ResearchProgressProps) {
  const [data, setData] = useState<ResearchStatusResponse | null>(null);
  const [isPolling, setIsPolling] = useState(
    initialStatus === 'pending' || initialStatus === 'processing'
  );
  const [showFullInsights, setShowFullInsights] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/tasks/${taskId}/research-status`);
        if (!res.ok || cancelled) return;

        const json: ResearchStatusResponse = await res.json();
        if (cancelled) return;

        setData(json);

        // Stop polling when complete or failed
        if (
          json.status === 'completed' ||
          json.status === 'failed' ||
          json.status === 'partial' ||
          json.status === null
        ) {
          setIsPolling(false);
        }
      } catch (err) {
        console.error('Failed to fetch research status:', err);
      }
    };

    // Initial fetch
    fetchStatus();

    if (!isPolling) return;

    // Poll every 2 seconds
    const interval = setInterval(fetchStatus, 2000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [taskId, isPolling]);

  // Don't render anything if no research data
  if (!data || data.status === null) {
    return null;
  }

  const { status, currentStep, progress, error, summary, insights } = data;

  // Completed state with insights
  if (status === 'completed' || status === 'partial') {
    return (
      <div className="bg-white shadow rounded-lg p-6 mb-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <span className="text-2xl">{status === 'completed' ? '✓' : '⚠'}</span>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {status === 'completed' ? 'Research complete' : 'Research partially complete'}
              </h3>
              <p className="text-sm text-gray-500">
                {summary.documentsWithText} document{summary.documentsWithText !== 1 ? 's' : ''} parsed
                {' • '}
                {summary.totalResults} source{summary.totalResults !== 1 ? 's' : ''} found
              </p>
            </div>
          </div>
          {insights && insights.estimatedComplexity && (
            <span className={`px-2 py-1 text-xs font-medium rounded ${complexityColors[insights.estimatedComplexity]}`}>
              {insights.estimatedComplexity.charAt(0).toUpperCase() + insights.estimatedComplexity.slice(1)} complexity
            </span>
          )}
        </div>

        {/* AI Insights Summary */}
        {insights && insights.summary && (
          <div className="border-t pt-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">AI Analysis</h4>
            <p className="text-sm text-gray-600 mb-3">{insights.summary}</p>

            {!showFullInsights && (
              <button
                onClick={() => setShowFullInsights(true)}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Show full analysis →
              </button>
            )}

            {showFullInsights && (
              <div className="space-y-4 mt-4">
                {insights.requirements.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Requirements
                    </h5>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      {insights.requirements.map((req, i) => (
                        <li key={i}>{req}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.technicalSkills.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Technical Skills Needed
                    </h5>
                    <div className="flex flex-wrap gap-1">
                      {insights.technicalSkills.map((skill, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {insights.keyDeliverables.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Key Deliverables
                    </h5>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      {insights.keyDeliverables.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.suggestedApproach && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Suggested Approach
                    </h5>
                    <p className="text-sm text-gray-600">{insights.suggestedApproach}</p>
                  </div>
                )}

                {insights.potentialChallenges.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Potential Challenges
                    </h5>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      {insights.potentialChallenges.map((challenge, i) => (
                        <li key={i}>{challenge}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.successCriteria.length > 0 && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Success Criteria
                    </h5>
                    <ul className="text-sm text-gray-600 list-disc list-inside space-y-1">
                      {insights.successCriteria.map((criterion, i) => (
                        <li key={i}>{criterion}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {insights.relevantContext && (
                  <div>
                    <h5 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Relevant Context
                    </h5>
                    <p className="text-sm text-gray-600">{insights.relevantContext}</p>
                  </div>
                )}

                <button
                  onClick={() => setShowFullInsights(false)}
                  className="text-sm text-gray-500 hover:text-gray-700"
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
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <span className="text-2xl">✗</span>
          </div>
          <div>
            <h3 className="text-lg font-medium text-red-800">Research failed</h3>
            <p className="text-sm text-red-600">
              {error || 'An error occurred while researching your task.'}
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
    <div className="bg-white shadow rounded-lg p-6 mb-6">
      <h3 className="text-lg font-medium text-gray-900 mb-4">
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
                  <span className="text-green-500 font-bold">✓</span>
                ) : isActive ? (
                  <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span className="w-3 h-3 rounded-full bg-gray-300" />
                )}
              </div>
              <span
                className={`text-sm ${
                  isActive
                    ? 'text-gray-900 font-medium'
                    : isComplete
                      ? 'text-gray-500'
                      : 'text-gray-400'
                }`}
              >
                {step.label} {stepDetail}
              </span>
            </div>
          );
        })}
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${Math.min(overallProgress, 100)}%` }}
        />
      </div>
    </div>
  );
}
