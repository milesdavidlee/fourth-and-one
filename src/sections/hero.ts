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

    gsap.set(split.words, { yPercent: 110, opacity: 0 });
    if (subtagline) gsap.set(subtagline, { y: 24, opacity: 0 });
    gsap.set(cta, { opacity: 0, y: 8 });
    if (mark) gsap.set(mark, { opacity: 0, x: -16 });
    if (stats) gsap.set(stats, { opacity: 0, x: 24 });

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'hero-entrance',
        trigger: root,
        start: 'top 80%',
        once: true,
        invalidateOnRefresh: true
      }
    });

    // 1) Tagline word cascade.
    tl.to(split.words, {
      yPercent: 0,
      opacity: 1,
      duration: durations.headline,
      ease: easings.out,
      stagger: 0.10
    });

    // 2) Sub-tagline slides up (optional — markup may not include one).
    if (subtagline) {
      tl.to(
        subtagline,
        { y: 0, opacity: 1, duration: durations.entrance, ease: easings.out },
        '-=0.5'
      );
    }

    // 3) CTA small slide + fade.
    tl.to(
      cta,
      { opacity: 1, y: 0, duration: durations.entrance, ease: easings.inOut },
      '-=0.55'
    );

    // 4) Editorial mark slides in from left.
    if (mark) {
      tl.to(
        mark,
        { opacity: 1, x: 0, duration: durations.entrance, ease: easings.out },
        '-=0.7'
      );
    }

    // 5) Stats card slides in from right, lands last.
    if (stats) {
      tl.to(
        stats,
        { opacity: 1, x: 0, duration: durations.entrance, ease: easings.out },
        '-=0.65'
      );
    }
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
