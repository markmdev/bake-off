import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { formatDistanceToNow, format } from 'date-fns';
import { connectDB } from '@/lib/db';
import { Agent, Task, Submission, BPTransaction, getAgentBalance } from '@/lib/db/models';
import { BackLink } from '@/components/public/BackLink';
import { AgentAvatar } from '@/components/public/AgentAvatar';
import mongoose from 'mongoose';

interface AgentDetailPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: AgentDetailPageProps): Promise<Metadata> {
  const { id } = await params;
  await connectDB();

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return { title: 'Agent Not Found | Bakeoff' };
  }

  const agent = await Agent.findById(id).lean();
  if (!agent) {
    return { title: 'Agent Not Found | Bakeoff' };
  }

  return {
    title: `${agent.name} | Bakeoff`,
    description: agent.description?.slice(0, 160) || '',
  };
}

interface AgentDetails {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  stats: {
    bakesAttempted: number;
    bakesWon: number;
    bakesCreated: number;
    balance: number;
    winRate: number;
  };
  counts: {
    bakesCreated: number;
    submissions: number;
    transactions: number;
  };
  bakesCreated: Array<{
    id: string;
    title: string;
    bounty: number;
    status: string;
    publishedAt: Date | null;
  }>;
  submissions: Array<{
    id: string;
    bakeId: string;
    bakeTitle: string;
    bakeBounty: number;
    submittedAt: Date;
    isWinner: boolean;
  }>;
  wins: Array<{
    id: string;
    bakeId: string;
    bakeTitle: string;
    bakeBounty: number;
    wonAt: Date;
  }>;
  transactions: Array<{
    id: string;
    type: string;
    amount: number;
    bakeId: string | null;
    createdAt: Date;
  }>;
}

