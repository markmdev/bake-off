'use client';

import { useEffect, useReducer, useRef, useCallback } from 'react';
import { Panel } from '@/components/ui/Panel';
import { RfpProgressBar } from './RfpProgressBar';
import { RfpCard } from './RfpCard';
import { Button } from '@/components/ui';
import type { RfpData, SSEEvent } from '@/types/rfp';

interface RfpImportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (taskIds: string[]) => void;
}

type ImportStatus = 'idle' | 'scanning' | 'complete' | 'error' | 'importing';

interface ImportState {
  status: ImportStatus;
  progress: number;
  message: string;
  rfps: RfpData[];
  selectedIds: Set<string>;
  error: string | null;
}

type ImportAction =
  | { type: 'START_SCAN' }
  | { type: 'UPDATE_STATUS'; progress: number; message: string }
  | { type: 'ADD_RFP'; rfp: RfpData }
  | { type: 'COMPLETE'; totalFound: number }
  | { type: 'ERROR'; message: string }
  | { type: 'TOGGLE_SELECTION'; id: string }
  | { type: 'SELECT_ALL' }
  | { type: 'DESELECT_ALL' }
  | { type: 'START_IMPORT' }
  | { type: 'IMPORT_COMPLETE' }
  | { type: 'RESET' };

const initialState: ImportState = {
  status: 'idle',
  progress: 0,
  message: '',
  rfps: [],
  selectedIds: new Set(),
  error: null,
};

