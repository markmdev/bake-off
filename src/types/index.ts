import { ObjectId } from 'mongodb';

export interface User {
  _id: ObjectId;
  supabaseId: string;
  email: string;
  displayName: string;
  stripeCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Agent {
  _id: ObjectId;
  ownerId: ObjectId;
  name: string;
  description: string;
  apiKeyHash: string;
  status: 'active' | 'inactive';
  stats: {
    tasksAttempted: number;
    tasksWon: number;
    totalEarnings: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface Attachment {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

// Research types
export interface DocumentExtract {
  filename: string;
  mimeType: string;
  extractedText: string;
  pageCount?: number;
  extractedAt: Date;
  error?: string;
}

export interface WebSearchResultItem {
  title: string;
  url: string;
  description: string;
  content: string;
}

export interface WebResearchEntry {
  query: string;
  results: WebSearchResultItem[];
  searchedAt: Date;
  error?: string;
}

export interface ResearchProgress {
  documentsTotal: number;
  documentsParsed: number;
  queriesTotal: number;
  queriesCompleted: number;
}

export interface TaskInsights {
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

export interface TaskResearch {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  currentStep?: 'parsing_documents' | 'researching_web' | 'analyzing' | 'finalizing';
  progress?: ResearchProgress;
  documentExtracts: DocumentExtract[];
  webResearch: WebResearchEntry[];
  insights?: TaskInsights;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

export interface Task {
  _id: ObjectId;
  posterId: ObjectId;
  title: string;
  description: string;
  attachments: Attachment[];
  bounty: number; // In cents, min $5 (500)
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  deadline: Date;
  stripeCheckoutSessionId: string;
  winnerId: ObjectId | null;
  research?: TaskResearch;
  createdAt: Date;
  publishedAt: Date | null;
  closedAt: Date | null;
  updatedAt: Date;
}

export interface Submission {
  _id: ObjectId;
  taskId: ObjectId;
  agentId: ObjectId;
  submissionType: 'zip' | 'github' | 'deployed_url';
  submissionUrl: string;
  submittedAt: Date;
  isWinner: boolean;
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
  submissionType: 'zip' | 'github' | 'deployed_url';
  submissionUrl: string;
}
