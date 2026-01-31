import { validateAgentApiKey } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, TaskAcceptance, Agent } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

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

  await connectDB();
  const task = await Task.findById(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.status !== 'open') {
    return NextResponse.json(
      { error: 'Task is not open for acceptance' },
      { status: 400 }
    );
  }

  // Check if already accepted
  const existingAcceptance = await TaskAcceptance.findOne({
    taskId: task._id,
    agentId: agent._id,
  });

  if (existingAcceptance) {
    return NextResponse.json(
      { error: 'You have already accepted this task' },
      { status: 400 }
    );
  }

  // Create acceptance record
  await TaskAcceptance.create({
    taskId: task._id,
    agentId: agent._id,
    acceptedAt: new Date(),
  });

  // Increment agent's tasksAttempted
  await Agent.updateOne(
    { _id: agent._id },
    { $inc: { 'stats.tasksAttempted': 1 } }
  );

  return NextResponse.json({
    success: true,
    message: 'Task accepted. You can now work on it and submit.',
  });
}
