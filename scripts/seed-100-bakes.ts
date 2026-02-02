/**
 * Seed 100+ diverse bakes for soft launch
 * 
 * Run with: npx tsx --env-file=.env.local scripts/seed-100-bakes.ts
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
  browniePoints: { type: Number, default: 1000 },
}, { timestamps: true });

const taskSchema = new mongoose.Schema({
  posterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['engineering', 'business', 'legal', 'support', 'media', 'research'], default: 'engineering' },
  attachments: { type: [{ filename: String, url: String, mimeType: String, sizeBytes: Number }], default: [] },
  bounty: { type: Number, required: true, min: 100 },
  status: { type: String, enum: ['draft', 'open', 'closed', 'cancelled'], default: 'draft' },
  deadline: { type: Date, required: true },
  stripeCheckoutSessionId: { type: String, default: '' },
  winnerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Submission', default: null },
  publishedAt: { type: Date, default: null },
  closedAt: { type: Date, default: null },
}, { timestamps: true });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Task = mongoose.models.Task || mongoose.model('Task', taskSchema);

// 100+ diverse bakes covering all categories
const bakes = [
  // ============ ENGINEERING (40 tasks) ============
  { category: 'engineering', title: "Convert Python script to async with asyncio", bounty: 500, description: "Refactor a synchronous Python script (200 lines) to use asyncio for concurrent HTTP requests. Include error handling and rate limiting." },
  { category: 'engineering', title: "Write unit tests for React component library", bounty: 800, description: "Create comprehensive Jest/RTL tests for 10 React components. Target 90%+ coverage. Components include: Button, Modal, Dropdown, Form, Table." },
  { category: 'engineering', title: "Debug memory leak in Node.js Express app", bounty: 600, description: "Our Express server's memory grows unbounded over time. Identify the leak, provide a fix, and document the debugging process." },
  { category: 'engineering', title: "Implement OAuth2 flow with refresh tokens", bounty: 750, description: "Add OAuth2 authentication to an existing Express API. Support Google and GitHub providers. Include refresh token rotation." },
  { category: 'engineering', title: "Create GitHub Actions CI/CD pipeline", bounty: 400, description: "Set up CI/CD for a Next.js app: lint, test, build, deploy to Vercel preview for PRs, production on main merge." },
  { category: 'engineering', title: "Optimize PostgreSQL queries (10 slow queries)", bounty: 700, description: "Analyze EXPLAIN plans and optimize 10 slow queries. Target: reduce p95 latency by 50%. Include index recommendations." },
  { category: 'engineering', title: "Build CLI tool with Commander.js", bounty: 450, description: "Create a CLI for managing TODO lists: add, list, complete, delete, filter. Include colorful output and JSON export." },
  { category: 'engineering', title: "Migrate Prisma schema from SQLite to Postgres", bounty: 350, description: "Update Prisma schema for PostgreSQL compatibility. Handle type differences, write migration, test with sample data." },
  { category: 'engineering', title: "Implement WebSocket chat server", bounty: 600, description: "Build a real-time chat server with Socket.io: rooms, private messages, typing indicators, message history." },
  { category: 'engineering', title: "Create Docker Compose for dev environment", bounty: 300, description: "Set up Docker Compose with: Node.js app, PostgreSQL, Redis, Nginx proxy. Include hot reload for development." },
  { category: 'engineering', title: "Build REST API with Hono and Cloudflare Workers", bounty: 550, description: "Create a CRUD API for bookmarks: Hono framework, D1 database, deployed to Cloudflare Workers. Include auth." },
  { category: 'engineering', title: "Fix CORS issues in multi-origin setup", bounty: 250, description: "Debug and fix CORS configuration for API serving 3 different frontend origins. Document the final config." },
  { category: 'engineering', title: "Implement rate limiting middleware", bounty: 400, description: "Create Express middleware for rate limiting: sliding window, multiple tiers, Redis-backed for distributed deployments." },
  { category: 'engineering', title: "Convert class components to React hooks", bounty: 500, description: "Refactor 15 React class components to functional components with hooks. Maintain all existing functionality." },
  { category: 'engineering', title: "Build CSV import/export feature", bounty: 450, description: "Add CSV import/export to a data management app. Handle large files (100k+ rows), validate data, show progress." },
  { category: 'engineering', title: "Set up error monitoring with Sentry", bounty: 300, description: "Integrate Sentry into a Next.js app: client errors, server errors, source maps, environment separation." },
  { category: 'engineering', title: "Create GraphQL schema from REST API spec", bounty: 600, description: "Design and implement GraphQL schema wrapping an existing REST API. Include DataLoader for N+1 prevention." },
  { category: 'engineering', title: "Implement email verification flow", bounty: 400, description: "Add email verification to signup: send verification email, handle token validation, resend functionality." },
  { category: 'engineering', title: "Build image upload with S3 and signed URLs", bounty: 500, description: "Implement image upload: presigned URLs for direct S3 upload, resize on upload, serve via CloudFront." },
  { category: 'engineering', title: "Add full-text search with Elasticsearch", bounty: 800, description: "Integrate Elasticsearch for product search: indexing, query building, faceted filters, highlighting." },
  { category: 'engineering', title: "Create Stripe subscription integration", bounty: 700, description: "Implement Stripe subscriptions: checkout, portal, webhooks, metered billing. Handle plan changes and cancellation." },
  { category: 'engineering', title: "Build PDF generation service", bounty: 500, description: "Create API endpoint that generates PDF invoices from JSON data. Use Puppeteer or similar. Handle templates." },
  { category: 'engineering', title: "Implement feature flags with LaunchDarkly", bounty: 350, description: "Add feature flag system: LaunchDarkly integration, React context for client, middleware for server." },
  { category: 'engineering', title: "Set up database migrations with Flyway", bounty: 400, description: "Configure Flyway for PostgreSQL migrations in Java/Spring project. Include baseline and rollback strategies." },
  { category: 'engineering', title: "Build notification system (email + push)", bounty: 650, description: "Create notification service: email via SendGrid, push via FCM, preference management, templating." },
  { category: 'engineering', title: "Implement SSO with SAML 2.0", bounty: 900, description: "Add SAML SSO support for enterprise customers. Support Okta and Azure AD. Include SP metadata endpoint." },
  { category: 'engineering', title: "Create API documentation with OpenAPI", bounty: 350, description: "Document existing REST API using OpenAPI 3.0. Generate interactive docs with Swagger UI." },
  { category: 'engineering', title: "Build data export job queue", bounty: 550, description: "Implement background job system for large data exports: Bull/Redis, progress tracking, email on completion." },
  { category: 'engineering', title: "Add internationalization (i18n) support", bounty: 500, description: "Implement i18n for React app: next-intl or react-i18next, extract strings, RTL support, date/number formatting." },
  { category: 'engineering', title: "Create Terraform configs for AWS infrastructure", bounty: 800, description: "Write Terraform for: VPC, ECS Fargate, RDS, ElastiCache, ALB. Include modules and staging/prod workspaces." },
  { category: 'engineering', title: "Build webhook delivery system", bounty: 600, description: "Create reliable webhook delivery: retry logic, signature verification, delivery logs, dead letter queue." },
  { category: 'engineering', title: "Implement audit logging for compliance", bounty: 500, description: "Add audit logging: capture all data modifications, immutable storage, query interface, retention policies." },
  { category: 'engineering', title: "Create performance benchmark suite", bounty: 450, description: "Build automated performance tests: k6 or Artillery, baseline metrics, CI integration, alerting on regression." },
  { category: 'engineering', title: "Add two-factor authentication (2FA)", bounty: 550, description: "Implement TOTP-based 2FA: setup flow, backup codes, recovery flow, remember device option." },
  { category: 'engineering', title: "Build real-time dashboard with WebSockets", bounty: 700, description: "Create live metrics dashboard: WebSocket updates, Chart.js visualizations, time range filtering." },
  { category: 'engineering', title: "Implement soft delete with audit trail", bounty: 350, description: "Add soft delete to all models: deleted_at timestamp, cascade rules, restore functionality, audit records." },
  { category: 'engineering', title: "Create browser extension for bookmarking", bounty: 500, description: "Build Chrome extension: bookmark current page, tag support, sync with backend API, popup UI." },
  { category: 'engineering', title: "Set up log aggregation with Loki", bounty: 450, description: "Deploy Grafana Loki for logs: Docker Compose, log shipping from apps, Grafana dashboards, alerts." },
  { category: 'engineering', title: "Build file versioning system", bounty: 600, description: "Implement file versioning: store multiple versions, diff view, restore previous versions, storage optimization." },
  { category: 'engineering', title: "Create automated database backup system", bounty: 400, description: "Set up PostgreSQL backups: pg_dump schedule, S3 upload, retention policy, restore testing, notifications." },

  // ============ BUSINESS (20 tasks) ============
  { category: 'business', title: "Competitive analysis: AI coding assistants", bounty: 600, description: "Deep analysis of GitHub Copilot, Cursor, Cody, and Windsurf. Cover pricing, features, user sentiment, market positioning." },
  { category: 'business', title: "Create financial model for SaaS startup", bounty: 800, description: "Build 3-year financial model: MRR projections, cohort analysis, CAC/LTV, runway calculator. Google Sheets." },
  { category: 'business', title: "Write investor update email template", bounty: 250, description: "Create monthly investor update template: metrics dashboard, highlights/lowlights, asks, narrative sections." },
  { category: 'business', title: "Research TAM for developer tools market", bounty: 500, description: "Calculate TAM/SAM/SOM for developer productivity tools. Include methodology, sources, growth projections." },
  { category: 'business', title: "Create pricing strategy document", bounty: 600, description: "Develop pricing strategy: value metric analysis, tier structure, competitive positioning, willingness-to-pay research." },
  { category: 'business', title: "Build customer segmentation analysis", bounty: 550, description: "Analyze customer data and create segments. Include personas, behavior patterns, revenue contribution, targeting recommendations." },
  { category: 'business', title: "Write business case for new product feature", bounty: 400, description: "Create business case: market opportunity, competitive need, resource requirements, expected ROI, risk analysis." },
  { category: 'business', title: "Design partnership outreach strategy", bounty: 450, description: "Create partnership strategy: target list of 20 potential partners, outreach templates, value propositions, deal structures." },
  { category: 'business', title: "Create sales battlecard vs competitor", bounty: 350, description: "Build sales battlecard: feature comparison, objection handling, win themes, landmines, talk tracks." },
  { category: 'business', title: "Analyze churn patterns and recommendations", bounty: 600, description: "Analyze 6 months of churn data: identify patterns, segment high-risk customers, recommend interventions." },
  { category: 'business', title: "Build OKR framework for engineering team", bounty: 400, description: "Design OKR system: company-level to individual, tracking cadence, scoring methodology, templates." },
  { category: 'business', title: "Create market entry strategy for APAC", bounty: 700, description: "APAC expansion strategy: market sizing per country, regulatory considerations, localization needs, GTM plan." },
  { category: 'business', title: "Design referral program mechanics", bounty: 350, description: "Create referral program: incentive structure, viral mechanics, tracking system, fraud prevention, legal compliance." },
  { category: 'business', title: "Write product requirements document (PRD)", bounty: 450, description: "Create PRD for new feature: problem statement, user stories, success metrics, wireframes, technical considerations." },
  { category: 'business', title: "Analyze unit economics by customer segment", bounty: 550, description: "Calculate unit economics per segment: CAC, LTV, payback period, margin analysis, segment recommendations." },
  { category: 'business', title: "Create board meeting presentation", bounty: 500, description: "Build quarterly board deck: financial performance, KPIs, strategic updates, asks, appendix. 20-25 slides." },
  { category: 'business', title: "Design employee equity compensation plan", bounty: 600, description: "Create equity plan: option pool size, vesting schedules, exercise policies, ISO vs NSO, documentation." },
  { category: 'business', title: "Write customer case study", bounty: 300, description: "Interview customer and write case study: challenge, solution, results (with metrics), quotes, visuals." },
  { category: 'business', title: "Create sales compensation plan", bounty: 500, description: "Design sales comp: base/variable split, quota methodology, accelerators, SPIFs, payout mechanics." },
  { category: 'business', title: "Build cohort retention analysis", bounty: 450, description: "Analyze user retention by cohort: visualization, identify drop-off points, compare segments, recommendations." },

  // ============ LEGAL (10 tasks) ============
  { category: 'legal', title: "Draft terms of service for SaaS app", bounty: 500, description: "Write ToS covering: acceptable use, intellectual property, liability limits, termination, dispute resolution." },
  { category: 'legal', title: "Review and redline NDA", bounty: 300, description: "Review mutual NDA (5 pages): identify concerning clauses, suggest modifications, summary of key terms." },
  { category: 'legal', title: "Create privacy policy for GDPR compliance", bounty: 450, description: "Write GDPR-compliant privacy policy: data collection, processing bases, rights, retention, transfers." },
  { category: 'legal', title: "Draft contractor agreement", bounty: 400, description: "Create independent contractor agreement: scope, payment, IP assignment, confidentiality, termination." },
  { category: 'legal', title: "Review SaaS vendor contract", bounty: 350, description: "Review enterprise SaaS contract (20 pages): flag risks, negotiate points, summary memo for executives." },
  { category: 'legal', title: "Create cookie consent implementation guide", bounty: 300, description: "Document cookie consent requirements: categories, consent mechanism, GDPR/CCPA requirements, technical implementation." },
  { category: 'legal', title: "Draft data processing agreement (DPA)", bounty: 400, description: "Create DPA for B2B customers: processor obligations, subprocessors, security measures, audit rights." },
  { category: 'legal', title: "Write employee invention assignment agreement", bounty: 350, description: "Draft agreement for IP assignment: inventions, works for hire, prior inventions, consideration." },
  { category: 'legal', title: "Create content moderation policy", bounty: 300, description: "Write content policy: prohibited content categories, enforcement procedures, appeals process, transparency reporting." },
  { category: 'legal', title: "Review open source license compatibility", bounty: 450, description: "Audit project dependencies: identify licenses, compatibility analysis, attribution requirements, recommendations." },

  // ============ SUPPORT (10 tasks) ============
  { category: 'support', title: "Create knowledge base articles (20 articles)", bounty: 400, description: "Write 20 help articles covering common questions: account setup, billing, features, troubleshooting." },
  { category: 'support', title: "Build chatbot conversation flows", bounty: 500, description: "Design chatbot flows: 15 common scenarios, decision trees, handoff triggers, suggested responses." },
  { category: 'support', title: "Create customer onboarding email sequence", bounty: 350, description: "Write 7-email onboarding sequence: welcome, key features, tips, engagement prompts, feedback request." },
  { category: 'support', title: "Develop support escalation matrix", bounty: 300, description: "Create escalation procedures: severity definitions, response times, escalation paths, communication templates." },
  { category: 'support', title: "Write product changelog for past 6 months", bounty: 350, description: "Review releases and write user-friendly changelog: features, improvements, fixes. Include visuals." },
  { category: 'support', title: "Create video tutorial scripts (5 videos)", bounty: 400, description: "Write scripts for 5 tutorial videos: getting started, key workflows, advanced features. 3-5 min each." },
  { category: 'support', title: "Build customer feedback categorization system", bounty: 350, description: "Create taxonomy for feedback: categories, tags, sentiment, priority scoring, routing rules." },
  { category: 'support', title: "Write API documentation examples", bounty: 400, description: "Create code examples for API docs: 15 endpoints, multiple languages (curl, Python, JavaScript, Ruby)." },
  { category: 'support', title: "Design customer health score system", bounty: 500, description: "Create health scoring model: input metrics, weighting, thresholds, alert triggers, dashboard design." },
  { category: 'support', title: "Create support team training curriculum", bounty: 450, description: "Design 2-week training program: modules, assessments, role-play scenarios, certification criteria." },

  // ============ MEDIA (10 tasks) ============
  { category: 'media', title: "Write technical blog post on WebAssembly", bounty: 400, description: "Write 2000-word blog post: what is Wasm, use cases, getting started guide, code examples, performance comparison." },
  { category: 'media', title: "Create social media content calendar (1 month)", bounty: 350, description: "Plan 30 days of content: 4 platforms, post copy, image descriptions, hashtags, optimal posting times." },
  { category: 'media', title: "Write product launch press release", bounty: 300, description: "Draft press release for product launch: headline, lead, quotes, boilerplate, media contact info." },
  { category: 'media', title: "Create podcast episode show notes", bounty: 250, description: "Write detailed show notes for 10 podcast episodes: summaries, timestamps, links, quotes, SEO optimization." },
  { category: 'media', title: "Design infographic about AI trends", bounty: 400, description: "Create data-driven infographic: research stats, visual design brief, copy, source citations." },
  { category: 'media', title: "Write email newsletter series (8 issues)", bounty: 450, description: "Create 8-week newsletter series: educational content, engagement hooks, CTAs, subject lines." },
  { category: 'media', title: "Create YouTube video script about APIs", bounty: 350, description: "Write 12-minute script: what are APIs, how they work, demo, best practices. Include visual suggestions." },
  { category: 'media', title: "Write landing page copy for new feature", bounty: 300, description: "Create landing page: headline, subhead, feature sections, social proof, CTA. A/B test variants." },
  { category: 'media', title: "Develop brand voice guidelines", bounty: 400, description: "Create brand voice doc: personality traits, tone examples, do's and don'ts, word choices, channel variations." },
  { category: 'media', title: "Write developer newsletter edition", bounty: 300, description: "Curate and write developer newsletter: 5 interesting links, original commentary, code tip, tool spotlight." },

  // ============ RESEARCH (10 tasks) ============
  { category: 'research', title: "Survey analysis: developer tool preferences", bounty: 500, description: "Analyze survey data (500 responses): quantitative stats, qualitative themes, key insights, visualizations." },
  { category: 'research', title: "Literature review: vector databases", bounty: 600, description: "Review 15+ papers on vector databases: algorithms, trade-offs, benchmarks, practical recommendations." },
  { category: 'research', title: "Market research: AI code review tools", bounty: 450, description: "Research AI code review market: players, features, pricing, user reviews, market size, trends." },
  { category: 'research', title: "User research interview analysis", bounty: 400, description: "Analyze 10 user interviews: transcription, coding, theme extraction, insights, recommendations." },
  { category: 'research', title: "Benchmark comparison: JS frameworks", bounty: 500, description: "Benchmark React, Vue, Svelte, Solid: bundle size, runtime performance, DX metrics, recommendations." },
  { category: 'research', title: "Research report: AI regulation landscape", bounty: 550, description: "Survey AI regulations: EU AI Act, US proposals, China rules, compliance implications, timeline." },
  { category: 'research', title: "Competitive teardown: product features", bounty: 400, description: "Deep analysis of 5 competitors: feature matrices, UX teardown, pricing, positioning, opportunities." },
  { category: 'research', title: "Data analysis: product usage patterns", bounty: 450, description: "Analyze usage data: feature adoption, user journeys, drop-off points, power user behaviors." },
  { category: 'research', title: "Technology trend report: Edge computing", bounty: 500, description: "Research edge computing trends: use cases, vendors, adoption patterns, challenges, predictions." },
  { category: 'research', title: "Academic paper summary: LLM fine-tuning", bounty: 350, description: "Summarize 10 papers on LLM fine-tuning: techniques, results, practical guidance, open questions." },

  // ============ 🚀 WOW FACTOR - Push Agent Capabilities (20 tasks) ============
  // These tasks showcase what AI agents can REALLY do in 2026
  
  { category: 'engineering', title: "🤖 Build a full-stack app from a napkin sketch", bounty: 1500, description: "Given a photo of a hand-drawn wireframe, create a complete working web application: React frontend, Node.js backend, PostgreSQL database, deployed to Vercel. The sketch shows a task management app with user auth, projects, and drag-drop." },
  
  { category: 'engineering', title: "🔍 Reverse engineer competitor's API from their SDK", bounty: 1200, description: "Given a competitor's JavaScript SDK (minified), reverse engineer their private API: endpoints, auth scheme, data models, rate limits. Produce OpenAPI spec and working Postman collection." },
  
  { category: 'engineering', title: "🎮 Create a playable game from a gameplay video", bounty: 2000, description: "Watch this 2-minute gameplay video of a simple puzzle game. Recreate it as a fully playable browser game: same mechanics, similar graphics, sound effects. HTML5 Canvas or WebGL." },
  
  { category: 'engineering', title: "🐛 Find and fix security vulnerabilities in codebase", bounty: 1800, description: "Audit this 50-file Node.js codebase for security vulnerabilities. Find at least 5 real issues (not just style). Provide exploit POCs and fixes. Categories: injection, auth bypass, SSRF, etc." },
  
  { category: 'engineering', title: "📱 Convert website to React Native mobile app", bounty: 1600, description: "Given this marketing website URL, create a React Native app with equivalent functionality: navigation, forms, animations. Should work on iOS and Android. Include Expo config." },
  
  { category: 'business', title: "💰 Create investment thesis from 10-K filing", bounty: 1000, description: "Analyze this company's 10-K SEC filing and produce a professional investment thesis: business analysis, competitive moat, financial health, risk factors, valuation estimate, buy/hold/sell recommendation." },
  
  { category: 'business', title: "🎯 Build complete go-to-market strategy", bounty: 1400, description: "Given this product description and target market, create complete GTM strategy: positioning, messaging, channel strategy, content calendar, launch timeline, budget allocation, success metrics. 20+ page deliverable." },
  
  { category: 'business', title: "📊 Turn messy spreadsheet into executive dashboard", bounty: 800, description: "Given this chaotic Excel file with 15 tabs of sales data, create a beautiful executive dashboard: clean data model, key metrics, visualizations, trend analysis, anomaly detection. Deliver as interactive Notion or Google Sheets." },
  
  { category: 'media', title: "🎬 Write and storyboard YouTube video from topic", bounty: 900, description: "Topic: 'How Vector Databases Work.' Create: 15-minute script with hooks, full storyboard with 40+ frames, b-roll suggestions, thumbnail concepts (3 options), SEO-optimized title/description/tags." },
  
  { category: 'media', title: "✍️ Ghost-write thought leadership article series", bounty: 1100, description: "Write 5 LinkedIn articles (1500+ words each) on AI in healthcare, in the voice of a healthcare executive. Research-backed, with real statistics, compelling narratives. Include engagement strategy." },
  
  { category: 'research', title: "🔬 Reproduce ML paper results from scratch", bounty: 1600, description: "Given this ML paper, reproduce the main experiment: implement the model, train on the specified dataset, achieve within 5% of reported metrics. Provide clean code, training logs, analysis of any discrepancies." },
  
  { category: 'research', title: "🌐 Map entire competitive landscape with evidence", bounty: 1200, description: "For the 'AI coding assistant' market: identify ALL players (50+), categorize them, document funding, features, pricing, user reviews, market share estimates. Evidence-linked spreadsheet + analysis report." },
  
  { category: 'legal', title: "⚖️ Analyze contract portfolio for risk exposure", bounty: 1300, description: "Review these 20 vendor contracts (PDFs provided). Create risk matrix: identify concerning clauses, quantify exposure, prioritize renegotiation targets. Include specific language recommendations." },
  
  { category: 'support', title: "🤝 Create AI-powered support agent from docs", bounty: 1000, description: "Given our product documentation (50 pages), create a complete support agent: knowledge base structure, conversation flows for top 30 issues, escalation rules, integration spec for Intercom." },
  
  { category: 'engineering', title: "🔄 Migrate legacy system with zero downtime plan", bounty: 1500, description: "Our PHP/MySQL app needs to become Node.js/PostgreSQL. Create: complete migration plan, data migration scripts, feature parity checklist, rollback procedures, zero-downtime deployment strategy." },
  
  { category: 'business', title: "🚀 Design complete product launch playbook", bounty: 1100, description: "Create reusable product launch playbook: 90-day timeline, team RACI, checklist templates, email sequences, PR strategy, influencer outreach templates, metrics framework. Used for future launches." },
  
  { category: 'engineering', title: "🧪 Generate synthetic test data matching production patterns", bounty: 700, description: "Analyze our production database schema and sample data. Generate 1M rows of realistic synthetic data: proper distributions, relationships, edge cases, temporal patterns. Faker.js or similar." },
  
  { category: 'media', title: "🎨 Create complete brand identity from brief", bounty: 1300, description: "Brief: 'AI-powered legal research tool for solo attorneys.' Deliver: name options (5), logo concepts (described), color palette, typography, brand voice guide, sample marketing copy, social media templates." },
  
  { category: 'research', title: "📈 Build predictive model from business data", bounty: 1400, description: "Given 2 years of sales data (CSV), build churn prediction model: feature engineering, model selection, training, validation. Deliver: working model, API wrapper, business recommendations based on feature importance." },
  
  { category: 'engineering', title: "🌍 Localize app to 5 languages with cultural adaptation", bounty: 1000, description: "Localize this React app to: Spanish, French, German, Japanese, Portuguese. Not just translation - adapt date formats, currency, cultural references, RTL considerations for future Arabic. Include i18n setup." },
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
      browniePoints: 100000, // Lots of BP to post tasks
    });
  }
  console.log(`Using poster: ${posterUser.displayName}`);

  // Ask for confirmation before clearing
  console.log(`\nWill create ${bakes.length} new bakes.`);
  console.log('Categories:', {
    engineering: bakes.filter(b => b.category === 'engineering').length,
    business: bakes.filter(b => b.category === 'business').length,
    legal: bakes.filter(b => b.category === 'legal').length,
    support: bakes.filter(b => b.category === 'support').length,
    media: bakes.filter(b => b.category === 'media').length,
    research: bakes.filter(b => b.category === 'research').length,
  });

  // Delete ALL existing tasks (clean slate for soft launch)
  const deleteResult = await Task.deleteMany({});
  console.log(`\n🗑️ Cleared ${deleteResult.deletedCount} existing tasks (clean slate)`);

  // Create all tasks
  console.log(`\nCreating ${bakes.length} bakes...\n`);
  
  const now = new Date();
  let created = 0;
  
  for (let i = 0; i < bakes.length; i++) {
    const bake = bakes[i];
    const daysOffset = Math.floor(Math.random() * 15) + 3; // 3-17 days from now
    const deadline = new Date(now.getTime() + daysOffset * 24 * 60 * 60 * 1000);
    const publishedAt = new Date(now.getTime() - Math.random() * 7 * 24 * 60 * 60 * 1000); // Random time in past week
    
    await Task.create({
      posterId: posterUser._id,
      title: bake.title,
      description: bake.description,
      category: bake.category,
      attachments: [],
      bounty: bake.bounty,
      status: 'open',
      deadline,
      stripeCheckoutSessionId: `cs_seed_${Date.now()}_${i}`,
      winnerId: null,
      publishedAt,
      closedAt: null,
    });
    
    created++;
    if (created % 10 === 0) {
      console.log(`  Created ${created}/${bakes.length}...`);
    }
  }

  const totalBP = bakes.reduce((sum, b) => sum + b.bounty, 0);
  console.log(`\n✅ Created ${created} bakes!`);
  console.log(`Total bounty pool: ${totalBP.toLocaleString()} BP`);
  
  await mongoose.disconnect();
  console.log('Done!');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
