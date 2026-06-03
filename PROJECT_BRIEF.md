# 4th & 1 Ventures — Website Rebuild

## Project summary

Rebuild **4thand1ventures.com** as a single-page (with optional nested routes for Team / Portfolio / Connect) immersive marketing site that elevates the firm's positioning to match the editorial restraint and motion quality of contemporary investment-firm references — specifically **hartmanncapital.com**, **namiercapital.com**, and **brightoflawards.com** — while inheriting Apple's design language for typography, spacing, color, and motion choreography.

The current site (built on Webflow) communicates the right *substance* but reads as a generic template. The rebuild keeps **every piece of existing copy and content** but presents it through a dark, airy, typographically confident system with GSAP-driven scroll choreography and Material Symbols (Rounded, 300 optical) for all iconography.

## Positioning (copy is final, not draft)

**Tagline:** Enabling Value-Creating Companies to Scale.

**Sub-tagline:** 4th & 1 Ventures — Where Winners Thrive.

**One-liner:** Fueling consumer brand and sports-tech growth in seed to Series A and B rounds, through the influence of professional athletes.

**Full description:**
4th & 1 Ventures is a Venture Angel Group that harnesses the influence and investment of top athletes and business executives. With our expertise and extensive network, we serve as a trusted partner — working alongside entrepreneurs to unlock their company's scalability and drive sustainable success.

## Information architecture

Single-page site with anchored sections. Optional nested routes preserved for legacy URLs (`/team`, `/portfolio`, `/connect`).

1. **Hero** — Tagline + sub-tagline + single primary CTA ("Learn more" anchors to Approach). Subtle ambient background motion (no autoplaying video; ScrollTrigger-driven parallax only).
2. **Approach** — "Unleash the Power of Athletes to Impact Consumer Brands." Two-column or staggered editorial layout. No bullets — use rhythm and whitespace.
3. **Member demographics** — Three large numerals: `100+ Pro Athletes`, `20+ US States`, `5 Pro Sports`. CountUp on scroll, single time, no repeat.
4. **Portfolio** — CHRONEXT, Capmo, Getsafe, parcelLab, LeanIX, Staffbase. Each: year invested, round (Series A), short description, co-investor logos. Horizontal scroll-snap or vertical stacked cards. Logos use the existing CDN URLs (see Content reference).
5. **Investment criteria** — Truly Strong Team / Compelling Market Opp / Innovative Products / Tested Scalability. Numbered 01–04. Apple-style large numerals, thin rule between rows.
6. **We believe in** — A Long-Term View / Importance of Alignment / Value of Coachability / Role of Innovative Consumer Products. Four-up grid that collapses to single column on mobile.
7. **Track record / Stats** — Active investments, capital under management ($M), funds raised by portfolio ($M). Numbers are placeholders the client will provide; treat the visual as the deliverable.
8. **Connect** — CTA section, single button to `/connect`. Newsletter input + LinkedIn + Instagram in footer.
9. **Footer** — Logo, social links, Privacy Policy, copyright.

## Visual direction

- **Mode:** Dark by default. No light-mode toggle in v1.
- **Palette:** Apple-system neutrals as the base (near-black canvas, layered greys, off-white text). Brand accent is a single warm metallic — **burnished gold** (`#C9A961` family) — used sparingly for the primary CTA, key numerals, and section underlines. The accent should feel like leather and trophy hardware, not chrome. See `DESIGN_SYSTEM.md` for tokens.
- **Type:** SF Pro Display (or Inter Display as web-safe substitute) for headlines; SF Pro Text / Inter for body. Tabular figures for stats. Tracking tightens as size grows.
- **Iconography:** Material Symbols Rounded, optical size 300, fill 0, weight 300, grade 0 — exclusively. No mixed icon sets.
- **Imagery:** Portfolio logos pulled from existing CDN. No stock photography. Hero gets a subtle generative gradient mesh or a single high-quality field-tone backdrop — not a video.
- **Density:** Airy. Large hero margins. Sections breathe at ≥120px vertical rhythm on desktop.

## Motion direction

GSAP is the primary motion driver (GSAP core + ScrollTrigger + SplitText where licensed; otherwise a CSS-class fallback for splits).

**Principles**
- Subtle is the brief. Motion serves comprehension, not spectacle.
- One choreographed entrance per section, not three.
- Easing: prefer `power3.out` for entrances, `power2.inOut` for transitions. No bouncy / elastic easings anywhere.
- Durations: 600–900ms entrances, 200–300ms hovers, 1200ms+ only for background parallax.
- Background can move continuously and slowly (subtle parallax, drifting gradient). Foreground elements move *once* on entry and then stay still.
- Respect `prefers-reduced-motion` — disable all ScrollTrigger animations, keep content visible.

**Specific moves**
- Hero headline: SplitText by line, stagger 80ms, y: 24 → 0, opacity 0 → 1, `power3.out`.
- Section headings: y: 16 → 0, opacity 0 → 1, on enter at 75% viewport.
- Stat numerals: CountUp with `ease: power2.out`, duration 1.6s, once per page load.
- Portfolio cards: stagger 60ms on enter, no scale, no rotation.
- Background: single slow vertical parallax on hero, optional grain overlay (4% opacity).

## Technical stack

- **Build:** Vite + vanilla TypeScript (or Astro if SSG is preferred). No heavy framework needed; the page is mostly static.
- **Motion:** GSAP 3.x with ScrollTrigger.
- **Icons:** Material Symbols Rounded via Google Fonts CSS link, `FILL,wght,GRAD,opsz: 0,300,0,24`.
- **Fonts:** SF Pro via system stack with Inter as fallback (Google Fonts).
- **Hosting:** Static deploy. Will be wired to a **GoDaddy domain** — keep build output portable (any static host: Netlify / Vercel / Cloudflare Pages → CNAME to GoDaddy).
- **Forms:** Newsletter input posts to a placeholder endpoint; client will provide ESP later.

## Content reference

All headline copy, descriptions, portfolio entries, criteria, and beliefs are taken verbatim from the live site (https://www.4thand1ventures.com and /about). Do not paraphrase or rewrite. Logo asset URLs are preserved on the existing `cdn.prod.website-files.com` CDN — you may continue referencing them directly during development and migrate to local assets before launch.

## Out of scope (v1)

- CMS / Webflow parity
- Light mode
- Multilingual
- Real-time portfolio data
- Custom 3D (Three.js) — *intentionally omitted*; this brand reads better with editorial calm than with WebGL. Revisit only if a specific section earns it.

## Definition of done

- All current copy present and visually elevated.
- Lighthouse: Performance ≥ 90, Accessibility ≥ 95.
- No layout shift on font load. `font-display: swap` with metric overrides.
- All motion respects `prefers-reduced-motion`.
- Works at 375 / 768 / 1024 / 1440 / 1920.
- Portfolio logos render crisp on retina.
- Footer LinkedIn + Instagram + Privacy links live.
