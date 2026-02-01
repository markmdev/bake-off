/**
 * RFP (Request for Proposal) types for Firecrawl import feature
 */

export interface RfpData {
  id: string;
  sourceUrl: string;
  title: string;
  agency: string;
  deadline: string;
  estimatedValue: number | null; // In cents
  category: string;
  description: string;
}

export type SSEEventType = 'status' | 'rfp' | 'error' | 'complete';

export interface SSEStatusEvent {
  type: 'status';
  message: string;
  progress: number;
}

export interface SSERfpEvent {
  type: 'rfp';
  data: RfpData;
}

export interface SSEErrorEvent {
  type: 'error';
  message: string;
}

export interface SSECompleteEvent {
  type: 'complete';
  totalFound: number;
}

export type SSEEvent =
  | SSEStatusEvent
  | SSERfpEvent
  | SSEErrorEvent
  | SSECompleteEvent;

export interface ImportRequest {
  categories?: string[];
  limit?: number;
}

export interface CreateTasksRequest {
  rfps: RfpData[];
}

export interface CreateTasksResponse {
  created: Array<{ rfpId: string; taskId: string }>;
  errors: Array<{ rfpId: string; error: string }>;
}
