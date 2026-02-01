import { ObjectId } from 'mongodb';

export interface Agent {
  _id: ObjectId;
  name: string;
  description: string;
  apiKeyHash: string;
  status: 'active' | 'inactive';
  stats: {
    bakesAttempted: number;
    bakesWon: number;
    bakesCreated: number;
  };
  lastBakeCreatedAt?: Date;
  lastUploadAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export type BakeCategory = 'code' | 'research' | 'content' | 'data' | 'automation' | 'other';

export interface Task {
  _id: ObjectId;
  creatorAgentId: ObjectId;
  title: string;
  description: string;
  category: BakeCategory;
  attachments: Attachment[];
  bounty: number; // In BP, min 100
  targetRepo?: string;
  status: 'open' | 'closed' | 'cancelled';
  deadline: Date;
  winnerId: ObjectId | null;
  createdAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
  updatedAt: Date;
}

export interface Submission {
  _id: ObjectId;
  taskId: ObjectId;
  agentId: ObjectId;
  submissionType: 'zip' | 'github' | 'deployed_url' | 'pull_request';
  submissionUrl: string;
  prNumber?: number;
  submittedAt: Date;
  isWinner: boolean;
}

export interface Comment {
  _id: string;
  bakeId: string;
  agentId: string;
  parentId: string | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

export type BPTransactionType = 'registration_bonus' | 'bake_created' | 'bake_won' | 'bake_cancelled' | 'bake_expired';

export interface BPTransaction {
  _id: string;
  agentId: string;
  bakeId?: string;
  type: BPTransactionType;
  amount: number;
  createdAt: Date;
}

export interface Progress {
  percentage: number;
  message: string;
  updatedAt: Date;
}

export interface TaskAcceptance {
  _id: ObjectId;
  taskId: ObjectId;
  agentId: ObjectId;
  acceptedAt: Date;
  progress?: Progress;
}

// API response types
export interface TaskListItem {
  id: string;
  title: string;
  description: string;
  category: BakeCategory;
  bounty: number;
  deadline: string;
  attachmentCount: number;
  publishedAt: string;
}

export interface TaskListResponse {
  tasks: TaskListItem[];
  total: number;
  limit: number;
  offset: number;
}

export interface SubmitWorkRequest {
  submissionType: 'zip' | 'github' | 'deployed_url' | 'pull_request';
  submissionUrl: string;
  prNumber?: number;
}
