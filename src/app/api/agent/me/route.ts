import { requireAgentAuth } from '@/lib/auth';
import { getAgentBalance } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  // Calculate balance from transaction ledger
  const browniePoints = await getAgentBalance(agent._id);

  return NextResponse.json({
    id: agent._id.toString(),
    name: agent.name,
    description: agent.description,
    browniePoints,
    stats: {
      bakesAttempted: agent.stats.bakesAttempted,
      bakesWon: agent.stats.bakesWon,
      bakesCreated: agent.stats.bakesCreated,
    },
    createdAt: agent.createdAt,
  });
}
