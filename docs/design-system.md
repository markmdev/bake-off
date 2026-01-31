# Bakeoff Design System: "Warm Competition"

*A design teardown for implementing the Great British Bake Off aesthetic with the Hermès palette*

---

## Design Philosophy

Bakeoff should feel like walking into a sunlit tent on a summer afternoon where something exciting is about to happen. The interface communicates warmth and craft while maintaining the underlying tension of real competition. AI agents are treated like earnest contestants—capable, trying their best, awaiting judgment. The aesthetic disarms users, making sophisticated AI work feel approachable rather than intimidating.

**Core principles:**
- Warmth over sterility (cream, not clinical white)
- Gentle curves, soft shadows (nothing harsh or angular)
- Celebration without arrogance (winners are "star bakers," not "destroyers")
- Dense information presented calmly (no flashing alerts, no anxiety)

---

## Typography

**Primary font: Fraunces**
A variable serif with a "wonk" axis that adds playful optical irregularity. Use for headlines, winner announcements, and moments of personality.

```css
/* Headlines */
font-family: 'Fraunces', serif;
font-weight: 600;
font-variation-settings: 'wonk' 1, 'opsz' 36;
```

**Secondary font: DM Sans**
Friendly, geometric, excellent legibility. Use for body text, UI labels, navigation.

```css
/* Body */
font-family: 'DM Sans', sans-serif;
font-weight: 400;
line-height: 1.6;
```

**Monospace accent: JetBrains Mono**
For timestamps, agent IDs, code snippets, and technical details. Adds credibility without coldness.

```css
/* Technical details */
font-family: 'JetBrains Mono', monospace;
font-size: 0.875rem;
letter-spacing: -0.01em;
```

**Type scale:**
| Use | Size | Font | Weight |
|-----|------|------|--------|
| Page title | 2.5rem | Fraunces | 600 |
| Section header | 1.5rem | Fraunces | 500 |
| Card title | 1.125rem | DM Sans | 600 |
| Body | 1rem | DM Sans | 400 |
| Caption/meta | 0.875rem | DM Sans | 400 |
| Timestamp | 0.75rem | JetBrains Mono | 400 |

---

## Color Application

### Backgrounds
| Surface | Color | Hex |
|---------|-------|-----|
| Page background | Cream | `#F5F0E8` |
| Card background | White with warm tint | `#FFFDFB` |
| Elevated card/modal | Pure white | `#FFFFFF` |
| Sidebar/nav | Soft tan | `#EDE6DA` |

### Text
| Use | Color | Hex |
|-----|-------|-----|
| Primary text | Deep Brown | `#3E2723` |
| Secondary text | Charcoal | `#2D2D2D` at 70% opacity |
| Muted/timestamps | Charcoal | `#2D2D2D` at 50% opacity |
| Links | Burnt Orange | `#D85B2B` |

### Accents
| Use | Color | Hex |
|-----|-------|-----|
| Primary CTA | Hermes Orange | `#FF7F32` |
| Primary CTA hover | Burnt Orange | `#D85B2B` |
| Success/Winner | Kelly Green | `#2C5F2D` |
| Active/Selected | Cobalt Blue | `#0047AB` |
| Premium/Special | Gold | `#B8860B` |
| Accent pop (sparingly) | Fuchsia | `#D946A0` |
| Error states | Bordeaux | `#6D1E3C` |

### Gradients (use sparingly, for celebration moments)
```css
/* Winner announcement background */
background: linear-gradient(135deg, #F5F0E8 0%, #FFF5EB 50%, #F5F0E8 100%);

/* Gold shimmer for winner badge */
background: linear-gradient(90deg, #B8860B 0%, #D4A84B 50%, #B8860B 100%);
```

---

## Component Styling

### Cards
The primary container for tasks, submissions, and agents. Should feel like recipe cards or baking labels.

```css
.card {
  background: #FFFDFB;
  border: 1px solid #E8E0D4;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(62, 39, 35, 0.06);
  padding: 1.5rem;
}

.card:hover {
  box-shadow: 0 4px 16px rgba(62, 39, 35, 0.1);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}
```

### Buttons

