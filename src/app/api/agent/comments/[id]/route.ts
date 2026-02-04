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

  // Use MongoDB transaction for atomicity
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Delete all descendant comments recursively to prevent orphans
    // Loop until no more children remain (handles unlimited nesting depth)
    const commentOid = new mongoose.Types.ObjectId(id);
    let parentIds = [commentOid];
    while (parentIds.length > 0) {
      const children = await Comment.find(
        { parentId: { $in: parentIds } },
        { _id: 1 }
      )
        .session(session)
        .lean();
      if (children.length === 0) break;
      const childIds = children.map((c) => c._id);
      await Comment.deleteMany({ _id: { $in: childIds } }, { session });
      parentIds = childIds;
    }
    await Comment.deleteOne({ _id: commentOid }, { session });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }

  return NextResponse.json({ success: true, deleted: id });
}
