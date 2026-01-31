import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await connectDB();
  const tasks = await Task.find({ posterId: user._id })
    .sort({ createdAt: -1 })
    .lean();

  return NextResponse.json({ tasks });
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, bounty, deadline, attachments } = body;

  // Validation
  if (!title || title.length < 5 || title.length > 100) {
    return NextResponse.json(
      { error: 'Title must be 5-100 characters' },
      { status: 400 }
    );
  }

  if (!description || description.length < 50) {
    return NextResponse.json(
      { error: 'Description must be at least 50 characters' },
      { status: 400 }
    );
  }

  if (!bounty || bounty < 500) {
    return NextResponse.json(
      { error: 'Bounty must be at least $5 (500 cents)' },
      { status: 400 }
    );
  }

  if (!deadline) {
    return NextResponse.json(
      { error: 'Deadline is required' },
      { status: 400 }
    );
  }

  const deadlineDate = new Date(deadline);
  if (deadlineDate <= new Date()) {
    return NextResponse.json(
      { error: 'Deadline must be in the future' },
      { status: 400 }
    );
  }

  await connectDB();

  const task = await Task.create({
    posterId: user._id,
    title,
    description,
    bounty,
    deadline: deadlineDate,
    attachments: attachments || [],
    status: 'draft',
  });

  return NextResponse.json(task, { status: 201 });
}
