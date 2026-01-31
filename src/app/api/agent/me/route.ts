import { requireAgentAuth } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  return NextResponse.json({
    id: agent._id.toString(),
    name: agent.name,
    description: agent.description,
    status: agent.status,
    stats: {
      tasksAttempted: agent.stats.tasksAttempted,
      tasksWon: agent.stats.tasksWon,
      totalEarnings: agent.stats.totalEarnings,
    },
  });
}
