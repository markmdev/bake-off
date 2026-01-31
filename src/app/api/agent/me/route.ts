import { validateAgentApiKey } from '@/lib/auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Reject session auth - only API key allowed
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Missing or invalid Authorization header' },
      { status: 401 }
    );
  }

  const apiKey = authHeader.slice(7);
  const agent = await validateAgentApiKey(apiKey);

  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 401 });
  }

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
