import { getCurrentUser } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!mongoose.isValidObjectId(id)) {
    return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
  }

  await connectDB();
  const task = await Task.findById(id).lean();

  if (!task) {
    return NextResponse.json({ error: 'Task not found' }, { status: 404 });
  }

  if (task.posterId.toString() !== user._id.toString()) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!task.research) {
    return NextResponse.json({
      status: null,
      currentStep: null,
      progress: null,
      insights: null,
    });
  }

  return NextResponse.json({
    status: task.research.status,
    currentStep: task.research.currentStep || null,
    progress: task.research.progress || {
      documentsTotal: 0,
      documentsParsed: 0,
      queriesTotal: 0,
      queriesCompleted: 0,
    },
    error: task.research.error || null,
    summary: {
      documentCount: task.research.documentExtracts.length,
      documentsWithText: task.research.documentExtracts.filter(
        (d) => d.extractedText && !d.error
      ).length,
      searchCount: task.research.webResearch.length,
      totalResults: task.research.webResearch.reduce(
        (sum, w) => sum + w.results.length,
        0
      ),
    },
    insights: task.research.insights || null,
  });
}