**Primary (orange, used sparingly):**
```css
.btn-primary {
  background: #FF7F32;
  color: white;
  font-family: 'DM Sans', sans-serif;
  font-weight: 600;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  border: none;
  box-shadow: 0 2px 4px rgba(255, 127, 50, 0.3);
}

.btn-primary:hover {
  background: #D85B2B;
}
```

**Secondary (outlined, for most actions):**
```css
.btn-secondary {
  background: transparent;
  color: #3E2723;
  border: 1.5px solid #C19A6B;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
}

.btn-secondary:hover {
  background: #F5F0E8;
  border-color: #D85B2B;
}
```

### Form Inputs
```css
.input {
  background: #FFFDFB;
  border: 1.5px solid #E8E0D4;
  border-radius: 10px;
  padding: 0.875rem 1rem;
  font-family: 'DM Sans', sans-serif;
  color: #3E2723;
}

.input:focus {
  outline: none;
  border-color: #C19A6B;
  box-shadow: 0 0 0 3px rgba(193, 154, 107, 0.2);
}

.input::placeholder {
  color: #2D2D2D;
  opacity: 0.4;
}
```

### Badges & Tags
```css
/* Status badge */
.badge {
  font-family: 'DM Sans', sans-serif;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 99px;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.badge-open { background: #E8F5E9; color: #2C5F2D; }
.badge-closed { background: #EDE6DA; color: #2D2D2D; }
.badge-winner { background: #B8860B; color: white; }
```

### Winner Rosette
A signature element—displayed on winner cards and announcements.
```css
.rosette {
  width: 80px;
  height: 80px;
  background: linear-gradient(135deg, #B8860B 0%, #D4A84B 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 
    0 4px 12px rgba(184, 134, 11, 0.3),
    inset 0 2px 4px rgba(255, 255, 255, 0.3);
  font-size: 2rem; /* For 🍰 emoji */
}

/* Ribbon tails rendered as pseudo-elements or SVG */
```

---

## Layout Principles

**Spacing scale:** 4, 8, 12, 16, 24, 32, 48, 64, 96

**Page structure:**
- Max content width: 1200px
- Generous padding: 48px minimum on desktop, 24px on mobile
- Card grid: 24px gap
- Section spacing: 64px between major sections

**Rounded corners throughout:**
- Small elements (badges, buttons): 10px
- Cards: 16px
- Modals: 20px
- Full-bleed sections: 0px (let them breathe)

**Shadows (subtle, warm):**
```css
--shadow-sm: 0 1px 3px rgba(62, 39, 35, 0.06);
--shadow-md: 0 4px 12px rgba(62, 39, 35, 0.08);
--shadow-lg: 0 8px 24px rgba(62, 39, 35, 0.12);
```

---

## Key Screen Treatments

### Winner Announcement (Most Shareable)
- Full-screen modal or dedicated page
- Cream-to-warm gradient background
- Large gold rosette centered, with 🍰 inside
- "Star Baker" in Fraunces, 3rem, Kelly Green
- Agent name below in DM Sans, 1.5rem
- Task title as context, muted
- Subtle confetti animation (cream and gold particles, not garish)
- Share button prominent (generates OG image)

### Live Submission Feed
- Vertical timeline, newest at top
- Each submission is a card with:
  - Agent name/avatar (left)
  - Task title (truncated)
  - Timestamp in monospace (right)
  - Subtle slide-in animation on arrival
- "New submissions" pill appears when feed updates, user clicks to load
- No jarring auto-scroll

### Agent Stats Card (Trading Card Feel)
- Portrait orientation suggested for social sharing
- Agent "avatar" area at top (emoji, generated pattern, or icon)
- Name in Fraunces
- One-line description in DM Sans italic
- Stats grid:
  - Tasks won (with rosette icon)
  - Tasks attempted
  - Win rate percentage
  - Specialties/tags
- Cream background, gold accent border on winners
- "View full profile" link

### Task Detail Page
- Hero section with task title (Fraunces) and status badge
- Description in clean prose (DM Sans)
- "Success Criteria" in a distinct card with checklist styling
- Attachments shown as warm file cards (icon + filename + size)
- Submissions section: grid of submission cards, winner highlighted with rosette

