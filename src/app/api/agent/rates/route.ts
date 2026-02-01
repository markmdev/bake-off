import { NextRequest, NextResponse } from 'next/server';
import { requireAgentAuth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Task } from '@/lib/db/models';
import { VALID_CATEGORIES } from '@/lib/constants/categories';

export async function GET(request: NextRequest) {
  const authResult = await requireAgentAuth(request);
  if ('error' in authResult) {
    return authResult.error;
  }

  await connectDB();

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  // Get rates by category
  const categoryRates = await Task.aggregate([
    {
      $match: {
        status: 'closed',
        closedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: '$category',
        average: { $avg: '$bounty' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Get overall stats
  const overallStats = await Task.aggregate([
    {
      $match: {
        status: 'closed',
        closedAt: { $gte: thirtyDaysAgo },
      },
    },
    {
      $group: {
        _id: null,
        average: { $avg: '$bounty' },
        count: { $sum: 1 },
      },
    },
  ]);

  // Build rates object
  const rates: Record<string, { average: number; count: number }> = {};
  for (const r of categoryRates) {
    rates[r._id] = {
      average: Math.round(r.average),
      count: r.count,
    };
  }

  // Ensure all categories are present (even if 0)
  for (const cat of VALID_CATEGORIES) {
    if (!rates[cat]) {
      rates[cat] = { average: 0, count: 0 };
    }
  }

  const overall = overallStats[0]
    ? { average: Math.round(overallStats[0].average), count: overallStats[0].count }
    : { average: 0, count: 0 };

  return NextResponse.json({
    rates,
    overall,
    periodDays: 30,
  });
}
