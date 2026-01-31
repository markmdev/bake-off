/**
 * Seed 20 example bakeoffs from data/seed-bakeoffs.md
 * 
 * Run with: npx tsx --env-file=.env.local scripts/seed-bakeoffs.ts
 */

import mongoose from 'mongoose';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load environment variables
function loadEnv() {
  if (process.env.MONGODB_URI) return;
  const envFiles = ['.env.local', '.env'];
  for (const file of envFiles) {
    const path = resolve(process.cwd(), file);
    if (existsSync(path)) {
      const content = readFileSync(path, 'utf-8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const [key, ...valueParts] = trimmed.split('=');
        const value = valueParts.join('=').replace(/^["']|["']$/g, '');
        if (key && !process.env[key]) {
          process.env[key] = value;
        }
      }
    }
  }
}

loadEnv();

// Schemas
const userSchema = new mongoose.Schema({
  supabaseId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  displayName: { type: String, required: true },
  stripeCustomerId: { type: String, required: true },
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  posterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  attachments: { type: [{ filename: String, url: String, mimeType: String, sizeBytes: Number }], default: [] },
  bounty: { type: Number, required: true, min: 500 },
  status: { type: String, enum: ['draft', 'open', 'closed', 'cancelled'], default: 'draft' },
  deadline: { type: Date, required: true },
  stripeCheckoutSessionId: { type: String, default: '' },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', default: null },
  publishedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

// The 20 seed bakeoffs - parsed from seed-bakeoffs.md
const seedBakeoffs = [
  // Engineering
  {
    title: "Migrate Express.js API to Hono + Cloudflare Workers",
    description: `## Requirements & Context

We have a 40-endpoint REST API running on Express.js/Node that we need ported to Hono for deployment on Cloudflare Workers. The current codebase is 12 files, ~2,400 lines. We use Postgres (Neon) as our database.

Focus on the 8 priority endpoints first (auth, users, billing). Our current cold starts on Render are ~800ms; we need <50ms on Workers.

## Evaluation Criteria
- All 8 priority endpoints functional and deployed to Workers
- Cold start under 50ms (verified via wrangler tail)
- Database connections work with Neon's serverless driver
- Code is idiomatic Hono (not just Express with find-replace)
- Includes basic error handling and request validation
- README with deployment instructions`,
    bounty: 30000, // $300
  },
  {
    title: "Debug Intermittent Stripe Webhook Failures",
    description: `## Requirements & Context

Our /webhooks/stripe endpoint fails ~3% of the time with 500 errors. Stripe's automatic retries eventually succeed, but we want to understand and fix the root cause.

We suspect it's either a race condition with our database or a timeout issue, but we haven't been able to reproduce it locally.

## Evaluation Criteria
- Clear root cause analysis with evidence from logs
- Explanation of why retries succeed (this is key)
- Pull request with fix, including tests
- No regression in successful webhook processing
- Bonus: monitoring recommendation`,
    bounty: 22500, // $225
  },
  {
    title: "Generate Test Coverage for Auth Module",
    description: `## Requirements & Context

Our authentication module has 0% test coverage and has become "haunted"—nobody wants to touch it. It handles JWT issuance, refresh tokens, password reset, OAuth flows, and session management.

The module is 4 files, ~800 lines. Note: There's one intentional bug in the code.

## Evaluation Criteria
- 90%+ line coverage verified via vitest --coverage
- Tests catch the intentional bug
- Tests are readable and maintainable
- Integration tests use realistic scenarios
- CI configuration included (GitHub Actions)`,
    bounty: 32500, // $325
  },
  {
    title: "Convert Figma Design System to Tailwind Components",
    description: `## Requirements & Context

We have a Figma design system with 24 components that need to become production React components using Tailwind CSS. Components include: Button (4 variants), Input, Select, Checkbox, Radio, Toggle, Card, Modal, Dropdown, Toast, Badge, Avatar, Tooltip, Tabs, Accordion, and others.

## Evaluation Criteria
- All 24 components implemented and pixel-accurate to Figma
- Storybook stories for each component with variant controls
- Full TypeScript types with good DX
- WCAG 2.1 AA compliance
- Responsive behavior documented
- Bundle size reasonable (<50KB total)`,
    bounty: 40000, // $400
  },
  // Business & Finance
  {
    title: "Competitive Teardown: Notion AI Monetization",
    description: `## Requirements & Context

I'm building an AI writing tool and need to deeply understand how Notion AI makes money. Not surface-level—I want the business model mechanics.

Cover: Pricing structure, usage limits, upsell flows, estimated revenue contribution, and comparison to Jasper, Copy.ai, Writesonic pricing models.

## Evaluation Criteria
- Pricing mechanics documented with evidence (screenshots, links)
- Usage limits tested empirically
- Revenue estimates show methodology
- Comparison table with 4+ competitors
- Strategic insights: what's working, what's vulnerable
- Delivered as PDF or Notion doc with embedded images`,
    bounty: 15000, // $150
  },
  {
    title: "Ghost Kitchen Unit Economics Model",
    description: `## Requirements & Context

I'm evaluating opening a delivery-only restaurant in Austin, TX. I need a financial model I can actually use to make this decision.

Key assumptions: Rent ($2,500–4,000/mo), Labor (1 cook + 1 prep), Food costs (30% COGS), Delivery platform fees, Average order value ($18–25), Orders per day (ramp 20 to 80 over 6 months).

## Evaluation Criteria
- Interactive spreadsheet (Google Sheets or Excel)
- All assumptions clearly labeled and adjustable
- Monthly P&L for 24 months
- Break-even analysis
- Sensitivity analysis on 3 key variables
- Scenario comparison (Uber Eats vs. DoorDash vs. direct)`,
    bounty: 20000, // $200
  },
  {
    title: "Series A Memo: Market Opportunity Section",
    description: `## Requirements & Context

We're a vertical SaaS for veterinary clinics. Raising Series A and need the "Market Opportunity" section—2-3 pages that make VCs believe this market is big and timely.

Current metrics: 280 clinics, $890K ARR. Tone should be authoritative and data-driven, not breathless.

## Evaluation Criteria
- TAM/SAM/SOM with defensible methodology
- Market trends section with cited data
- Competitive landscape that's honest but favorable
- "Why now" narrative that's compelling
- Sources cited (not just asserted)`,
    bounty: 22500, // $225
  },
  {
    title: "Acquisition Offer Analysis",
    description: `## Requirements & Context

We received a $4.2M acquisition offer for our SaaS. We're 18 months old, $380K ARR, 3 founders, 2 employees. I need help deciding whether to accept and how to negotiate.

## Evaluation Criteria
- Multiple analysis (ARR multiple, comparison to market)
- 5+ comparable acquisitions cited with sources
- Tax implications summarized
- LOI red flags identified with explanations
- Negotiation priorities ranked
- Decision framework: when to accept vs. walk away`,
    bounty: 27500, // $275
  },
  // Legal & Compliance
  {
    title: "Redline SaaS Vendor Contract",
    description: `## Requirements & Context

We need to sign an enterprise contract with a data vendor but have no legal budget. Review and redline the MSA (14 pages).

Focus areas: Liability caps, indemnification, data ownership, termination provisions, auto-renewal terms, SLA commitments.

## Evaluation Criteria
- Redlined document with tracked changes
- Each flag explained in plain English
- Risk rating for each issue (high/medium/low)
- Alternative language suggested for high-risk terms
- Summary memo: top 5 things to negotiate`,
    bounty: 20000, // $200
  },
  {
    title: "GDPR Data Mapping Exercise",
    description: `## Requirements & Context

We're a 15-person B2B SaaS and need to complete a GDPR data mapping exercise. We process data for EU customers and need to document what personal data we collect, where it's stored, and who has access.

## Evaluation Criteria
- Complete data inventory spreadsheet
- Processing activities mapped to lawful bases
- Data flow diagram (visual)
- Third-party processor list with DPA status
- Gap analysis with prioritized remediation steps`,
    bounty: 25000, // $250
  },
  // Customer Support
  {
    title: "Create 50 FAQ Entries from Support Tickets",
    description: `## Requirements & Context

I have 6 months of Intercom support tickets (exported as CSV). I need them analyzed and turned into 50 FAQ entries for our help center.

## Evaluation Criteria
- 50 Q&A pairs, clearly written
- Grouped into logical categories
- Answers are complete but concise
- Formatting ready for help center import
- Priority ranking based on ticket frequency`,
    bounty: 17500, // $175
  },
  {
    title: "Write Apology Email Templates",
    description: `## Requirements & Context

We need a set of 10 apology email templates for different severity levels and situations. Our brand voice is professional but warm—we're a B2B HR software company.

Scenarios: billing errors, data issues, outages, feature bugs, delayed responses, etc.

## Evaluation Criteria
- 10 templates covering different scenarios
- Each template has subject line + body
- Tone matches brand voice
- Includes specific placeholders for customization
- Escalation paths clear where applicable`,
    bounty: 12500, // $125
  },
  // Media & Content
  {
    title: "YouTube Script: Explain RAG in 10 Minutes",
    description: `## Requirements & Context

I run a tech YouTube channel (45K subscribers). I need a script explaining Retrieval-Augmented Generation (RAG) to developers who know ML basics but haven't implemented RAG.

The script should be engaging, technically accurate, and include visual suggestions.

## Evaluation Criteria
- 10-minute script (approximately 1,500 words)
- Clear structure with timestamps
- Analogies that actually help understanding
- Visual/animation suggestions at key points
- Hook that retains viewers past 30 seconds`,
    bounty: 20000, // $200
  },
  {
    title: "Podcast Episode Outline: Founder Story",
    description: `## Requirements & Context

I'm interviewing a founder who bootstrapped to $5M ARR. I need a detailed interview outline that will result in an engaging 45-minute episode.

## Evaluation Criteria
- 45-minute episode structure
- Questions that elicit stories, not just facts
- Follow-up questions for likely responses
- Transitions between segments
- 3-5 "clip-worthy" moment setups`,
    bounty: 15000, // $150
  },
  // Research
  {
    title: "Literature Review: LLM Evaluation Methods",
    description: `## Requirements & Context

I'm a PhD student and need a literature review on evaluation methods for large language models. Focus on the last 2 years (2024-2026).

## Evaluation Criteria
- 20+ papers summarized
- Organized by evaluation approach (benchmarks, human eval, automated metrics)
- Critical analysis, not just summaries
- Research gaps identified
- Proper academic citations (BibTeX)`,
    bounty: 30000, // $300
  },
  {
    title: "Survey Analysis: Developer Tools Preferences",
    description: `## Requirements & Context

I ran a survey of 500 developers about their tool preferences. I need the data analyzed and turned into actionable insights.

Data includes: demographics, tool usage, satisfaction scores, open-ended feedback.

## Evaluation Criteria
- Quantitative analysis with statistical significance noted
- Qualitative coding of open-ended responses
- Key insights summarized (top 10 findings)
- Visualizations for key data points
- Recommendations based on findings`,
    bounty: 22500, // $225
  },
  // Operations
  {
    title: "Create SOPs for Customer Onboarding",
    description: `## Requirements & Context

We're a 10-person B2B startup and our onboarding process lives in people's heads. I need it documented as Standard Operating Procedures.

Current process: Sales handoff → Kickoff call → Data migration → Training → Go-live → Check-in.

## Evaluation Criteria
- Complete SOP document for each stage
- Checklists for each step
- RACI matrix for responsibilities
- Templates for emails/calls
- Metrics for success at each stage`,
    bounty: 25000, // $250
  },
  {
    title: "Audit Our AWS Bill and Recommend Cuts",
    description: `## Requirements & Context

Our AWS bill is $8,500/month and growing. I suspect we're wasting money but don't know where.

Access: I'll provide read-only IAM credentials and 6 months of Cost Explorer data.

## Evaluation Criteria
- Itemized analysis of current spend
- 5+ specific cost reduction recommendations
- Expected savings quantified for each
- Implementation steps for each recommendation
- Risks or trade-offs clearly stated`,
    bounty: 27500, // $275
  },
  {
    title: "Design a Hiring Rubric for Senior Engineers",
    description: `## Requirements & Context

We're scaling our engineering team and need a structured interview process. Currently it's vibes-based and inconsistent.

Looking for: Technical assessment criteria, behavioral interview questions, scoring rubrics.

## Evaluation Criteria
- Complete interview guide (4-5 stages)
- Rubric for each stage with scoring criteria
- Sample questions for each competency
- Red flags and green flags documented
- Calibration guidance for interviewers`,
    bounty: 22500, // $225
  },
  {
    title: "Create Board Deck Template",
    description: `## Requirements & Context

We're a Series A startup and need a template for our quarterly board meetings. Slides should be clean, data-focused, and not waste board members' time.

## Evaluation Criteria
- 15-20 slide template with placeholders
- Covers: financials, product, sales, team, asks
- Clean design matching common board deck standards
- Guidance notes for what goes in each slide
- Google Slides or PowerPoint format`,
    bounty: 17500, // $175
  },
];

async function seed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('Error: MONGODB_URI not set');
    process.exit(1);
  }

  console.log('Connecting to MongoDB...');
  await mongoose.connect(uri);
  console.log('Connected!');

  // Find or create demo poster user
  let posterUser = await User.findOne({ supabaseId: 'demo_poster_001' });
  
  if (!posterUser) {
    console.log('Creating demo poster user...');
    posterUser = await User.create({
      supabaseId: 'demo_poster_001',
      email: 'demo-poster@bake-off.example',
      displayName: 'Demo Task Poster',
      stripeCustomerId: 'cus_demo_poster_001',
    });
  }
  console.log(`Using poster: ${posterUser.displayName}`);

  // Delete existing seed tasks (by title match)
  const seedTitles = seedBakeoffs.map(b => b.title);
  const deleteResult = await Task.deleteMany({ title: { $in: seedTitles } });
  console.log(`Cleared ${deleteResult.deletedCount} existing seed tasks`);

  // Create all 20 tasks
  console.log('\nCreating 20 seed bakeoffs...');
  
  const now = new Date();
  const tasks = [];
  
  for (let i = 0; i < seedBakeoffs.length; i++) {
    const bakeoff = seedBakeoffs[i];
    const daysOffset = Math.floor(Math.random() * 7) + 3; // 3-10 days from now
    const deadline = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const publishedAt = new Date(now.getTime() - (i * 2 + 1) * 60 * 60 * 1000); // Staggered over past hours
    
    const task = await Task.create({
      posterId: posterUser._id,
      title: bakeoff.title,
      description: bakeoff.description,
      attachments: [],
      bounty: bakeoff.bounty,
      status: 'open',
      deadline,
      stripeCheckoutSessionId: `cs_demo_seed_${i + 1}`,
      winnerId: null,
      publishedAt,
      closedAt: null,
    });
    
    tasks.push(task);
    console.log(`  ${i + 1}. ${task.title} ($${(task.bounty / 100).toFixed(0)})`);
  }

  console.log(`\n✅ Created ${tasks.length} seed bakeoffs!`);
  console.log('Total bounty pool: $' + (seedBakeoffs.reduce((a, b) => a + b.bounty, 0) / 100).toLocaleString());
  
  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
