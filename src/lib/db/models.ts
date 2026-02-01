import mongoose, { Schema, Document, Model } from 'mongoose';

// User
export interface IUser extends Document {
  supabaseId: string;
  email: string;
  displayName: string;
  stripeCustomerId: string;
  browniePoints: number;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
    browniePoints: { type: Number, default: 1000 }, // Every user starts with 1000 BP
  },
  { timestamps: true }
);

// Agent
export interface IAgent extends Document {
  ownerId?: mongoose.Types.ObjectId;  // Optional - undefined for self-registered agents
  name: string;
  description: string;
  apiKeyHash: string;
  status: 'active' | 'inactive';
  browniePoints: number;
  stats: {
    tasksAttempted: number;
    tasksWon: number;
    totalEarnings: number; // Legacy, kept for backward compat
  };
  createdAt: Date;
  updatedAt: Date;
}

const agentSchema = new Schema<IAgent>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: false },
    name: { type: String, required: true },
    description: { type: String, required: true },
    apiKeyHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    browniePoints: { type: Number, default: 1000 }, // Agents also start with 1000 BP
    stats: {
      tasksAttempted: { type: Number, default: 0 },
      tasksWon: { type: Number, default: 0 },
      totalEarnings: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

// Note: apiKeyHash unique index is defined in schema field definition

// Attachment (embedded)
interface IAttachment {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

// Research types (embedded)
interface IDocumentExtract {
  filename: string;
  mimeType: string;
  extractedText: string;
  pageCount?: number;
  extractedAt: Date;
  error?: string;
}

interface IWebSearchResult {
  title: string;
  url: string;
  description: string;
  content: string;
}

interface IWebResearch {
  query: string;
  results: IWebSearchResult[];
  searchedAt: Date;
  error?: string;
}

interface IResearchProgress {
  documentsTotal: number;
  documentsParsed: number;
  queriesTotal: number;
  queriesCompleted: number;
}

interface ITaskInsights {
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

interface ITaskResearch {
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'partial';
  currentStep?: 'parsing_documents' | 'researching_web' | 'analyzing' | 'finalizing';
  progress?: IResearchProgress;
  documentExtracts: IDocumentExtract[];
  webResearch: IWebResearch[];
  insights?: ITaskInsights;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

// Re-export category types from shared constants
export type { TaskCategory } from '@/lib/constants/categories';
export { TASK_CATEGORIES, VALID_CATEGORIES } from '@/lib/constants/categories';
import type { TaskCategory } from '@/lib/constants/categories';

// Task
export interface ITask extends Document {
  posterId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: TaskCategory;
  attachments: IAttachment[];
  bounty: number;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  deadline: Date;
  stripeCheckoutSessionId: string;
  winnerId: mongoose.Types.ObjectId | null;
  research?: ITaskResearch;
  publishedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
  },
  { _id: false }
);

const webSearchResultSchema = new Schema<IWebSearchResult>(
  {
    title: { type: String, default: '' },
    url: { type: String, default: '' },
    description: { type: String, default: '' },
    content: { type: String, default: '' },
  },
  { _id: false }
);

const documentExtractSchema = new Schema<IDocumentExtract>(
  {
    filename: { type: String, required: true },
    mimeType: { type: String, required: true },
    extractedText: { type: String, default: '' },
    pageCount: { type: Number },
    extractedAt: { type: Date, default: Date.now },
    error: { type: String },
  },
  { _id: false }
);

const webResearchSchema = new Schema<IWebResearch>(
  {
    query: { type: String, required: true },
    results: { type: [webSearchResultSchema], default: [] },
    searchedAt: { type: Date, default: Date.now },
    error: { type: String },
  },
  { _id: false }
);

const researchProgressSchema = new Schema<IResearchProgress>(
  {
    documentsTotal: { type: Number, default: 0 },
    documentsParsed: { type: Number, default: 0 },
    queriesTotal: { type: Number, default: 0 },
    queriesCompleted: { type: Number, default: 0 },
  },
  { _id: false }
);

const taskInsightsSchema = new Schema<ITaskInsights>(
  {
    summary: { type: String, default: '' },
    requirements: { type: [String], default: [] },
    technicalSkills: { type: [String], default: [] },
    keyDeliverables: { type: [String], default: [] },
    suggestedApproach: { type: String, default: '' },
    estimatedComplexity: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    relevantContext: { type: String, default: '' },
    potentialChallenges: { type: [String], default: [] },
    successCriteria: { type: [String], default: [] },
  },
  { _id: false }
);

const researchSchema = new Schema<ITaskResearch>(
  {
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'partial'],
      default: 'pending',
    },
    currentStep: {
      type: String,
      enum: ['parsing_documents', 'researching_web', 'analyzing', 'finalizing'],
    },
    progress: { type: researchProgressSchema },
    documentExtracts: { type: [documentExtractSchema], default: [] },
    webResearch: { type: [webResearchSchema], default: [] },
    insights: { type: taskInsightsSchema },
    startedAt: { type: Date },
    completedAt: { type: Date },
    error: { type: String },
  },
  { _id: false }
);

const taskSchema = new Schema<ITask>(
  {
    posterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: ['engineering', 'business', 'legal', 'support', 'media', 'research'],
      default: 'engineering',
    },
    attachments: { type: [attachmentSchema], default: [] },
    bounty: { type: Number, required: true, min: 500 }, // Min $5 in cents
    status: {
      type: String,
      enum: ['draft', 'open', 'closed', 'cancelled'],
      default: 'draft',
    },
    deadline: { type: Date, required: true },
    stripeCheckoutSessionId: { type: String, default: '' },
    winnerId: { type: Schema.Types.ObjectId, ref: 'Submission', default: null },
    research: { type: researchSchema },
    publishedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

taskSchema.index({ status: 1, publishedAt: -1 });

// Submission
export interface ISubmission extends Document {
  taskId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  submissionType: 'zip' | 'github' | 'deployed_url';
  submissionUrl: string;
  submittedAt: Date;
  isWinner: boolean;
}

const submissionSchema = new Schema<ISubmission>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  submissionType: {
    type: String,
    enum: ['zip', 'github', 'deployed_url'],
    required: true,
  },
  submissionUrl: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now },
  isWinner: { type: Boolean, default: false },
});

submissionSchema.index({ taskId: 1 });

// TaskAcceptance
export interface ITaskAcceptance extends Document {
  taskId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  acceptedAt: Date;
  plan?: {
    text: string;
    submittedAt: Date;
  };
  progress?: {
    percentage: number;
    message: string;
    updatedAt: Date;
  };
}

const taskAcceptanceSchema = new Schema<ITaskAcceptance>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  acceptedAt: { type: Date, default: Date.now },
  plan: {
    type: {
      text: { type: String, maxlength: 500 },
      submittedAt: { type: Date },
    },
    default: null,
  },
  progress: {
    type: {
      percentage: { type: Number, min: 0, max: 100 },
      message: { type: String, maxlength: 500 },
      updatedAt: { type: Date },
    },
    default: null,
  },
});

taskAcceptanceSchema.index({ taskId: 1, agentId: 1 }, { unique: true });

// Export models
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export const Agent: Model<IAgent> =
  mongoose.models.Agent || mongoose.model<IAgent>('Agent', agentSchema);

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>('Task', taskSchema);

export const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>('Submission', submissionSchema);

export const TaskAcceptance: Model<ITaskAcceptance> =
  mongoose.models.TaskAcceptance ||
  mongoose.model<ITaskAcceptance>('TaskAcceptance', taskAcceptanceSchema);
