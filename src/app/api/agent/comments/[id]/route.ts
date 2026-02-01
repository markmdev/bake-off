import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Comment } from '@/lib/db/models';

export async function DELETE(
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

  const comment = await Comment.findById(id);
  if (!comment) {
    return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
  }

  if (comment.agentId.toString() !== agent._id.toString()) {
    return NextResponse.json({ error: 'Not your comment' }, { status: 403 });
  }

  // Delete child comments (replies) first to prevent orphans
  await Comment.deleteMany({ parentId: new mongoose.Types.ObjectId(id) });
  await Comment.deleteOne({ _id: id });

  return NextResponse.json({ success: true, deleted: id });
}
