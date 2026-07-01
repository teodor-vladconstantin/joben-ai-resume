# JOBEN.EU — MASTER DESIGN SYSTEM PROMPT
# Paste this into CLAUDE.md at the root of your project.
# Claude Code will use this as the single source of truth for ALL design decisions.

---

## MISSION

Redesign the entire Joben.eu frontend. Every page, every component, every visual detail.
Do NOT touch business logic, API routes, auth logic, Stripe/Supabase configs, or database queries.
ONLY the visual layer: layout, colors, typography, spacing, components.

---

## DESIGN DIRECTION

Style reference: Linear.app
Aesthetic: Brutally minimal dark. Zero decoration. Whitespace as a tool. Typography does all the work.
Mood: Premium dev tool. Serious. Fast. Focused.
Brand color: #2CB87A (Joben Green) — used for primary actions, focus states, active nav, badges.
Forbidden: gradients on text, glassmorphism, card shadows everywhere, purple-on-white, decorative icons, animations for the sake of animations.

---

## DESIGN TOKENS

Apply these EVERYWHERE via CSS variables and Tailwind config. Never hardcode a color or size.

### Colors

```css
:root {
  /* Backgrounds */
  --bg-base:      #080808;   /* page background */
  --bg-subtle:    #0F0F0F;   /* slightly elevated surface */
  --bg-surface:   #141414;   /* cards, panels */
  --bg-elevated:  #1A1A1A;   /* modals, dropdowns */
  --bg-hover:     #1F1F1F;   /* hover state on interactive elements */

  /* Borders */
  --border-faint:  #1C1C1C;  /* barely visible separators */
  --border-soft:   #242424;  /* default border */
  --border-medium: #2E2E2E;  /* emphasized border */
  --border-strong: #3D3D3D;  /* focus ring base */

  /* Text */
  --text-primary:   #F2F2F2;  /* headings, important labels */
  --text-secondary: #A0A0A0;  /* body, descriptions */
  --text-muted:     #5A5A5A;  /* placeholders, metadata */
  --text-disabled:  #333333;  /* disabled state */

  /* Accent — Joben Green */
  --accent:         #2CB87A;
  --accent-hover:   #34C985;
  --accent-muted:   #2CB87A1A; /* 10% opacity background */
  --accent-border:  #2CB87A40; /* 25% opacity border */

  /* Semantic */
  --success:        #2CB87A;
  --success-muted:  #2CB87A1A;
  --error:          #E5484D;
  --error-muted:    #E5484D1A;
  --warning:        #F76B15;
  --warning-muted:  #F76B151A;
}
```

### Tailwind Config Extension

```ts
// tailwind.config.ts
theme: {
  extend: {
    colors: {
      bg: {
        base:     'var(--bg-base)',
        subtle:   'var(--bg-subtle)',
        surface:  'var(--bg-surface)',
        elevated: 'var(--bg-elevated)',
        hover:    'var(--bg-hover)',
      },
      border: {
        faint:  'var(--border-faint)',
        soft:   'var(--border-soft)',
        medium: 'var(--border-medium)',
        strong: 'var(--border-strong)',
      },
      text: {
        primary:   'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        muted:     'var(--text-muted)',
        disabled:  'var(--text-disabled)',
      },
      accent: {
        DEFAULT: 'var(--accent)',
        hover:   'var(--accent-hover)',
        muted:   'var(--accent-muted)',
        border:  'var(--accent-border)',
      },
    },
    fontFamily: {
      sans: ['Geist', 'system-ui', 'sans-serif'],
      mono: ['Geist Mono', 'monospace'],
    },
    fontSize: {
      'hero':    ['clamp(2.75rem, 6vw, 5.5rem)', { lineHeight: '1.02', letterSpacing: '-0.04em', fontWeight: '600' }],
      'display': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.03em', fontWeight: '600' }],
      'title':   ['1.5rem',  { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '600' }],
      'heading': ['1.125rem',{ lineHeight: '1.4', letterSpacing: '-0.01em', fontWeight: '500' }],
      'body':    ['0.875rem',{ lineHeight: '1.6', fontWeight: '400' }],
      'small':   ['0.8125rem',{ lineHeight: '1.5', fontWeight: '400' }],
      'xs':      ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
    },
    borderRadius: {
      'sm': '4px',
      'md': '6px',
      'lg': '8px',
      'xl': '12px',
    },
    boxShadow: {
      'subtle': '0 1px 2px rgba(0,0,0,0.4)',
      'medium': '0 4px 12px rgba(0,0,0,0.5)',
      'none':   'none',
    },
    spacing: {
      'page': '1.5rem',       /* mobile page padding */
      'page-lg': '2.5rem',    /* desktop page padding */
    },
  },
}
```