function importReducer(state: ImportState, action: ImportAction): ImportState {
  switch (action.type) {
    case 'START_SCAN':
      return {
        ...initialState,
        status: 'scanning',
        message: 'Starting scan...',
      };
    case 'UPDATE_STATUS':
      return {
        ...state,
        progress: action.progress,
        message: action.message,
      };
    case 'ADD_RFP':
      return {
        ...state,
        rfps: [...state.rfps, action.rfp],
      };
    case 'COMPLETE':
      return {
        ...state,
        status: 'complete',
        progress: 100,
        message: `Found ${action.totalFound} AI-compatible RFPs`,
      };
    case 'ERROR':
      return {
        ...state,
        status: 'error',
        error: action.message,
      };
    case 'TOGGLE_SELECTION': {
      const newSelected = new Set(state.selectedIds);
      if (newSelected.has(action.id)) {
        newSelected.delete(action.id);
      } else {
        newSelected.add(action.id);
      }
      return { ...state, selectedIds: newSelected };
    }
    case 'SELECT_ALL':
      return {
        ...state,
        selectedIds: new Set(state.rfps.map(r => r.id)),
      };
    case 'DESELECT_ALL':
      return { ...state, selectedIds: new Set() };
    case 'START_IMPORT':
      return { ...state, status: 'importing' };
    case 'IMPORT_COMPLETE':
      return { ...state, status: 'complete' };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

export function RfpImportPanel({
  isOpen,
  onClose,
  onImportComplete,
}: RfpImportPanelProps) {
  const [state, dispatch] = useReducer(importReducer, initialState);
  const abortControllerRef = useRef<AbortController | null>(null);
  const hasStartedRef = useRef(false);

  const handleSSEEvent = (event: SSEEvent) => {
    switch (event.type) {
      case 'status':
        dispatch({
          type: 'UPDATE_STATUS',
          progress: event.progress,
          message: event.message,
        });
        break;
      case 'rfp':
        dispatch({ type: 'ADD_RFP', rfp: event.data });
        break;
      case 'complete':
        dispatch({ type: 'COMPLETE', totalFound: event.totalFound });
        break;
      case 'error':
        dispatch({ type: 'ERROR', message: event.message });
        break;
    }
  };

  const startScan = useCallback(async () => {
    dispatch({ type: 'START_SCAN' });
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/rfp/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ limit: 20 }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to start import');
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event: SSEEvent = JSON.parse(line.slice(6));
              handleSSEEvent(event);
            } catch {
              // Skip malformed events
            }
          }
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        dispatch({ type: 'ERROR', message: 'Connection lost. Try again?' });
      }
    }
  }, []);

  // Auto-start scan when panel opens
  useEffect(() => {
    if (isOpen && state.status === 'idle' && !hasStartedRef.current) {
      hasStartedRef.current = true;
      startScan();
    }

    if (!isOpen) {
      hasStartedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      dispatch({ type: 'RESET' });
    }
  }, [isOpen, state.status, startScan]);

  const handleImport = async () => {
    if (state.selectedIds.size === 0) return;

    dispatch({ type: 'START_IMPORT' });

    const selectedRfps = state.rfps.filter(r => state.selectedIds.has(r.id));

    try {
      const response = await fetch('/api/rfp/create-tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rfps: selectedRfps }),
      });

      if (!response.ok) {
        const error = await response.json();
        dispatch({ type: 'ERROR', message: error.error || 'Failed to import RFPs' });
        return;
      }

      const result = await response.json();

      if (result.created && result.created.length > 0) {
        onImportComplete(result.created.map((c: { taskId: string }) => c.taskId));
      }

      dispatch({ type: 'IMPORT_COMPLETE' });
      onClose();
    } catch (error) {
      dispatch({ type: 'ERROR', message: 'Failed to import RFPs' });
    }
  };

  const handleRetry = () => {
    dispatch({ type: 'RESET' });
    hasStartedRef.current = false;
  };

  return (
    <Panel isOpen={isOpen} onClose={onClose} title="🔥 Import RFPs" width={440}>
      <div className="flex flex-col h-full">
        {/* Progress bar (when scanning) */}
        {(state.status === 'scanning' || state.status === 'complete') && (
          <RfpProgressBar progress={state.progress} message={state.message} />
        )}

        {/* Error state */}
        {state.status === 'error' && (
          <div className="p-4 bg-red-50 border-b border-red-200">
            <p className="text-sm text-red-700 font-medium">{state.error}</p>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={handleRetry}
            >
              Try Again
            </Button>
          </div>
        )}

        {/* RFP list */}
        <div className="flex-1 overflow-y-auto">
          {state.rfps.length === 0 && state.status === 'scanning' && (
            <div className="p-8 text-center text-[var(--text-sub)]">
              <div className="animate-pulse">Scanning for RFPs...</div>
            </div>
          )}

          {state.rfps.length === 0 && state.status === 'complete' && (
            <div className="p-8 text-center text-[var(--text-sub)]">
              <p className="font-medium">No AI-compatible RFPs found</p>
              <p className="text-sm mt-2">Try again later or create your own task</p>
            </div>
          )}

          {state.rfps.map((rfp, index) => (
            <RfpCard
              key={rfp.id}
              rfp={rfp}
              isSelected={state.selectedIds.has(rfp.id)}
              onSelect={() => dispatch({ type: 'TOGGLE_SELECTION', id: rfp.id })}
              index={index}
            />
          ))}
        </div>

        {/* Footer */}
        {state.rfps.length > 0 && (
          <div className="p-4 border-t border-[var(--text-sub)] bg-white">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-[var(--text-sub)]">
                {state.selectedIds.size} of {state.rfps.length} selected
              </span>
              <div className="flex gap-2">
                <button
                  className="text-sm text-[var(--accent-orange)] hover:underline"
                  onClick={() => dispatch({ type: 'SELECT_ALL' })}
                >
                  Select all
                </button>
                <span className="text-[var(--text-sub)]">|</span>
                <button
                  className="text-sm text-[var(--text-sub)] hover:underline"
                  onClick={() => dispatch({ type: 'DESELECT_ALL' })}
                >
                  Clear
                </button>
              </div>
            </div>
            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={handleImport}
              disabled={state.selectedIds.size === 0 || state.status === 'importing'}
            >
              {state.status === 'importing'
                ? 'Importing...'
                : `Import ${state.selectedIds.size} as Bakes`}
            </Button>
          </div>
        )}
      </div>
    </Panel>
  );
}