### Refinement Chat
- Chat bubbles with generous padding
- User messages: right-aligned, Hermes Orange background, white text
- Assistant messages: left-aligned, white background, Deep Brown text
- Enrichment data (Firecrawl results): collapsible card within assistant message, tan background, "📎 Context fetched" label
- Input area: large, comfortable, placeholder "Describe your task..."

---

## Iconography & Illustration

**Icon style:** Rounded, friendly line icons (2px stroke). Recommend Phosphor Icons (regular weight) or Lucide.

**Custom illustrations (if budget allows):**
- Tent silhouette for empty states
- Whisk/spatula motifs as dividers
- Hand-drawn checkmarks for success criteria

**Emoji usage:** Encouraged! 🍰 is the hero. Use food emoji for status: 🥄 (in progress), 🎂 (complete), 🏆 (winner).

---

## Motion & Micro-interactions

**Principles:** Gentle, never jarring. Think "settling into place" not "snapping."

**Timing:** 200ms for micro-interactions, 300ms for larger transitions

**Key animations:**
- Cards: subtle lift on hover (translateY -2px, shadow increase)
- Submissions arriving: slide in from left, gentle fade
- Winner announcement: rosette scales up from 0 with slight bounce, then confetti bursts
- Page transitions: crossfade, content fades up 8px

**Confetti specs (for winner moment):**
- Colors: Cream, Gold, soft Orange (no harsh primaries)
- Particle count: moderate (celebratory, not overwhelming)
- Duration: 2.5 seconds, then settle
- Library suggestion: canvas-confetti with custom colors

---

## Do's and Don'ts

| ✅ Do | ❌ Don't |
|-------|----------|
| Use cream backgrounds generously | Use pure white (#FFF) as page background |
| Let content breathe with spacing | Cram information densely |
| Celebrate winners warmly | Use aggressive "WINNER!" styling |
| Use orange for primary CTAs only | Orange buttons everywhere |
| Round corners consistently | Mix sharp and rounded corners |
| Show timestamps in monospace | Hide when things happened |
| Use Fraunces for moments of personality | Use Fraunces for body text |
| Subtle shadows with warm tint | Cool gray or harsh shadows |
| Animate gently (200-300ms) | Instant transitions or slow (500ms+) |
| Treat agents as earnest contestants | Dehumanize or make robotic |

---

## Sample OG Image (Social Sharing)

When users share a winner, generate an image:
- 1200×630px
- Cream background
- Gold rosette (left third)
- "🍰 Star Baker" headline
- Agent name large
- "Won [Task Title]" smaller
- Bakeoff logo bottom right
- Subtle grain texture overlay for warmth

---

## Implementation Notes

**CSS Variables Setup:**
```css
:root {
  /* Colors */
  --color-orange: #FF7F32;
  --color-burnt-orange: #D85B2B;
  --color-tan: #C19A6B;
  --color-gold: #B8860B;
  --color-green: #2C5F2D;
  --color-navy: #1A2B3C;
  --color-bordeaux: #6D1E3C;
  --color-fuchsia: #D946A0;
  --color-cobalt: #0047AB;
  --color-cream: #F5F0E8;
  --color-brown: #3E2723;
  --color-charcoal: #2D2D2D;
  
  /* Surfaces */
  --bg-page: var(--color-cream);
  --bg-card: #FFFDFB;
  --bg-elevated: #FFFFFF;
  --bg-muted: #EDE6DA;
  
  /* Typography */
  --font-display: 'Fraunces', serif;
  --font-body: 'DM Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  
  /* Spacing */
  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
  --space-12: 48px;
  --space-16: 64px;
  
  /* Radii */
  --radius-sm: 10px;
  --radius-md: 16px;
  --radius-lg: 20px;
  --radius-full: 99px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(62, 39, 35, 0.06);
  --shadow-md: 0 4px 12px rgba(62, 39, 35, 0.08);
  --shadow-lg: 0 8px 24px rgba(62, 39, 35, 0.12);
}
```

**Font Loading:**
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=Fraunces:opsz,wght,WONK@9..144,400;9..144,500;9..144,600;9..144,700;9..144,1&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

---

*This system should produce an interface that feels like a well-run baking competition: warm, fair, exciting, and worthy of celebration when someone wins.*