---

## TYPOGRAPHY RULES

Font to install: Geist (next/font/google or @vercel/font — free)

```tsx
// app/layout.tsx
import { Geist, Geist_Mono } from 'next/font/google'

const geist = Geist({ subsets: ['latin'], variable: '--font-geist' })
const geistMono = Geist_Mono({ subsets: ['latin'], variable: '--font-geist-mono' })
```

Rules:
- Headings: `text-text-primary`, `font-semibold`, negative letter-spacing
- Body: `text-text-secondary`, `font-normal`
- Labels/metadata: `text-text-muted`, `text-xs`
- Code/technical: `font-mono`, `text-text-secondary`
- NO font-bold except for display headings
- NO font-black anywhere

---

## COMPONENT SYSTEM

### Button

```tsx
// Variants: primary | ghost | destructive | outline

// Primary
<button className="
  inline-flex items-center gap-1.5 px-3 py-1.5
  bg-accent hover:bg-accent-hover
  text-white text-body font-medium
  rounded-md border border-accent-border
  transition-colors duration-150
  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent
">

// Ghost (most common in nav/actions)
<button className="
  inline-flex items-center gap-1.5 px-3 py-1.5
  bg-transparent hover:bg-bg-hover
  text-text-secondary hover:text-text-primary text-body
  rounded-md border border-transparent
  transition-colors duration-150
">

// Outline
<button className="
  inline-flex items-center gap-1.5 px-3 py-1.5
  bg-transparent hover:bg-bg-hover
  text-text-primary text-body
  rounded-md border border-border-soft
  transition-colors duration-150
">

// Destructive
<button className="
  inline-flex items-center gap-1.5 px-3 py-1.5
  bg-transparent hover:bg-error/10
  text-error text-body
  rounded-md border border-transparent hover:border-error/20
  transition-colors duration-150
">
```

### Input

```tsx
<input className="
  w-full px-3 py-1.5
  bg-bg-subtle border border-border-soft
  text-text-primary text-body placeholder:text-text-muted
  rounded-md
  focus:outline-none focus:border-border-strong focus:ring-1 focus:ring-border-strong
  transition-colors duration-150
"/>
```

### Card / Panel

```tsx
// Default card
<div className="bg-bg-surface border border-border-soft rounded-lg p-4">

// Elevated (modal-like)
<div className="bg-bg-elevated border border-border-medium rounded-xl p-6">

// Clickable card (hover state)
<div className="
  bg-bg-surface border border-border-soft rounded-lg p-4
  hover:border-border-medium hover:bg-bg-hover
  cursor-pointer transition-colors duration-150
">
```

### Badge / Tag

```tsx
// Neutral
<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-bg-elevated text-text-secondary border border-border-soft">

// Accent
<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-accent/10 text-accent border border-accent/25">

// Success
<span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-success/10 text-success border border-success/25">
```

### Divider

```tsx
<hr className="border-border-faint" />
```

### Label (form)

```tsx
<label className="block text-xs font-medium text-text-muted uppercase tracking-wide mb-1.5">
```

---

## LAYOUT RULES

### Page wrapper

