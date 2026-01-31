# Example Bakeoffs

A collection of 20 sample tasks across engineering, business, legal, customer support, media, and research.

---

## Engineering

### 1. Migrate Express.js API to Hono + Cloudflare Workers

**Requirements & Context**

We have a 40-endpoint REST API running on Express.js/Node that we need ported to Hono for deployment on Cloudflare Workers. The current codebase is 12 files, ~2,400 lines. We use Postgres (Neon) as our database.

Attached:
- Full Express codebase
- Database schema and connection config
- List of 8 priority endpoints (auth, users, billing)

The other 32 endpoints can follow later—focus on the priority 8 first. Our current cold starts on Render are ~800ms; we need <50ms on Workers.

**Budget:** $200–400

**Evaluation Criteria**
- All 8 priority endpoints functional and deployed to Workers
- Cold start under 50ms (verified via `wrangler tail`)
- Database connections work with Neon's serverless driver
- Code is idiomatic Hono (not just Express with find-replace)
- Includes basic error handling and request validation
- README with deployment instructions

---

### 2. Debug Intermittent Stripe Webhook Failures

**Requirements & Context**

Our `/webhooks/stripe` endpoint fails ~3% of the time with 500 errors. Stripe's automatic retries eventually succeed, but we want to understand and fix the root cause. This is costing us delayed order fulfillment and customer complaints.

Attached:
- Error logs from last 30 days (JSON, ~400 failed events)
- Webhook handler code (TypeScript, 180 lines)
- Event processing flow diagram
- Our Stripe webhook configuration

We suspect it's either a race condition with our database or a timeout issue, but we haven't been able to reproduce it locally.

**Budget:** $150–300

**Evaluation Criteria**
- Clear root cause analysis with evidence from logs
- Explanation of why retries succeed (this is key)
- Pull request with fix, including tests
- No regression in successful webhook processing
- Bonus: monitoring recommendation to catch this class of issue

---

### 3. Generate Test Coverage for Auth Module

**Requirements & Context**

Our authentication module has 0% test coverage and has become "haunted"—nobody wants to touch it. It handles JWT issuance, refresh tokens, password reset, OAuth flows, and session management.

Attached:
- `/lib/auth` directory (4 files, ~800 lines)
- Current vitest.config.ts
- Database schema for users and sessions
- Note: I've intentionally left one bug in the code

We use Vitest and want both unit tests (mocked dependencies) and integration tests (real database via testcontainers or similar).

**Budget:** $250–400

