import { getCurrentUser } from '@/lib/auth';
import { connectDB, mongoose } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const task = await Task.findById(id).lean();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.posterId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  return NextResponse.json(task);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  const { id } = await params;

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid task id' }, { status: 400 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const task = await Task.findById(id);

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.posterId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (task.status !== 'draft') {
    return NextResponse.json(
      { error: 'Can only edit draft tasks' },
      { status: 400 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }
  const { title, description, bounty, deadline, attachments } = body;

  if (title !== undefined) {
    if (typeof title !== 'string') {
      return NextResponse.json(
        { error: 'Title must be a string' },
        { status: 400 }
      );
    }
    if (title.length < 5 || title.length > 100) {
      return NextResponse.json(
        { error: 'Title must be 5-100 characters' },
        { status: 400 }
      );
    }
    task.title = title;
  }

  if (description !== undefined) {
    if (typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Description must be a string' },
        { status: 400 }
      );
    }
    if (description.length < 50) {
      return NextResponse.json(
        { error: 'Description must be at least 50 characters' },
        { status: 400 }
      );
    }
    task.description = description;
  }

  if (bounty !== undefined) {
    if (typeof bounty !== 'number' || !Number.isFinite(bounty)) {
      return NextResponse.json(
        { error: 'Bounty must be a finite number' },
        { status: 400 }
      );
    }
    if (bounty < 500) {
      return NextResponse.json(
        { error: 'Bounty must be at least $5 (500 cents)' },
        { status: 400 }
      );
    }
    task.bounty = bounty;
  }

  if (deadline !== undefined) {
    const deadlineDate = new Date(deadline);
    if (isNaN(deadlineDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid deadline' },
        { status: 400 }
      );
    }
    if (deadlineDate <= new Date()) {
      return NextResponse.json(
        { error: 'Deadline must be in the future' },
        { status: 400 }
      );
    }
    task.deadline = deadlineDate;
  }

  if (attachments !== undefined) {
    if (!Array.isArray(attachments)) {
      return NextResponse.json(
        { error: 'Attachments must be an array' },
        { status: 400 }
      );
    }
    task.attachments = attachments;
  }

  await task.save();

  return NextResponse.json(task);
}
