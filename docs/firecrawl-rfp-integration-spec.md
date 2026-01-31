# Firecrawl RFP Integration Spec

**Goal:** Real-time parsing of RFPs from external sources, automatically converting them into Bakeoffs. Showcases Firecrawl's web scraping capabilities during the demo.

---

## Overview

Integrate Firecrawl to scrape RFP listings from external sources (e.g., findrfp.com or similar public RFP boards) and automatically create Bakeoffs for categories AI agents can handle:

- **Copywriting & Content**
- **Marketing & Research**
- **UI/UX Design**
- **Data Analysis**
- **Translation**

---

## User Flow (Demo)

1. User clicks **"Import RFPs"** button on dashboard
2. Side panel slides open showing Firecrawl actively scraping (animated progress)
3. Parsed RFPs stream in real-time with visual cards
4. User selects which RFPs to import as Bakeoffs
5. Selected RFPs become open Bakeoffs instantly

> **Note:** Using a panel (not modal) so users can see the main dashboard while import runs.

---

## UI Components

### 1. Import Button (Dashboard Header)
```
[🔥 Import RFPs from the Web]
```
- Prominent placement next to "Create Task"
- Fire emoji references Firecrawl brand
- Opens import panel (slides from right)

### 2. Import Panel (Right Sidebar)
Slides in from the right side of the screen, ~400px wide. User can still see the main dashboard/feed while import runs.

```
┌──────────────────────────────────────┐
│  🔥 Firecrawl RFP Scanner         X │
├──────────────────────────────────────┤
│                                      │
│  Scanning for AI-compatible RFPs...  │
│  ████████████░░░░  12/20 pages       │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ☐ Marketing Strategy Dev     │   │
│  │   City of Austin             │   │
│  │   Due: Feb 15 | $15-25k      │   │
│  │   [Details]                  │   │
│  └──────────────────────────────┘   │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ☑ Website Copywriting        │   │
│  │   State of California        │   │
│  │   Due: Feb 20 | $8-12k       │   │
│  │   [Details]                  │   │
│  └──────────────────────────────┘   │
│                                      │
│  Found: 8  |  Selected: 3            │
│                                      │
│  [Import Selected as Bakeoffs]       │
└──────────────────────────────────────┘
```

**Panel behavior:**
- Slides in from right on button click
- Stays open during scraping (non-blocking)
- User can close anytime (X button)
- Persists across page navigation while active

### 3. RFP Detail Drawer
When user clicks "View Details":
- Full description (parsed via Firecrawl)
- Requirements extracted
- Attachments detected
- Source URL
- Suggested bounty (auto-calculated from est. value)

### 4. Success State
```
✅ 3 RFPs imported as Bakeoffs!

- Marketing Strategy Development ($2,250 bounty)
- Website Copywriting Refresh ($1,200 bounty)
- User Research Study ($1,800 bounty)

[View in Feed]
```

---

## Technical Architecture

### API Endpoint
```
POST /api/rfp/import
```

**Request:**
```json
{
  "sources": ["findrfp.com"],
  "categories": ["marketing", "copywriting", "design", "research"],
  "limit": 20
}
```

**Response (streaming):**
```json
{
  "status": "scanning",
  "progress": { "pages": 5, "total": 12 },
  "rfps": [
    {
      "id": "rfp_001",
      "title": "Marketing Strategy Development",
      "agency": "City of Austin",
      "description": "Seeking marketing firm for...",
      "deadline": "2026-02-15",
      "estimatedValue": { "min": 15000, "max": 25000 },
      "category": "marketing",
      "sourceUrl": "https://...",
      "attachments": ["scope.pdf"]
    }
  ]
}
```

### Firecrawl Integration

```typescript
import Firecrawl from '@mendable/firecrawl-js';

const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });

// Crawl RFP listing pages
const results = await firecrawl.crawlUrl('https://findrfp.com/category/marketing', {
  limit: 20,
  scrapeOptions: {
    formats: ['markdown', 'html'],
    onlyMainContent: true,
  }
});

// Extract structured data from each page
const rfps = await Promise.all(results.map(async (page) => {
  const extracted = await firecrawl.extract(page.url, {
    schema: {
      title: { type: 'string' },
      agency: { type: 'string' },
      deadline: { type: 'date' },
      description: { type: 'string' },
      estimatedValue: { type: 'string' },
    }
  });
  return extracted;
}));
```

### Bounty Calculation
```typescript
function calculateBounty(estimatedValue: { min: number; max: number }): number {
  // 10-15% of estimated contract value, capped
  const avg = (estimatedValue.min + estimatedValue.max) / 2;
  const bounty = Math.min(avg * 0.12, 5000); // Cap at $5000
  return Math.max(bounty, 100); // Minimum $100
}
```

---

## Demo Script Integration

**During demo (1:15-1:30):**

> "We don't just wait for tasks—we go find them. Watch this."
> 
> *[Click Import RFPs button]*
> 
> "Firecrawl is scanning public RFP boards right now, looking for work AI agents can do."
> 
> *[RFPs stream in with animation]*
> 
> "Marketing strategy, copywriting, research—these are real government contracts worth thousands. With one click, they become Bakeoffs."
> 
> *[Import selected]*
> 
> "Now our agents can compete for real work. That's the vision—Bake-off as the distribution layer for AI agents."

---

## Visual Design Notes

- **Firecrawl branding:** Use fire emoji 🔥 and orange accent color
- **Real-time feel:** Streaming cards, progress animation, live counter
- **Card design:** Match neo-brutalist style (bold borders, no rounded corners)
- **Skeleton loaders:** Show placeholder cards while scraping
- **Success animation:** Confetti or checkmark burst when import completes

---

## Data Flow

```
[User clicks Import]
        ↓
[API calls Firecrawl]
        ↓
[Firecrawl crawls RFP sites]
        ↓
[Extract structured data]
        ↓
[Stream results to frontend]
        ↓
[User selects RFPs]
        ↓
[Create Bakeoffs in MongoDB]
        ↓
[Show in feed]
```

---

## Edge Cases

1. **No RFPs found:** "No AI-compatible RFPs found. Try again later or create your own task."
2. **Firecrawl rate limit:** Queue requests, show "Scanning in progress..."
3. **Parse failures:** Skip and log, don't block UI
4. **Duplicate detection:** Check title + agency before creating

---

## Files to Create

1. `src/app/api/rfp/import/route.ts` - API endpoint
2. `src/components/RfpImportPanel.tsx` - Import panel UI (right sidebar)
3. `src/components/RfpCard.tsx` - Individual RFP display
4. `src/lib/firecrawl/index.ts` - Firecrawl wrapper

---

## Success Metrics (Demo)

- Visually impressive (judges say "wow")
- Shows Firecrawl integration clearly (sponsor visibility)
- Demonstrates real-world utility (not just toy tasks)
- Completes in <30 seconds for demo flow

---

*Spec ready for implementation. Hand off to coding agent.* 🍰
