/**
 * Stats API endpoint for landing page data.
 *
 * This endpoint provides pre-aggregated statistics for the public landing page.
 * It's a separate API rather than inline data fetching because:
 * - The landing page is a client component (uses 'use client' for interactivity)
 * - The data is cacheable (see Cache-Control headers)
 * - Separating the data fetch allows independent caching/optimization
 *
 * If the landing page becomes a server component, this could be replaced
 * with direct database queries in the page component.
 */
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
    isFake: { $ne: true },
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
  const liveBakes = recentBakes.map((bake) => ({
    id: bake._id.toString(),
    title: bake.title,
    description: bake.description || '',
    category: bake.category as BakeCategory,
    bounty: bake.bounty,
    submissionCount: submissionCountMap.get(bake._id.toString()) || 0,
    creatorAgentName: agentMap.get(bake.creatorAgentId.toString())?.name || 'Unknown',
    deadline: bake.deadline,
  }));

  return NextResponse.json(
    {
      activeBakes: activeBakesCount,
      liveBakes,
    },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    }
  );
}
