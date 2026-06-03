import './portfolio.css';
import { gsap, ScrollTrigger, easings, durations, onMotion } from '../lib/gsap';

export function initPortfolio(root: HTMLElement) {
  const cards = Array.from(root.querySelectorAll<HTMLElement>('.portfolio__card'));
  if (cards.length === 0) return;

  onMotion(({ conditions }) => {
    if (conditions?.reduced) {
      cards.forEach((card) => {
        const media = card.querySelector<HTMLElement>('.portfolio__media');
        const img = card.querySelector<HTMLElement>('.portfolio__img');
        const text = card.querySelector<HTMLElement>('.portfolio__text');
        if (media) gsap.set(media, { clearProps: 'all' });
        if (img) gsap.set(img, { clearProps: 'all' });
        if (text) gsap.set(text, { clearProps: 'all' });
      });
      return;
    }

    cards.forEach((card, i) => {
      const media = card.querySelector<HTMLElement>('.portfolio__media');
      const img = card.querySelector<HTMLElement>('.portfolio__img');
      const text = card.querySelector<HTMLElement>('.portfolio__text');
      if (!media || !img || !text) return;

      // === Entrance — fires once, image + text rise into view ===
      gsap.set(media, { y: 32, scale: 0.96, opacity: 0, transformOrigin: 'center center' });
      gsap.set(text, { y: 16, opacity: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          id: `portfolio-row-${i}`,
          trigger: card,
          start: 'top 80%',
          once: true,
          invalidateOnRefresh: true
        }
      });

      tl.to(media, {
        y: 0,
        scale: 1,
        opacity: 1,
        duration: durations.entrance,
        ease: easings.out
      });

      tl.to(
        text,
        { y: 0, opacity: 1, duration: durations.entrance, ease: easings.out },
        '-=0.55'
      );

      // === Continuous scrub on the image — Ken Burns. Each card's image
      //     drifts from scale 1.06 down to 1.0 as the card moves from
      //     bottom of viewport to center, then back up to 1.06 on exit. ===
      gsap.fromTo(
        img,
        { scale: 1.08, yPercent: -2 },
        {
          scale: 1.0,
          yPercent: 2,
          ease: 'none',
          scrollTrigger: {
            id: `portfolio-scrub-${i}`,
            trigger: card,
            start: 'top bottom',
            end: 'bottom top',
            scrub: 0.6,
            invalidateOnRefresh: true
          }
        }
      );
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
