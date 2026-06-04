import './investment-approach.css';
import { ScrollTrigger, gsap, onMotion } from '../lib/gsap';
import { scrollScrubWords } from '../lib/reveal';

export function initInvestmentApproach(root: HTMLElement) {
  const headline = root.querySelector<HTMLElement>('.investment-approach__headline');
  const paragraph = root.querySelector<HTMLElement>('.investment-approach__paragraph');

  if (!headline || !paragraph) return;

  onMotion(({ conditions }) => {
    if (conditions?.reduced) {
      gsap.set([headline, paragraph], { opacity: 1, clearProps: 'all' });
      return;
    }

    scrollScrubWords([headline, paragraph], root, {
      id: 'investment-approach-scrub',
      start: 'top 78%',
      end: 'bottom 35%',
      dimOpacity: 0.16,
      stagger: 0.035,
      scrub: 0.6
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
