import './approach.css';
import { ScrollTrigger, gsap, onMotion } from '../lib/gsap';
import { scrollScrubWords } from '../lib/reveal';

export function initApproach(root: HTMLElement) {
  const headline = root.querySelector<HTMLElement>('.approach__headline');
  const lead = root.querySelector<HTMLElement>('.approach__lead');
  const paragraph = root.querySelector<HTMLElement>('.approach__paragraph');

  if (!headline) return;

  const targets = [headline, lead, paragraph].filter(Boolean) as HTMLElement[];

  onMotion(({ conditions }) => {
    if (conditions?.reduced) {
      // Reduced-motion: render full text at full opacity, no scrub.
      gsap.set(targets, { opacity: 1, clearProps: 'all' });
      return;
    }

    scrollScrubWords(targets, root, {
      id: 'approach-scrub',
      start: 'top 78%',
      end: 'bottom 35%',
      dimOpacity: 0.16,
      stagger: 0.035,
      scrub: 0.6
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
