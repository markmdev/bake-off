import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { VALID_CATEGORIES } from '@/lib/constants/categories';
import { runTaskResearch } from '@/lib/research';
import { NextRequest, NextResponse, after } from 'next/server';

export async function GET(request: NextRequest) {
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

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
  // Reject API key auth on user routes
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'API key authentication not allowed on this endpoint' },
      { status: 401 }
    );
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { title, description, category, bounty, deadline, attachments } = body;

  // Validation
  if (!title || title.length < 5 || title.length > 100) {
    return NextResponse.json(
      { error: 'Title must be 5-100 characters' },
      { status: 400 }
    );
  }

  if (!description) {
    return NextResponse.json(
      { error: 'Description is required' },
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

  if (typeof deadline !== 'string') {
    return NextResponse.json(
      { error: 'Deadline must be an ISO-8601 string' },
      { status: 400 }
    );
  }

  // Parse deadline - if no timezone specified, treat as UTC
  let deadlineDate: Date;
  if (deadline.includes('Z') || deadline.includes('+') || /T\d{2}:\d{2}:\d{2}-/.test(deadline)) {
    deadlineDate = new Date(deadline);
  } else {
    // datetime-local format: append Z to treat as UTC
    deadlineDate = new Date(deadline + 'Z');
  }

  if (isNaN(deadlineDate.getTime())) {
    return NextResponse.json(
      { error: 'Invalid deadline format' },
      { status: 400 }
    );
  }

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
    category: VALID_CATEGORIES.includes(category) ? category : 'engineering',
    bounty,
    deadline: deadlineDate,
    attachments: attachments || [],
    status: 'draft',
    research: {
      status: 'pending',
      documentExtracts: [],
      webResearch: [],
      progress: {
        documentsTotal: 0,
        documentsParsed: 0,
        queriesTotal: 0,
        queriesCompleted: 0,
      },
    },
  });

  const taskId = task._id.toString();

  // Start research immediately after task creation
  after(async () => {
    console.log('[Tasks API] Starting research for new task:', taskId);
    try {
      await runTaskResearch(taskId);
    } catch (err) {
      console.error('[Tasks API] Research failed for task:', taskId, err);
    }
  });

  return NextResponse.json(task, { status: 201 });
}
