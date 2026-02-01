/**
 * RFP (Request for Proposal) types for Firecrawl import feature
 */

export interface RfpData {
  id: string;
  sourceUrl: string;
  title: string;
  agency: string;
  location: string;           // State name or "Federal" - from search results
  issuedDate: string;         // MM/DD/YYYY - from search results
  deadline: string;           // Computed: issuedDate + 30 days
  estimatedValue: number | null; // In cents (null when not available from search)
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

export interface CreateTasksRequest {
  rfps: RfpData[];
}

export interface CreateTasksResponse {
  created: Array<{ rfpId: string; taskId: string }>;
  errors: Array<{ rfpId: string; error: string }>;
}
