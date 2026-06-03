# Design System — 4th & 1 Ventures

The system. Source of truth for every visual decision. Mirrored as CSS variables in `src/styles/tokens.css`.

---

## 1. Color

Dark mode only in v1. Apple-system neutrals as the substrate, warm-gold accent as the single brand signal.

### Surfaces

| Token | Value | Use |
|---|---|---|
| `--surface-canvas` | `#0A0A0B` | Page background |
| `--surface-raised` | `#101013` | Cards, nav glass base |
| `--surface-overlay` | `#16161A` | Modals, hover plates |
| `--surface-line` | `#23232A` | Hairlines, dividers |

### Text

| Token | Value | Use |
|---|---|---|
| `--text-primary` | `#F5F5F7` | Headlines, body |
| `--text-secondary` | `#A1A1A6` | Sub-copy, captions |
| `--text-tertiary` | `#6E6E73` | Meta, labels |
| `--text-quaternary` | `#48484A` | Disabled |

### Accent — Burnished Gold

A single warm metallic. Used for the primary CTA, key numerals, section underlines, and the logotype mark. Never used on body text.

| Token | Value | Use |
|---|---|---|
| `--accent` | `#C9A961` | Primary accent |
| `--accent-hover` | `#D6B775` | Hover state |
| `--accent-muted` | `#8A7544` | Pressed / secondary |
| `--accent-glow` | `rgba(201, 169, 97, 0.18)` | Halos, focus auras |

### Functional

| Token | Value | Use |
|---|---|---|
| `--focus-ring` | `rgba(201, 169, 97, 0.6)` | `:focus-visible` outline |
| `--success` | `#30D158` | Form confirmation only |
| `--danger` | `#FF453A` | Form errors only |

---

## 2. Typography

Headlines: **SF Pro Display** with **Inter Display** as fallback. Body: **SF Pro Text** with **Inter** as fallback. Numerics use `font-feature-settings: "tnum"` everywhere stats appear.

### Font stack

```css
--font-display: -apple-system, 'SF Pro Display', 'Inter Display', system-ui, sans-serif;
--font-text: -apple-system, 'SF Pro Text', 'Inter', system-ui, sans-serif;
```

### Type scale

Tracking tightens as size grows — this is the Apple signature.

| Token | Size / Line | Tracking | Weight | Use |
|---|---|---|---|---|
| `--type-display-xl` | 88 / 92 | -0.04em | 600 | Hero tagline desktop |
| `--type-display-l` | 64 / 68 | -0.035em | 600 | Section titles desktop |
| `--type-display-m` | 48 / 54 | -0.03em | 600 | Section titles mobile / sub-display |
| `--type-display-s` | 32 / 38 | -0.02em | 600 | Card titles |
| `--type-headline` | 24 / 30 | -0.015em | 600 | Inline headlines |
| `--type-title` | 20 / 28 | -0.01em | 500 | Eyebrows when bolded |
| `--type-body-l` | 18 / 28 | 0 | 400 | Lead paragraphs |
| `--type-body` | 16 / 26 | 0 | 400 | Default body |
| `--type-body-s` | 14 / 22 | 0 | 400 | Captions |
| `--type-meta` | 12 / 18 | 0.04em | 500 | All-caps labels |
| `--type-numeral` | 120 / 110 | -0.04em | 500 | Stat numerals |

### Mobile shifts

At ≤ 768px, display sizes drop one step (`-xl` → `-l`, etc.).

---

## 3. Spacing

Power-of-two-derived. Use **only** these values. Variables: `--space-{n}` where `n` is the px value.

```
2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 120, 160, 200, 240
```

### Section rhythm

- Section vertical padding desktop: `--space-160` top, `--space-160` bottom.
- Section vertical padding mobile: `--space-80`.
- Content gutter desktop: `--space-48`.
- Content gutter mobile: `--space-24`.

### Container

- Max content width: `1200px`.
- Wide max (hero, demographics): `1440px`.
- Reading column (long copy): `680px`.

---

## 4. Radius

| Token | Value | Use |
|---|---|---|
| `--radius-s` | 6px | Inputs, small chips |
| `--radius-m` | 12px | Cards, buttons |
| `--radius-l` | 20px | Portfolio cards, large surfaces |
| `--radius-xl` | 32px | Hero panels |
| `--radius-pill` | 999px | Pills, CTAs |

---

## 5. Elevation

We don't lean on shadows. Surfaces stack via `--surface-*` tokens. A single soft elevation exists for hover/floating states.

