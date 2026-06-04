import './hero.css';
import { gsap, ScrollTrigger, easings, durations, onMotion } from '../lib/gsap';
import { splitWords } from '../lib/split';

export function initHero(root: HTMLElement) {
  const tagline = root.querySelector<HTMLElement>('.hero__tagline');
  const subtagline = root.querySelector<HTMLElement>('.hero__subtagline');
  const cta = root.querySelector<HTMLElement>('.hero__cta');
  const mark = root.querySelector<HTMLElement>('.hero__mark');
  const stats = root.querySelector<HTMLElement>('.hero__stats');
  const footballCanvas = document.getElementById('football-canvas') as HTMLCanvasElement | null;

  // sub-tagline was removed from the markup per client copy update — treat
  // it as optional. Only tagline + cta are required to wire the hero.
  if (!tagline || !cta) return;

  const split = splitWords(tagline);

  // Three.js football scene. Persistent across the first ~3 viewport heights;
  // the canvas is positioned fixed behind the content so the football is the
  // through-line as you scroll.
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (footballCanvas && !reduced) {
    import('./hero-football').then(({ initHeroFootball }) => {
      initHeroFootball(footballCanvas);
    });
  }

  onMotion(({ conditions }) => {
    if (conditions?.reduced) {
      const extras = [subtagline, mark, stats].filter(Boolean) as HTMLElement[];
      gsap.set([split.words, cta, ...extras], { clearProps: 'all' });
      return;
    }

    // Pin the hero in its pre-entrance state immediately on init so nothing
    // flashes before the loader dismisses. Entrance plays on the
    // 'intro-ready' event dispatched by main.ts after loader fade.
    gsap.set(split.words, { yPercent: 110, opacity: 0 });
    if (subtagline) gsap.set(subtagline, { y: 24, opacity: 0 });
    gsap.set(cta, { opacity: 0, y: 8 });
    if (mark) gsap.set(mark, { opacity: 0, x: -16 });
    if (stats) gsap.set(stats, { opacity: 0, x: 24 });

    const playEntrance = () => {
      // Delay the text timeline so the football intro (ball falls / rotates
      // / scales into hero pose, ~1.1s) plays first. Text starts overlapping
      // the tail end of the ball settling, lands ~1s after the ball does.
      const tl = gsap.timeline({ delay: 0.7 });

      // 1) Editorial mark fades in first — sets the tone before the headline.
      if (mark) {
        tl.to(mark, {
          opacity: 1,
          x: 0,
          duration: durations.entrance,
          ease: easings.out
        });
      }

      // 2) Tagline word cascade — the moment the hero declares itself.
      tl.to(
        split.words,
        {
          yPercent: 0,
          opacity: 1,
          duration: durations.headline,
          ease: easings.out,
          stagger: 0.08
        },
        '-=0.4'
      );

      // 3) Sub-tagline slides up (optional — markup may not include one).
      if (subtagline) {
        tl.to(
          subtagline,
          { y: 0, opacity: 1, duration: durations.entrance, ease: easings.out },
          '-=0.5'
        );
      }

      // 4) CTA small slide + fade — lands last so the eye finishes on the
      // call to action.
      tl.to(
        cta,
        { opacity: 1, y: 0, duration: durations.entrance, ease: easings.inOut },
        '-=0.45'
      );

      // 5) Stats card (if present) slides in from right alongside the CTA.
      if (stats) {
        tl.to(
          stats,
          { opacity: 1, x: 0, duration: durations.entrance, ease: easings.out },
          '<'
        );
      }
    };

    document.addEventListener('intro-ready', playEntrance, { once: true });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