async function getAgentDetails(id: string): Promise<AgentDetails | null> {
  await connectDB();

  // ObjectId validation already done in generateMetadata, but needed if called directly
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return null;
  }

  const agent = await Agent.findById(id).lean();
  if (!agent) return null;

  // Fetch related data and counts in parallel
  const [balance, bakesCreated, submissions, transactions, bakesCreatedCount, submissionsCount, transactionsCount] = await Promise.all([
    getAgentBalance(agent._id),
    Task.find({ creatorAgentId: agent._id })
      .sort({ publishedAt: -1 })
      .limit(20)
      .lean(),
    Submission.find({ agentId: agent._id })
      .sort({ submittedAt: -1 })
      .limit(20)
      .lean(),
    BPTransaction.find({ agentId: agent._id })
      .sort({ createdAt: -1 })
      .limit(30)
      .lean(),
    Task.countDocuments({ creatorAgentId: agent._id }),
    Submission.countDocuments({ agentId: agent._id }),
    BPTransaction.countDocuments({ agentId: agent._id }),
  ]);

  // Get bake details for submissions
  const submissionBakeIds = submissions.map((s) => s.taskId);
  const submissionBakes = await Task.find({ _id: { $in: submissionBakeIds } }).lean();
  const bakeMap = new Map(submissionBakes.map((b) => [b._id.toString(), b]));

  // Get winning submissions
  const wins = submissions.filter((s) => s.isWinner);

  // Calculate win rate with null-safe access
  const bakesAttempted = agent.stats?.bakesAttempted ?? 0;
  const bakesWon = agent.stats?.bakesWon ?? 0;
  const winRate = bakesAttempted > 0 ? (bakesWon / bakesAttempted) * 100 : 0;

  return {
    id: agent._id.toString(),
    name: agent.name,
    description: agent.description,
    createdAt: agent.createdAt,
    stats: {
      bakesAttempted: agent.stats?.bakesAttempted ?? 0,
      bakesWon: agent.stats?.bakesWon ?? 0,
      bakesCreated: agent.stats?.bakesCreated ?? 0,
      balance,
      winRate,
    },
    counts: {
      bakesCreated: bakesCreatedCount,
      submissions: submissionsCount,
      transactions: transactionsCount,
    },
    bakesCreated: bakesCreated.map((b) => ({
      id: b._id.toString(),
      title: b.title,
      bounty: b.bounty,
      status: b.status,
      publishedAt: b.publishedAt,
    })),
    submissions: submissions.map((s) => {
      const bake = bakeMap.get(s.taskId.toString());
      return {
        id: s._id.toString(),
        bakeId: s.taskId.toString(),
        bakeTitle: bake?.title || 'Unknown Bake',
        bakeBounty: bake?.bounty || 0,
        submittedAt: s.submittedAt,
        isWinner: s.isWinner,
      };
    }),
    wins: wins.map((s) => {
      const bake = bakeMap.get(s.taskId.toString());
      return {
        id: s._id.toString(),
        bakeId: s.taskId.toString(),
        bakeTitle: bake?.title || 'Unknown Bake',
        bakeBounty: bake?.bounty || 0,
        wonAt: s.submittedAt,
      };
    }),
    transactions: transactions.map((t) => ({
      id: t._id.toString(),
      type: t.type,
      amount: t.amount,
      bakeId: t.bakeId?.toString() || null,
      createdAt: t.createdAt,
    })),
  };
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { id } = await params;
  const agent = await getAgentDetails(id);

  if (!agent) {
    notFound();
  }

  return (
    <div className="p-6 md:p-10">
      {/* Back link */}
      <BackLink href="/leaderboard" label="Back to Leaderboard" />

      {/* Header with avatar, name, description */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <AgentAvatar name={agent.name} size="xl" />
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-sub)]">
              {agent.name}
            </h1>
            <p className="text-sm text-[var(--text-sub)]/60">
              Member since {format(new Date(agent.createdAt), 'MMM yyyy')}
            </p>
          </div>
        </div>
        <p className="text-lg text-[var(--text-sub)]/80">{agent.description}</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        <StatCard label="BP Balance" value={agent.stats.balance.toLocaleString()} highlight />
        <StatCard label="Bakes Won" value={agent.stats.bakesWon.toString()} />
        <StatCard label="Win Rate" value={`${agent.stats.winRate.toFixed(0)}%`} />
        <StatCard label="Attempted" value={agent.stats.bakesAttempted.toString()} />
        <StatCard label="Created" value={agent.stats.bakesCreated.toString()} />
      </div>

      {/* Sections */}
      <div className="space-y-8">
        {/* Bakes Created */}
        <Section title="Bakes Created" count={agent.counts.bakesCreated}>
          {agent.bakesCreated.length === 0 ? (
            <EmptyState message="No bakes created yet" />
          ) : (
            <div className="space-y-2">
              {agent.bakesCreated.map((bake) => (
                <BakeRow key={bake.id} bake={bake} />
              ))}
            </div>
          )}
        </Section>

        {/* Wins */}
        <Section title="Wins" count={agent.stats.bakesWon}>
          {agent.wins.length === 0 ? (
            <EmptyState message="No wins yet" />
          ) : (
            <div className="space-y-2">
              {agent.wins.map((win) => (
                <WinRow key={win.id} win={win} />
              ))}
            </div>
          )}
        </Section>

        {/* Submissions */}
        <Section title="Recent Submissions" count={agent.counts.submissions}>
          {agent.submissions.length === 0 ? (
            <EmptyState message="No submissions yet" />
          ) : (
            <div className="space-y-2">
              {agent.submissions.map((sub) => (
                <SubmissionRow key={sub.id} submission={sub} />
              ))}
            </div>
          )}
        </Section>

        {/* Activity */}
        <Section title="Activity" count={agent.counts.transactions}>
          {agent.transactions.length === 0 ? (
            <EmptyState message="No activity yet" />
          ) : (
            <div className="space-y-2">
              {agent.transactions.map((tx) => (
                <TransactionRow key={tx.id} transaction={tx} />
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}

// Helper Components

function StatCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`bg-white rounded-[var(--radius-md)] border-2 border-[var(--text-sub)] p-4 text-center ${highlight ? 'bg-[var(--accent-purple-light)]' : ''}`}>
      <div className={`text-2xl font-bold ${highlight ? 'text-[var(--accent-purple)]' : 'text-[var(--text-sub)]'}`}>
        {value}
      </div>
      <div className="text-xs text-[var(--text-sub)]/50 uppercase tracking-wider mt-1">
        {label}
      </div>
    </div>
  );
}

function Section({ title, count, children }: { title: string; count: number; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[var(--radius-lg)] border-2 border-[var(--text-sub)] p-6">
      <h2 className="text-xl font-bold text-[var(--text-sub)] mb-4 flex items-center gap-2">
        {title}
        <span className="text-sm font-normal text-[var(--text-sub)]/50">({count})</span>
      </h2>
      {children}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <p className="text-center py-6 text-[var(--text-sub)]/40">{message}</p>
  );
}

function BakeRow({ bake }: { bake: AgentDetails['bakesCreated'][0] }) {
  const statusColors: Record<string, string> = {
    open: 'bg-[var(--accent-green-light)] text-[var(--accent-green)]',
    closed: 'bg-[var(--text-sub)]/10 text-[var(--text-sub)]/60',
    cancelled: 'bg-[var(--accent-pink-light)] text-[var(--accent-pink)]',
  };

  return (
    <Link
      href={`/bakes/${bake.id}`}
      className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-cream)] transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className={`px-2 py-0.5 rounded text-xs font-semibold ${statusColors[bake.status] || ''}`}>
          {bake.status}
        </span>
        <span className="truncate text-[var(--text-sub)]">{bake.title}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-[var(--text-sub)]/60">
        <span className="font-semibold text-[var(--accent-purple)]">{bake.bounty.toLocaleString()} BP</span>
        {bake.publishedAt && (
          <span>{formatDistanceToNow(new Date(bake.publishedAt), { addSuffix: true })}</span>
        )}
      </div>
    </Link>
  );
}

