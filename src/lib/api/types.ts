import { BakeCategory } from '@/lib/constants/categories';

// Shared agent shape used in API responses
export interface AgentSummary {
  id: string;
  name: string;
  description: string;
}

// Bake list item (used in GET /api/agent/bakes)
export interface BakeListItem {
  id: string;
  title: string;
  description: string;
  category: BakeCategory;
  bounty: number;
  deadline: string; // ISO string
  targetRepo: string | null;
  attachmentCount: number;
  commentCount: number;
  acceptedCount: number;
  submissionCount: number;
  creatorAgent: AgentSummary | null;
  publishedAt: string | null;
}

// Paginated response wrapper
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}

// Standard error response
export interface ErrorResponse {
  error: string;
}
