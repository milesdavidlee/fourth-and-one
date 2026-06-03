import './investment-approach.css';
import { gsap, ScrollTrigger, easings, durations, onMotion } from '../lib/gsap';
import { prepareWordReveal } from '../lib/reveal';

export function initInvestmentApproach(root: HTMLElement) {
  const headline = root.querySelector<HTMLElement>('.investment-approach__headline');
  const paragraph = root.querySelector<HTMLElement>('.investment-approach__paragraph');

  if (!headline || !paragraph) return;

  onMotion(({ conditions }) => {
    if (conditions?.reduced) {
      gsap.set([paragraph], { clearProps: 'all' });
      return;
    }

    const reveal = prepareWordReveal(headline);
    reveal.setInitial();
    gsap.set(paragraph, { y: 16, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'investment-approach-entrance',
        trigger: root,
        start: 'top 75%',
        once: true,
        invalidateOnRefresh: true
      }
    });

    tl.add(reveal.play());

    tl.to(
      paragraph,
      { y: 0, opacity: 1, duration: durations.entrance, ease: easings.out },
      '-=0.45'
    );
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
