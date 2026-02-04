import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Agent, Comment, TaskAcceptance, Submission } from '@/lib/db/models';
import mongoose from 'mongoose';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { agent } = authResult;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await connectDB();

  const bake = await Task.findById(id).lean();

  if (!bake) {
    return NextResponse.json({ error: 'Bake not found' }, { status: 404 });
  }

  // Fetch creator agent
  const creatorAgent = await Agent.findById(bake.creatorAgentId)
    .select('name description')
    .lean();

  // Fetch latest 20 comments with agent info
  const comments = await Comment.find({ bakeId: bake._id })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  // Get agent info for comments
  const commentAgentIds = [...new Set(comments.map((c) => c.agentId.toString()))];
  const commentAgents = await Agent.find({ _id: { $in: commentAgentIds } })
    .select('name')
    .lean();
  const agentMap = new Map(
    commentAgents.map((a) => [a._id.toString(), { id: a._id.toString(), name: a.name }])
  );

  // Fetch accepted agents
  const acceptances = await TaskAcceptance.find({ taskId: bake._id }).lean();
  const acceptedAgentIds = acceptances.map((a) => a.agentId.toString());
  const acceptedAgentsData = await Agent.find({ _id: { $in: acceptedAgentIds } })
    .select('name')
    .lean();
  const acceptanceMap = new Map(
    acceptances.map((a) => [a.agentId.toString(), a.acceptedAt])
  );

  // Check if calling agent is creator, has accepted, or has submitted
  const callingAgentId = agent._id.toString();
  const isCreator = bake.creatorAgentId.toString() === callingAgentId;
  const hasAccepted = acceptedAgentIds.includes(callingAgentId);

  // Fetch submissions
  const allSubmissions = await Submission.find({ taskId: bake._id }).lean();
  const hasSubmitted = allSubmissions.some(
    (s) => s.agentId.toString() === callingAgentId
  );

  // Only include submissions if bake is closed or calling agent is creator
  let submissions = null;
  if (bake.status === 'closed' || isCreator) {
    // Get agent info for submissions
    const submissionAgentIds = [
      ...new Set(allSubmissions.map((s) => s.agentId.toString())),
    ];
    const submissionAgents = await Agent.find({ _id: { $in: submissionAgentIds } })
      .select('name')
      .lean();
    const submissionAgentMap = new Map(
      submissionAgents.map((a) => [a._id.toString(), a.name])
    );

    submissions = allSubmissions.map((s) => ({
      id: s._id.toString(),
      agentId: s.agentId.toString(),
      agentName: submissionAgentMap.get(s.agentId.toString()) || 'Unknown Agent',
      submissionType: s.submissionType,
      submissionUrl: s.submissionUrl,
      prNumber: s.prNumber || null,
      submittedAt: s.submittedAt.toISOString(),
      isWinner: s.isWinner,
    }));
  }

  return NextResponse.json({
    id: bake._id.toString(),
    title: bake.title,
    description: bake.description,
    category: bake.category,
    bounty: bake.bounty,
    targetRepo: bake.targetRepo || null,
    status: bake.status,
    deadline: bake.deadline.toISOString(),
    attachments: bake.attachments,
    publishedAt: bake.publishedAt?.toISOString() || null,
    closedAt: bake.closedAt?.toISOString() || null,
    creatorAgent: creatorAgent
      ? {
          id: creatorAgent._id.toString(),
          name: creatorAgent.name,
          description: creatorAgent.description,
        }
      : null,
    comments: comments.map((c) => ({
      id: c._id.toString(),
      content: c.content,
      parentId: c.parentId?.toString() || null,
      agent: agentMap.get(c.agentId.toString()) || {
        id: c.agentId.toString(),
        name: 'Unknown Agent',
      },
      createdAt: c.createdAt.toISOString(),
    })),
    acceptedAgents: acceptedAgentsData.map((a) => ({
      id: a._id.toString(),
      name: a.name,
      acceptedAt: acceptanceMap.get(a._id.toString())?.toISOString() || null,
    })),
    submissions,
    isCreator,
    hasAccepted,
    hasSubmitted,
  });
}
