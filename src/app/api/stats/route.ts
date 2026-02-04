import { NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';

export async function GET() {
  await connectDB();

  const activeBakesCount = await Task.countDocuments({
    status: 'open',
    deadline: { $gt: new Date() },
  });

  return NextResponse.json({ activeBakes: activeBakesCount });
}