```css
--elev-1: 0 1px 0 0 rgba(255,255,255,0.04) inset, 0 8px 24px rgba(0,0,0,0.32);
--elev-2: 0 1px 0 0 rgba(255,255,255,0.06) inset, 0 24px 64px rgba(0,0,0,0.48);
```

---

## 6. Motion

GSAP-driven. All durations and easings live as tokens; never inline a duration.

### Durations

| Token | Value | Use |
|---|---|---|
| `--dur-fast` | 0.2s | Hover, micro-interactions |
| `--dur-base` | 0.4s | Standard transitions |
| `--dur-entrance` | 0.8s | Section entrances |
| `--dur-headline` | 0.9s | Headline splits |
| `--dur-count` | 1.6s | Stat count-ups |
| `--dur-ambient` | 1.2s+ | Background parallax (scrubbed) |

### Easings

GSAP easing strings — use exactly these:

```
power2.inOut    — transitions, mode flips
power3.out      — entrances, default
expo.out        — emphatic entrances (use rarely)
none            — scrubbed scroll, constant rates
```

**Forbidden:** `back`, `elastic`, `bounce`, anything with overshoot.

### Stagger defaults

- Headline lines: `0.08s`
- Card grids: `0.06s`
- Numeral groups: `0.12s`

### Reduced motion

Wrap every ScrollTrigger in `gsap.matchMedia`:

```ts
const mm = gsap.matchMedia();
mm.add({
  reduced: '(prefers-reduced-motion: reduce)',
  normal: '(prefers-reduced-motion: no-preference)'
}, (ctx) => {
  if (ctx.conditions?.reduced) return; // set final state via CSS, do nothing
  // normal animations here
});
```

---

## 7. Iconography

**Material Symbols Rounded** only. Configuration:

```
FILL: 0
wght: 300
GRAD: 0
opsz: 24
```

Loaded once in `index.html`:

```html
<link rel="stylesheet"
  href="https://fonts.googleapis.com/css2?family=Material+Symbols+Rounded:opsz,wght,FILL,GRAD@24,300,0,0" />
```

Wrap in `<span class="icon">name_here</span>` and style `.icon { font-family: 'Material Symbols Rounded'; font-feature-settings: 'liga'; }`.

Approved icons for this site (use sparingly — most sections need zero icons):

- Hero CTA arrow: `arrow_forward`
- Criteria numerals: numbers, not icons
- Social: LinkedIn and Instagram remain as their brand SVGs, not Material Symbols (brand integrity).
- Connect: `mail_outline`
- Newsletter submit: `arrow_forward`

---

## 8. Grid

CSS Grid, 12 columns desktop, 4 columns mobile. Gutter = `--space-24` mobile, `--space-32` desktop.

```css
.grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: var(--space-32);
}
@media (max-width: 768px) {
  .grid {
    grid-template-columns: repeat(4, 1fr);
    gap: var(--space-24);
  }
}
```

---

## 9. CSS variable file (drop-in)

Save as `src/styles/tokens.css`:

```css
:root {
  /* surfaces */
  --surface-canvas: #0A0A0B;
  --surface-raised: #101013;
  --surface-overlay: #16161A;
  --surface-line: #23232A;

  /* text */
  --text-primary: #F5F5F7;
  --text-secondary: #A1A1A6;
  --text-tertiary: #6E6E73;
  --text-quaternary: #48484A;

  /* accent */
  --accent: #C9A961;
  --accent-hover: #D6B775;
  --accent-muted: #8A7544;
  --accent-glow: rgba(201, 169, 97, 0.18);
  --focus-ring: rgba(201, 169, 97, 0.6);

  /* spacing */
  --space-2: 2px;   --space-4: 4px;   --space-8: 8px;   --space-12: 12px;
  --space-16: 16px; --space-20: 20px; --space-24: 24px; --space-32: 32px;
  --space-40: 40px; --space-48: 48px; --space-64: 64px; --space-80: 80px;
  --space-96: 96px; --space-120: 120px; --space-160: 160px;
  --space-200: 200px; --space-240: 240px;

  /* radius */
  --radius-s: 6px; --radius-m: 12px; --radius-l: 20px;
  --radius-xl: 32px; --radius-pill: 999px;

  /* motion */
  --dur-fast: 0.2s;
  --dur-base: 0.4s;
  --dur-entrance: 0.8s;
  --dur-headline: 0.9s;
  --dur-count: 1.6s;

  /* fonts */
  --font-display: -apple-system, 'SF Pro Display', 'Inter Display', system-ui, sans-serif;
  --font-text: -apple-system, 'SF Pro Text', 'Inter', system-ui, sans-serif;

  /* containers */
  --container: 1200px;
  --container-wide: 1440px;
  --container-read: 680px;
}
```