```tsx
<div className="min-h-screen bg-bg-base text-text-primary font-sans antialiased">
```

### Sidebar layout (dashboard)

```tsx
<div className="flex h-screen overflow-hidden bg-bg-base">
  {/* Sidebar */}
  <aside className="w-56 border-r border-border-faint flex flex-col shrink-0">
    {/* Logo */}
    <div className="h-11 flex items-center px-4 border-b border-border-faint">
      <span className="text-heading font-semibold text-text-primary">Joben</span>
    </div>
    {/* Nav */}
    <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
      {/* nav items */}
    </nav>
    {/* Bottom actions */}
    <div className="p-2 border-t border-border-faint">
      {/* user / settings */}
    </div>
  </aside>

  {/* Main */}
  <main className="flex-1 overflow-y-auto">
    {/* Page header */}
    <div className="h-11 border-b border-border-faint flex items-center px-6 justify-between">
      <h1 className="text-heading font-medium text-text-primary">{pageTitle}</h1>
      <div className="flex items-center gap-2">{/* actions */}</div>
    </div>
    {/* Content */}
    <div className="p-6">{children}</div>
  </main>
</div>
```

### Sidebar nav item

```tsx
// Active
<a className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md bg-bg-hover text-text-primary text-body">

// Inactive
<a className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-text-secondary hover:text-text-primary hover:bg-bg-hover text-body transition-colors">
```

### Content max-width

```tsx
// For pages with no sidebar
<div className="max-w-3xl mx-auto px-6 py-10">

// For wide content (resume editor)
<div className="max-w-6xl mx-auto px-6 py-8">
```

---

## PAGE-BY-PAGE INSTRUCTIONS

### 1. Landing Page (`/`)

Structure (top to bottom):
- Navbar: logo left, nav links center (ghost buttons), CTA right (primary button). Border-bottom border-faint. Height: 56px.
- Hero: centered, max-w-2xl. Badge on top ("AI-Powered Resume Builder" — accent badge). H1 large display text. Subtext in text-secondary. Two CTAs: primary + ghost. No background illustration, no gradient blob.
- Social proof bar: logos or "trusted by X students" — text-muted, centered.
- Features section: 3-column grid. Each feature: icon (text-accent, 16px), heading, description. No card borders unless bg-surface.
- Pricing section: 2 cards (Free + Pro). Pro card has accent border + subtle accent background. No flashy gradients.
- Footer: 3-column links, logo, copyright. All text-muted. Border-top border-faint.

### 2. Auth Pages (`/sign-in`, `/sign-up`)

```
Full page: bg-bg-base
Center card: max-w-sm, bg-bg-surface, border border-soft, rounded-xl, p-8
Logo at top (centered)
H1: "Sign in to Joben" — text-title
Subtext: text-secondary
Form: email + password inputs, primary button full-width
OAuth divider: "or continue with" — text-muted
OAuth buttons: outline variant, full-width
Link to sign-up: text-accent, no underline
```

### 3. Dashboard (`/dashboard`)

Sidebar + main layout (see layout above).
Main content:
- Stats row: 3-4 metric cards. Each: label (text-muted, xs), value (text-title, text-primary), optional delta (success/error badge).
- Recent resumes: table or card list. Each row: resume name, date, status badge, actions (ghost icon buttons).
- Quick action: "Create new resume" button prominent at top right of header.

### 4. Resume Editor (`/resume/[id]`)

Split layout:
- Left panel (40%): form sections, collapsible. Inputs are bg-bg-subtle. Section headers: text-xs text-muted uppercase tracking-wide.
- Right panel (60%): live PDF preview. bg-bg-subtle border-l border-faint. Sticky.
- Top bar: resume name (editable inline — click to edit), Save button, Download button, back arrow.

### 5. Pricing Page (`/pricing`)