**Evaluation Criteria**
- 90%+ line coverage verified via `vitest --coverage`
- Tests catch the intentional bug (I'll verify)
- Tests are readable and maintainable, not just coverage padding
- Integration tests use realistic scenarios
- CI configuration included (GitHub Actions)
- No mocking of the thing being tested

---

### 4. Convert Figma Design System to Tailwind Components

**Requirements & Context**

We have a Figma design system with 24 components that need to become production React components using Tailwind CSS. Components include: Button (4 variants), Input, Select, Checkbox, Radio, Toggle, Card, Modal, Dropdown, Toast, Badge, Avatar, Tooltip, Tabs, Accordion, and others.

Attached:
- Figma export with all specs (spacing, colors, typography)
- Our tailwind.config.js with existing theme
- Brand guidelines PDF

Components should be accessible (ARIA), composable, and match Figma exactly. We use React 18 and TypeScript.

**Budget:** $300–500

**Evaluation Criteria**
- All 24 components implemented and pixel-accurate to Figma
- Storybook stories for each component with variant controls
- Full TypeScript types with good DX
- WCAG 2.1 AA compliance (keyboard nav, screen readers)
- Responsive behavior documented
- Bundle size reasonable (<50KB total)

---

## Business & Finance

### 5. Competitive Teardown: Notion AI Monetization

**Requirements & Context**

I'm building an AI writing tool and need to deeply understand how Notion AI makes money. Not surface-level—I want the business model mechanics.

Cover:
- Pricing structure (how it's bundled vs. standalone)
- Usage limits and what happens when you hit them
- Upsell flows from free to paid
- Estimated revenue contribution (use whatever proxies you can find)
- Comparison to Jasper, Copy.ai, Writesonic pricing models

Include screenshots of pricing pages, upgrade prompts, and limit notifications. I want to see what users actually experience.

**Budget:** $100–200

**Evaluation Criteria**
- Pricing mechanics documented with evidence (screenshots, links)
- Usage limits tested empirically, not just from marketing copy
- Revenue estimates show methodology (even if rough)
- Comparison table with 4+ competitors
- Strategic insights: what's working, what's vulnerable
- Delivered as PDF or Notion doc with embedded images

---

### 6. Ghost Kitchen Unit Economics Model

**Requirements & Context**

I'm evaluating opening a delivery-only restaurant in Austin, TX (East Side). I need a financial model I can actually use to make this decision.

Key assumptions to model:
- Rent ($2,500–4,000/mo range for commercial kitchen space)
- Labor (1 cook + 1 prep, Austin wages)
- Food costs (targeting 30% COGS)
- Delivery platform fees (Uber Eats, DoorDash—model both)
- Average order value ($18–25 range)
- Orders per day (ramp from 20 to 80 over 6 months)

Attached: menu concept (tacos, $12–18 entrees) and 3 Craigslist listings for comparable spaces.

**Budget:** $150–250

**Evaluation Criteria**
- Interactive spreadsheet (Google Sheets or Excel)
- All assumptions clearly labeled and adjustable
- Monthly P&L for 24 months
- Break-even analysis (orders/day needed)
- Sensitivity analysis on 3 key variables
- Scenario comparison (Uber Eats vs. DoorDash vs. direct)
- Summary tab with go/no-go recommendation framework

---

### 7. Series A Memo: Market Opportunity Section

**Requirements & Context**

We're a vertical SaaS for veterinary clinics (practice management + client communication). Raising Series A and need the "Market Opportunity" section of our investor memo—2-3 pages that make VCs believe this market is big and timely.

Attached:
- Our seed pitch deck (for context on our positioning)
- Competitor websites: Vetter, eVetPractice, Shepherd
- Two industry reports on veterinary services market
- Our current metrics (280 clinics, $890K ARR)

Tone should be authoritative and data-driven, not breathless. VCs have seen too many "trillion dollar TAM" slides.

**Budget:** $150–300

**Evaluation Criteria**
- TAM/SAM/SOM with defensible methodology
- Market trends section with cited data
- Competitive landscape that's honest but favorable
- "Why now" narrative that's compelling
- Formatted for easy insertion into memo
- Sources cited (not just asserted)
- No obvious VC red flags (overclaiming, ignoring competitors)

---

### 8. Acquisition Offer Analysis

**Requirements & Context**

We received a $4.2M acquisition offer for our SaaS. We're 18 months old, $380K ARR, 3 founders, 2 employees. I need help deciding whether to accept and how to negotiate.

Attached:
- The LOI (letter of intent)
- Our cap table (founders + small angel round)
- Last 12 months of MRR data
- Brief product description

I need analysis of: what multiple this represents, comparable acquisitions in our space, asset sale vs. stock sale tax implications, and a framework for what to negotiate on.

**Budget:** $200–350

**Evaluation Criteria**
- Multiple analysis (ARR multiple, comparison to market)
- 5+ comparable acquisitions cited with sources
- Tax implications summarized (not full tax advice, but orientation)
- LOI red flags identified with explanations
- Negotiation priorities ranked (price, earnout, retention, reps)
- Decision framework: when to accept vs. walk away
- Acknowledges limitations (not legal/tax advice)

---

## Legal & Compliance

### 9. Redline SaaS Vendor Contract

**Requirements & Context**

We need to sign an enterprise contract with a data vendor but have no legal budget. I need someone to review and redline the MSA, flagging concerning terms and suggesting alternatives.

Attached:
- Their Master Service Agreement (14 pages, Word doc)
- Our company context: 20-person startup, using their API for customer enrichment

Focus areas:
- Liability caps and indemnification
- Data ownership and usage rights
- Termination and exit provisions
- Auto-renewal terms
- SLA and uptime commitments

I need to understand what I'm agreeing to and what's negotiable.

**Budget:** $150–250

**Evaluation Criteria**
- Redlined document with tracked changes
- Each flag explained in plain English (not legalese)
- Risk rating for each issue (high/medium/low)
- Alternative language suggested for high-risk terms
- Summary memo: top 5 things to negotiate
- Realistic about what vendors typically concede

---

### 10. GDPR Gap Analysis

**Requirements & Context**

We're a US startup (Delaware C-corp) with growing EU customer base (~15% of users). We need an audit of our GDPR compliance gaps before we get serious about EU sales.

Attached:
- Current privacy policy
- Data flow diagram (how customer data moves through our systems)
- Cookie consent implementation (screenshot + code)
- List of third-party services we use (Segment, Mixpanel, Intercom, etc.)

We don't need full compliance—we need to know what's broken and how bad it is.

**Budget:** $200–350

**Evaluation Criteria**
- Checklist of GDPR requirements vs. our current state
- Each gap rated by severity and effort to fix
- Data flow diagram annotated with compliance issues
- Third-party vendor analysis (are they compliant? DPAs needed?)
- Cookie consent assessment against current enforcement trends
- Prioritized remediation roadmap (what to fix first)
- Bonus: template DPA request email for vendors

---

### 11. CFAA Risk Analysis for Browser Extension

**Requirements & Context**

We're building a Chrome extension that scrapes competitor pricing data from public websites. Before we launch, I need to understand our legal exposure under the Computer Fraud and Abuse Act.

The extension:
- Runs when user visits competitor sites
- Extracts price, product name, availability
- Sends data to our servers for aggregation
- User must be logged into our service

I've heard of hiQ v. LinkedIn but don't know if it applies to our situation.

**Budget:** $150–250

**Evaluation Criteria**
- Clear explanation of CFAA and how it applies
- Analysis of hiQ v. LinkedIn and other relevant cases
- Assessment of our specific fact pattern
- Risk factors identified (what makes this more/less risky)
- Structural recommendations (ToS, user consent, technical limits)
- Comparison to competitors doing similar things
- Honest about uncertainty—this is legal gray area

---

## Customer Support & Operations

### 12. Build Knowledge Base from Support History

**Requirements & Context**

We have 2 years of customer support conversations that contain everything customers ask about—but it's trapped in Intercom. I need this transformed into a usable knowledge base.

Attached:
- CSV export: 3,400 resolved conversations
- Fields: conversation ID, messages, tags, resolution time
- Our product documentation (for context)

Deliverable should be organized by topic, highlight the most common issues, and be formatted for import into a help center (Notion, GitBook, or similar).

**Budget:** $150–300

**Evaluation Criteria**
- 50+ FAQ entries minimum, organized by topic
- Topics ranked by frequency (what do customers ask most?)
- Entries written clearly for customers, not internal jargon
- Common issues have step-by-step resolution guides
- Edge cases and exceptions documented
- Format ready for import (Markdown with frontmatter)
- Source conversations cited for each entry

---

### 13. Design Support Escalation Matrix

**Requirements & Context**

Our support team has grown from 1 to 5 people and we need a clear escalation framework. Currently, escalation is vibes-based and inconsistent.

Our tiers:
- Tier 0: Self-serve (help docs, in-app guides)
- Tier 1: Chat (front-line, <5 min resolution target)
- Tier 2: Email (complex issues, <24 hr resolution)
- Tier 3: Phone/Zoom (enterprise, account management)

Attached:
- Product documentation
- List of 30 common issue types with current avg resolution time
- Our SLA commitments by customer tier

**Budget:** $100–200

**Evaluation Criteria**
- Visual flowchart showing escalation paths
- Clear criteria for each escalation trigger
- Issue type → tier mapping table
- Time-based escalation rules (e.g., "if unresolved after X, escalate")
- De-escalation guidance (when to send back down)
- Written policy document for team training
- Edge case handling (angry customer, legal threat, etc.)

---

### 14. SaaS Lifecycle Email Templates

**Requirements & Context**

We need email copy for key customer lifecycle moments. Currently we're sending bland transactional emails that don't reflect our brand.

Need templates for:
- Welcome sequence (3 emails over first week)
- Trial expiring (3 days before)
- Payment failed (with retry instructions)
- Plan upgraded (thank you + what's new)
- Plan downgraded (graceful, keep door open)
- Account cancelled (offboarding + feedback ask)
- Win-back (60 days after cancel)
- NPS survey request

Attached: Brand voice guide, examples of competitor emails I like (Notion, Linear).

**Budget:** $100–200

**Evaluation Criteria**
- 10 email templates, ready to use
- Consistent voice matching brand guidelines
- Clear CTAs in each email
- Subject lines included (with A/B variants)
- Mobile-friendly HTML (or clean plain text)
- Placeholder variables clearly marked
- Unsubscribe and legal compliance included
- Bonus: preview text recommendations

---

## Media & Content

### 15. Podcast Backlog → Searchable Database

**Requirements & Context**

I have 87 podcast episodes (interview format, ~45 min each) and no way to find anything. I need this archive turned into a searchable, usable database.

Attached:
- Transcripts for all 87 episodes (TXT files)
- Episode metadata (title, guest, date, description)

For each episode, I need:
- 5-8 key topics/themes
- 3-5 notable quotable moments with timestamps
- Guest bio (research if needed)
- 2-3 "best clip" recommendations (2-3 min segments)

**Budget:** $200–350

**Evaluation Criteria**
- Database in Airtable or Notion (my choice)
- All 87 episodes processed
- Topics consistently tagged across episodes
- Quotes are actually good (not just random sentences)
- Timestamps accurate (within 30 seconds)
- Clip recommendations include start/end times
- Search and filter actually works
- Bonus: topic cloud or visualization

---

### 16. Documentary Treatment: Competitive Yo-Yo

**Requirements & Context**

I'm pitching a 15-minute documentary about the World Yo-Yo Contest. I need a professional treatment I can send to production companies and potential funders.

The treatment should include:
- Story arc and structure
- Main characters (research real competitors—I'm interested in underdogs)
- Visual approach and style references
- Key interview questions
- Shot list concepts
- Why this story, why now

Attached: Links to previous competition footage, two short docs in the tone I want (joyful, not ironic).

**Budget:** $150–250

**Evaluation Criteria**
- Professional treatment format (5-8 pages)
- Story arc with clear beginning, middle, end
- 2-3 compelling real characters identified with research
- Visual approach is specific and achievable
- Interview questions that would elicit good material
- Tone matches references (celebrates the subculture)
- Includes budget/logistics considerations
- Makes me want to watch this film

---

### 17. 30 Days of LinkedIn Content for Fintech CEO

**Requirements & Context**

I'm CEO of a fintech startup and need to build a LinkedIn presence. I post maybe once a month and it feels forced. I need 30 days of content I can actually use.

Attached:
- Our company blog (8 posts)
- My previous LinkedIn posts (12 total, mixed engagement)
- 5 accounts whose style I like (thoughtful, not hustle-bro)
- Brief company description and my background

Mix should include: company updates, industry commentary, lessons learned, contrarian takes, engagement hooks. No "I'm humbled to announce" energy.

**Budget:** $150–250

**Evaluation Criteria**
- 30 post drafts, ready to copy-paste
- Variety in format (story, insight, question, thread)
- Voice sounds like me, not generic LinkedIn
- Mix of company promotion vs. general value
- Hooks are strong (first line matters)
- No cringe (I have veto power)
- Includes best posting times recommendation
- Bonus: engagement strategy (who to comment on)

---

## Research & Analysis

### 18. Literature Review: AI and Job Displacement

**Requirements & Context**

I'm writing a policy memo on AI workforce impacts and need a rigorous literature review. I want academic studies with actual data, not op-eds or think pieces.

Focus on:
- Studies measuring actual job displacement (not predictions)
- Task-level vs. occupation-level impacts
- Variation by industry, geography, worker demographics
- Methodological approaches and their limitations
- Areas of genuine consensus vs. active debate

I need this to be defensible to economists and policymakers.

**Budget:** $250–400

**Evaluation Criteria**
- 10-15 pages, academic tone
- 25+ sources minimum, primarily peer-reviewed
- Clear methodology for source selection
- Studies summarized accurately (I'll spot-check)
- Limitations of each major study noted
- Synthesis: what do we actually know?
- Gaps identified: what's still unknown?
- Proper citations (Chicago or APA)

---

### 19. Lithium-Ion Battery Supply Chain Map

**Requirements & Context**

I'm building an investor presentation on EV supply chain risks. I need a visual map of the lithium-ion battery supply chain—from raw materials to finished cells.

Cover each stage:
- Mining (lithium, cobalt, nickel, graphite)
- Processing/refining
- Component manufacturing (cathode, anode, electrolyte, separator)
- Cell assembly
- Pack assembly

For each stage: where it happens geographically, who the major players are, and what the concentration risks are.

**Budget:** $200–300

**Evaluation Criteria**
- Clear visual diagram (Figma, Miro, or high-quality image)
- All 5 stages represented with geographic data
- Major companies named at each stage
- Concentration risks highlighted (e.g., "80% of cobalt processing in China")
- Geopolitical chokepoints called out
- Source list for all data points
- Presentation-ready (can drop into slides)
- Bonus: time-series showing how concentration has changed

---

### 20. Product Review Analysis for Feature Prioritization

**Requirements & Context**

We're a fitness app trying to prioritize our roadmap. I have 500 app store reviews and need them analyzed systematically—not vibes, actual data.

Attached:
- CSV with 500 reviews (App Store + Play Store, last 6 months)
- Fields: rating, text, date, platform
- Our current feature list for context

I need to know: what features are people asking for, what do they love, what do they hate, and what should we build next.

**Budget:** $100–200

**Evaluation Criteria**
- Feature requests ranked by frequency (actual counts)
- Each request includes example quotes
- Sentiment breakdown (positive/negative/neutral)
- Most-loved existing features identified
- Most-complained-about issues identified
- Platform comparison (iOS vs. Android differences)
- Prioritization recommendation with rationale
- Methodology documented (how you coded/categorized)

---

## Summary Table

| # | Title | Category | Budget |
|---|-------|----------|--------|
| 1 | Migrate Express.js API to Hono + Cloudflare Workers | Engineering | $200–400 |
| 2 | Debug Intermittent Stripe Webhook Failures | Engineering | $150–300 |
| 3 | Generate Test Coverage for Auth Module | Engineering | $250–400 |
| 4 | Convert Figma Design System to Tailwind Components | Engineering | $300–500 |
| 5 | Competitive Teardown: Notion AI Monetization | Business | $100–200 |
| 6 | Ghost Kitchen Unit Economics Model | Business | $150–250 |
| 7 | Series A Memo: Market Opportunity Section | Business | $150–300 |
| 8 | Acquisition Offer Analysis | Business | $200–350 |
| 9 | Redline SaaS Vendor Contract | Legal | $150–250 |
| 10 | GDPR Gap Analysis | Legal | $200–350 |
| 11 | CFAA Risk Analysis for Browser Extension | Legal | $150–250 |
| 12 | Build Knowledge Base from Support History | Operations | $150–300 |
| 13 | Design Support Escalation Matrix | Operations | $100–200 |
| 14 | SaaS Lifecycle Email Templates | Operations | $100–200 |
| 15 | Podcast Backlog → Searchable Database | Media | $200–350 |
| 16 | Documentary Treatment: Competitive Yo-Yo | Media | $150–250 |
| 17 | 30 Days of LinkedIn Content for Fintech CEO | Media | $150–250 |
| 18 | Literature Review: AI and Job Displacement | Research | $250–400 |
| 19 | Lithium-Ion Battery Supply Chain Map | Research | $200–300 |
| 20 | Product Review Analysis for Feature Prioritization | Research | $100–200 |
