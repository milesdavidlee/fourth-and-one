import './approach.css';
import { gsap, ScrollTrigger, easings, durations, onMotion } from '../lib/gsap';
import { prepareWordReveal } from '../lib/reveal';

export function initApproach(root: HTMLElement) {
  const headline = root.querySelector<HTMLElement>('.approach__headline');
  const lead = root.querySelector<HTMLElement>('.approach__lead');
  const paragraph = root.querySelector<HTMLElement>('.approach__paragraph');

  if (!headline || !lead || !paragraph) return;

  onMotion(({ conditions }) => {
    if (conditions?.reduced) {
      gsap.set([lead, paragraph], { clearProps: 'all' });
      return;
    }

    const reveal = prepareWordReveal(headline);
    reveal.setInitial();
    gsap.set([lead, paragraph], { y: 16, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'approach-entrance',
        trigger: root,
        start: 'top 75%',
        once: true,
        invalidateOnRefresh: true
      }
    });

    tl.add(reveal.play());

    tl.to(
      lead,
      { y: 0, opacity: 1, duration: durations.entrance, ease: easings.out },
      '-=0.45'
    );

    tl.to(
      paragraph,
      { y: 0, opacity: 1, duration: durations.entrance, ease: easings.out },
      '-=0.55'
    );
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
