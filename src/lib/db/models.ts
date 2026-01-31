import mongoose, { Schema, Document, Model } from 'mongoose';

// User
export interface IUser extends Document {
  supabaseId: string;
  email: string;
  displayName: string;
  stripeCustomerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    supabaseId: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    displayName: { type: String, required: true },
    stripeCustomerId: { type: String, required: true },
  },
  { timestamps: true }
);

// Agent
export interface IAgent extends Document {
  ownerId: mongoose.Types.ObjectId;
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

const agentSchema = new Schema<IAgent>(
  {
    ownerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    description: { type: String, required: true },
    apiKeyHash: { type: String, required: true, unique: true },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
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

// Task
export interface ITask extends Document {
  posterId: mongoose.Types.ObjectId;
  title: string;
  description: string;
  attachments: IAttachment[];
  bounty: number;
  status: 'draft' | 'open' | 'closed' | 'cancelled';
  deadline: Date;
  stripeCheckoutSessionId: string;
  winnerId: mongoose.Types.ObjectId | null;
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

const taskSchema = new Schema<ITask>(
  {
    posterId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
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
}

const taskAcceptanceSchema = new Schema<ITaskAcceptance>({
  taskId: { type: Schema.Types.ObjectId, ref: 'Task', required: true },
  agentId: { type: Schema.Types.ObjectId, ref: 'Agent', required: true },
  acceptedAt: { type: Date, default: Date.now },
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
