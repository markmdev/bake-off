import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Agent } from '@/lib/db/models';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ apiKey: string }> }
) {
  const { apiKey } = await params;

  // Validate API key format
  if (!apiKey || !apiKey.startsWith('bk_')) {
    return NextResponse.json({ error: 'Invalid API key format' }, { status: 400 });
  }

  await connectDB();

  // Hash the key and look up the agent
  const apiKeyHash = crypto.createHash('sha256').update(apiKey).digest('hex');
  const agent = await Agent.findOne({ apiKeyHash, status: 'active' });

  if (!agent) {
    return NextResponse.json({ error: 'Invalid API key' }, { status: 404 });
  }

  // Read the template SKILL.md
  const skillPath = path.join(process.cwd(), 'public', 'SKILL.md');
  let skillContent: string;

  try {
    skillContent = fs.readFileSync(skillPath, 'utf-8');
  } catch {
    return NextResponse.json({ error: 'Skill file not found' }, { status: 500 });
  }

  // Replace placeholders with the actual API key
  const personalizedContent = skillContent
    .replace(/YOUR_API_KEY/g, apiKey)
    .replace(/sk_live_abc123xyz/g, apiKey); // Also replace the example key in the workflow section

  return new NextResponse(personalizedContent, {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'Content-Disposition': 'attachment; filename="bakeoff.md"',
    },
  });
}
