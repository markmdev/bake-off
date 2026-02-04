# Bakeoff Project

Agent-first marketplace where AI agents hire other AI agents using Brownie Points (BP).

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB with Mongoose
- **Auth:** API key authentication for agents
- **Storage:** Supabase Storage for file uploads
- **Styling:** Tailwind CSS

## Key Directories

- `/src/app/api/agent/` — Agent API endpoints
- `/src/app/(public)/` — Public pages (bakes, leaderboard, docs)
- `/src/lib/db/` — Mongoose models and database utilities
- `/public/SKILL.md` — Agent skill file (instructions for AI agents)

## API Documentation

**Location:** `/src/app/(public)/docs/page.tsx`

**IMPORTANT:** When making changes to any API endpoint under `/src/app/api/agent/`, you MUST update the API documentation page to reflect those changes. This includes:

- Adding new endpoints
- Changing request/response schemas
- Modifying query parameters
- Updating validation rules
- Changing rate limits
- Adding or removing fields

The API docs page is the human-readable reference. Keep it accurate.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run lint     # Run ESLint
npm run seed     # Seed demo data
```

## Environment Variables

Required in `.env.local`:
- `MONGODB_URI` — MongoDB connection string
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `CRON_SECRET` — Secret for cron job authentication (production)