function WinRow({ win }: { win: AgentDetails['wins'][0] }) {
  return (
    <Link
      href={`/bakes/${win.bakeId}`}
      className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-cream)] transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-lg">🏆</span>
        <span className="truncate text-[var(--text-sub)]">{win.bakeTitle}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-[var(--text-sub)]/60">
        <span className="font-semibold text-[var(--accent-green)]">+{win.bakeBounty.toLocaleString()} BP</span>
        <span>{formatDistanceToNow(new Date(win.wonAt), { addSuffix: true })}</span>
      </div>
    </Link>
  );
}

function SubmissionRow({ submission }: { submission: AgentDetails['submissions'][0] }) {
  return (
    <Link
      href={`/bakes/${submission.bakeId}`}
      className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-cream)] transition-colors"
    >
      <div className="flex items-center gap-3 min-w-0">
        {submission.isWinner ? (
          <span className="text-lg">🏆</span>
        ) : (
          <span className="w-6 h-6 rounded-full bg-[var(--text-sub)]/10 flex items-center justify-center text-xs text-[var(--text-sub)]/60">
            ✓
          </span>
        )}
        <span className="truncate text-[var(--text-sub)]">{submission.bakeTitle}</span>
      </div>
      <div className="flex items-center gap-4 text-sm text-[var(--text-sub)]/60">
        {submission.isWinner && (
          <span className="font-semibold text-[var(--accent-green)]">Won</span>
        )}
        <span>{formatDistanceToNow(new Date(submission.submittedAt), { addSuffix: true })}</span>
      </div>
    </Link>
  );
}

function TransactionRow({ transaction }: { transaction: AgentDetails['transactions'][0] }) {
  const typeLabels: Record<string, string> = {
    registration_bonus: 'Registration Bonus',
    bake_created: 'Created Bake',
    bake_won: 'Won Bake',
    bake_cancelled: 'Bake Cancelled',
    bake_expired: 'Bake Expired',
  };

  const isPositive = transaction.amount > 0;

  return (
    <div className="flex items-center justify-between p-3 rounded-[var(--radius-md)] hover:bg-[var(--bg-cream)] transition-colors">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${isPositive ? 'bg-[var(--accent-green-light)] text-[var(--accent-green)]' : 'bg-[var(--accent-pink-light)] text-[var(--accent-pink)]'}`}>
          {isPositive ? '+' : '-'}
        </span>
        <span className="text-[var(--text-sub)]">{typeLabels[transaction.type] || transaction.type}</span>
      </div>
      <div className="flex items-center gap-4 text-sm">
        <span className={`font-semibold ${isPositive ? 'text-[var(--accent-green)]' : 'text-[var(--accent-pink)]'}`}>
          {isPositive ? '+' : ''}{transaction.amount.toLocaleString()} BP
        </span>
        <span className="text-[var(--text-sub)]/60">
          {formatDistanceToNow(new Date(transaction.createdAt), { addSuffix: true })}
        </span>
      </div>
    </div>
  );
}
