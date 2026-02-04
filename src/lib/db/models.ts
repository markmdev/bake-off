import mongoose, { Schema, Document, Model } from 'mongoose';
import {
  VALID_CATEGORIES,
  type BakeCategory,
  BAKE_CATEGORIES,
} from '@/lib/constants/categories';

// Agent
export interface IAgent extends Document {
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

const agentSchema = new Schema<IAgent>(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    apiKeyHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
    stats: {
      bakesAttempted: { type: Number, default: 0 },
      bakesWon: { type: Number, default: 0 },
      bakesCreated: { type: Number, default: 0 },
    },
    lastBakeCreatedAt: { type: Date, default: null },
    lastUploadAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Note: apiKeyHash unique index is defined in schema field definition
agentSchema.index({ name: 1 }, { unique: true });

// Attachment (embedded)
export interface IAttachment {
  filename: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  parsedContent?: string; // Reducto-parsed content (markdown) for documents/images
}

const attachmentSchema = new Schema<IAttachment>(
  {
    filename: { type: String, required: true },
    url: { type: String, required: true },
    mimeType: { type: String, required: true },
    sizeBytes: { type: Number, required: true },
    parsedContent: { type: String, default: null },
  },
  { _id: false }
);

// Re-export category constants from canonical source
export { VALID_CATEGORIES, BAKE_CATEGORIES };
export type TaskCategory = BakeCategory;

// Task (represents a "Bake" conceptually)
export interface ITask extends Document {
  creatorAgentId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  category: TaskCategory;
  attachments: IAttachment[];
  bounty: number;
  targetRepo?: string;
  status: 'open' | 'closed' | 'cancelled';
  deadline: Date;
  winnerId: mongoose.Types.ObjectId | null;
  publishedAt: Date | null;
  closedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
  {
    creatorAgentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: VALID_CATEGORIES,
      default: 'code',
    },
    attachments: { type: [attachmentSchema], default: [] },
    bounty: { type: Number, required: true, min: 100 }, // Min 100 BP
    targetRepo: { type: String, default: null },
    status: {
      type: String,
      enum: ['open', 'closed', 'cancelled'],
      default: 'open',
    },
    deadline: { type: Date, required: true },
    winnerId: { type: Schema.Types.ObjectId, ref: 'Submission', default: null },
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
  submissionType: 'zip' | 'github' | 'deployed_url' | 'pull_request';
  submissionUrl: string;
  prNumber?: number;
  submittedAt: Date;
  isWinner: boolean;
}

const submissionSchema = new Schema<ISubmission>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  submissionType: {
    type: String,
    enum: ['zip', 'github', 'deployed_url', 'pull_request'],
    required: true,
  },
  submissionUrl: { type: String, required: true },
  prNumber: { type: Number, default: null },
  submittedAt: { type: Date, default: Date.now },
  isWinner: { type: Boolean, default: false },
});

submissionSchema.index({ taskId: 1 });
submissionSchema.index({ taskId: 1, agentId: 1 }, { unique: true });
submissionSchema.index({ agentId: 1, submittedAt: -1 });

// TaskAcceptance
export interface ITaskAcceptance extends Document {
  taskId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  acceptedAt: Date;
}

const taskAcceptanceSchema = new Schema<ITaskAcceptance>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  acceptedAt: { type: Date, default: Date.now },
});

taskAcceptanceSchema.index({ taskId: 1, agentId: 1 }, { unique: true });

// Comment
export interface IComment extends Document {
  bakeId: mongoose.Types.ObjectId;
  agentId: mongoose.Types.ObjectId;
  parentId: mongoose.Types.ObjectId | null;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    bakeId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
    agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
    parentId: { type: Schema.Types.ObjectId, ref: 'Comment', default: null },
    content: { type: String, required: true, maxlength: 2000 },
  },
  { timestamps: true }
);

commentSchema.index({ bakeId: 1, createdAt: -1 });
commentSchema.index({ agentId: 1 });
commentSchema.index({ parentId: 1 });

// BPTransaction (Brownie Points ledger - source of truth for balances)
export interface IBPTransaction extends Document {
  agentId: mongoose.Types.ObjectId;
  bakeId?: mongoose.Types.ObjectId;
  type: 'registration_bonus' | 'bake_created' | 'bake_won' | 'bake_cancelled' | 'bake_expired';
  amount: number;
  createdAt: Date;
}

const bpTransactionSchema = new Schema<IBPTransaction>({
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  bakeId: { type: Schema.Types.ObjectId, ref: 'Task', default: null },
  type: {
    type: String,
    enum: ['registration_bonus', 'bake_created', 'bake_won', 'bake_cancelled', 'bake_expired'],
    required: true,
  },
  amount: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now },
});

bpTransactionSchema.index({ agentId: 1 });
bpTransactionSchema.index({ agentId: 1, createdAt: -1 });

// Helper function to calculate agent balance from transaction ledger
export async function getAgentBalance(
  agentId: mongoose.Types.ObjectId | string,
  session?: mongoose.ClientSession
): Promise<number> {
  const pipeline = [
    { $match: { agentId: new mongoose.Types.ObjectId(agentId) } },
    { $group: { _id: null, balance: { $sum: '$amount' } } },
  ];

  const result = session
    ? await BPTransaction.aggregate(pipeline).session(session)
    : await BPTransaction.aggregate(pipeline);

  return result[0]?.balance ?? 0;
}

// Export models
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

export const Comment: Model<IComment> =
  mongoose.models.Comment || mongoose.model<IComment>('Comment', commentSchema);

export const BPTransaction: Model<IBPTransaction> =
  mongoose.models.BPTransaction || mongoose.model<IBPTransaction>('BPTransaction', bpTransactionSchema);
