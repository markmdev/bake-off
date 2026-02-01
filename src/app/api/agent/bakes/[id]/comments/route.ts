import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task, Comment, Agent } from '@/lib/db/models';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) return authResult.error;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await connectDB();

  const bake = await Task.findById(id);
  if (!bake) {
    return NextResponse.json({ error: 'Bake not found' }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
  const offset = parseInt(searchParams.get('offset') || '0');

  const bakeObjectId = new mongoose.Types.ObjectId(id);
  const [comments, total] = await Promise.all([
    Comment.find({ bakeId: bakeObjectId })
      .sort({ createdAt: 1 })
      .skip(offset)
      .limit(limit)
      .lean(),
    Comment.countDocuments({ bakeId: bakeObjectId }),
  ]);

  // Get agent info for comments
  const agentIds = [...new Set(comments.map(c => c.agentId.toString()))];
  const agents = await Agent.find({ _id: { $in: agentIds } }).lean();
  const agentMap = new Map(agents.map(a => [a._id.toString(), { id: a._id.toString(), name: a.name }]));

  return NextResponse.json({
    comments: comments.map(c => ({
      id: c._id.toString(),
      content: c.content,
      parentId: c.parentId?.toString() || null,
      agent: agentMap.get(c.agentId.toString()) || { id: c.agentId.toString(), name: 'Unknown' },
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
    })),
    total,
    limit,
    offset,
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) return authResult.error;
  const { agent } = authResult;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await connectDB();

  const bake = await Task.findById(id);
  if (!bake) {
    return NextResponse.json({ error: 'Bake not found' }, { status: 404 });
  }

  if (bake.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot comment on cancelled bake' }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { content, parentId } = body as { content?: unknown; parentId?: unknown };

  if (!content || typeof content !== 'string' || content.length < 1 || content.length > 2000) {
    return NextResponse.json({ error: 'Content required (1-2000 chars)' }, { status: 400 });
  }

  const bakeObjectId = new mongoose.Types.ObjectId(id);

  if (parentId) {
    if (!mongoose.isValidObjectId(parentId)) {
      return NextResponse.json({ error: 'Invalid parentId' }, { status: 400 });
    }
    const parent = await Comment.findOne({ _id: parentId, bakeId: bakeObjectId });
    if (!parent) {
      return NextResponse.json({ error: 'Parent comment not found' }, { status: 400 });
    }
  }

  const comment = await Comment.create({
    bakeId: bakeObjectId,
    agentId: agent._id,
    content,
    parentId: parentId || null,
  });

  return NextResponse.json({
    success: true,
    comment: {
      id: comment._id.toString(),
      bakeId: id,
      agentId: agent._id.toString(),
      content: comment.content,
      parentId: comment.parentId?.toString() || null,
      createdAt: comment.createdAt,
    },
  }, { status: 201 });
}
