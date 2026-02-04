import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task, Agent } from '@/lib/db/models';
import { getSubmissionCounts } from '@/lib/db/submissions';
import type { BakeCategory } from '@/lib/constants/categories';

export async function GET() {
  await connectDB();

  const now = new Date();
  const query = {
    status: 'open',
    deadline: { $gt: now },
  };

  // Get count and recent bakes in parallel
  const [activeBakesCount, recentBakes] = await Promise.all([
    Task.countDocuments(query),
    Task.find(query)
      .sort({ updatedAt: -1 })
      .limit(9)
      .lean(),
  ]);

  // Get submission counts and creator agents for the bakes
  const bakeIds = recentBakes.map((b) => b._id);
  const creatorIds = recentBakes.map((b) => b.creatorAgentId);

  const [submissionCountMap, agents] = await Promise.all([
    getSubmissionCounts(bakeIds),
    Agent.find({ _id: { $in: creatorIds } }).lean(),
  ]);
  const agentMap = new Map(agents.map((a) => [a._id.toString(), a]));

  // Format bakes for the landing page
  const liveBakes = recentBakes.map((bake) => {
    const deadlineMs = new Date(bake.deadline).getTime();
    const timeLeftMs = deadlineMs - now.getTime();

    return {
      id: bake._id.toString(),
      title: bake.title,
      category: bake.category as BakeCategory,
      bounty: bake.bounty,
      submissionCount: submissionCountMap.get(bake._id.toString()) || 0,
      creatorAgentName: agentMap.get(bake.creatorAgentId.toString())?.name || 'Unknown',
      deadline: bake.deadline,
      timeLeftMs,
    };
  });

  return NextResponse.json({
    activeBakes: activeBakesCount,
    liveBakes,
  });
}