- H1 centered, subtext
- Toggle: monthly/annual (ghost pill toggle)
- 2 cards side by side: Free (bg-surface, border-soft), Pro (bg-surface, border-accent + shadow-medium)
- Feature list per card: checkmark icon (text-success for included, text-disabled for not), text-body
- CTA per card: outline (Free), primary (Pro)

### 6. Settings (`/settings`)

- Left nav: vertical list of sections (Account, Billing, Notifications) — sidebar nav item style
- Right content: forms, each section as a card with heading + description + form fields
- Danger zone: separate card at bottom, error border, destructive button

---

## ICONS

Use `lucide-react` ONLY. Size: 14px or 16px. Color: inherit from text color (currentColor).
```tsx
import { ChevronRight, Plus, FileText } from 'lucide-react'
<ChevronRight size={14} className="text-text-muted" />
```
Never use emoji as icons. Never use icon fonts.

---

## ANIMATIONS

Minimal. Only these are allowed:
- `transition-colors duration-150` on all interactive elements (buttons, links, inputs)
- `transition-opacity duration-200` for fades (modals, tooltips)
- `transition-transform duration-200` for dropdowns opening
- No bounce, no spring physics, no complex keyframes

---

## SPACING RULES

- Between page sections: `py-16` or `py-20`
- Between form fields: `space-y-4`
- Between list items: `space-y-1` or `space-y-2`
- Between heading and content: `mt-1` or `mt-2`
- Page padding: `px-6` (desktop), `px-4` (mobile)
- Card padding: `p-4` (compact), `p-6` (default)

---

## WHAT TO NEVER DO

- No `shadow-lg` or heavy box shadows on cards
- No text gradients (no bg-clip-text tricks)
- No glassmorphism (no backdrop-blur unless it's a modal overlay)
- No border-radius above `rounded-xl` (12px) — **except** the marketing hero CTA, which may use `rounded-full` (pill), matching the ResuMax-inspired hero treatment below
- No font sizes above `2.5rem` for in-app display text — **except** the marketing hero H1, which uses the `--text-hero` token (see Marketing Hero Exception)
- No `font-black` or `font-extrabold`
- No colored backgrounds on sections (no purple sections, no dark-blue hero)
- No stock photo backgrounds
- No decorative SVG blobs — a faint, non-interactive "live product data" text texture on the marketing hero is allowed (see Marketing Hero Exception), since it's product-flavored, not decorative
- No `opacity-50` as a hover state (use color tokens instead)
- No mixing of accent colors — green only, no rainbow

### Marketing Hero Exception

The public marketing surface (`/`, `/pricing`) intentionally matches ResuMax's visual energy (adapted to Joben green, never pink):
- H1 uses `text-hero` (`clamp(2.75rem, 6vw, 5.5rem)`, tracking `-0.04em`) instead of `text-display`
- Primary hero CTA uses `rounded-full` instead of `rounded-md`
- Hero section may render a `HeroDataTexture` background: faint (`opacity ~10-15%`), `pointer-events-none`, monospace snippets of realistic product events (e.g. "resume tailored", "match found · Stripe"), never real user data
- This exception is scoped to the marketing hero only — dashboard, builder, settings, and all authenticated app screens stay within the original brutal-minimal constraints (`rounded-xl` max, `text-display` max, no background texture)

---

## IMPLEMENTATION ORDER

Execute in this exact order to avoid breaking the live app:

1. Install Geist font, set up CSS variables in `globals.css`, update `tailwind.config.ts`
2. Build shared components: Button, Input, Badge, Card, Divider (in `components/ui/`)
3. Build Sidebar + layout shell (in `components/layout/`)
4. Apply to: Landing page
5. Apply to: Auth pages
6. Apply to: Dashboard
7. Apply to: Resume editor
8. Apply to: Pricing page
9. Apply to: Settings
10. Final audit: check every page for hardcoded colors, inconsistent spacing, missing hover states

---

## FINAL RULE

If you are unsure about a design decision, choose the MORE MINIMAL option.
Less is always correct. When in doubt, remove it.