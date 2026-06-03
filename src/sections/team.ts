import './team.css';
import { gsap, ScrollTrigger, easings, durations, onMotion } from '../lib/gsap';
import { prepareWordReveal } from '../lib/reveal';

export function initTeam(root: HTMLElement) {
  const headline = root.querySelector<HTMLElement>('.team__headline');
  const lead = root.querySelector<HTMLElement>('.team__lead');
  const partnerCards = Array.from(root.querySelectorAll<HTMLElement>('.team__partner-card'));
  const smallCards = Array.from(root.querySelectorAll<HTMLElement>('.team__card'));

  if (!headline || !lead) return;

  onMotion(({ conditions }) => {
    if (conditions?.reduced) {
      const all = [lead, ...partnerCards, ...smallCards].filter(Boolean) as HTMLElement[];
      gsap.set(all, { clearProps: 'all' });
      return;
    }

    const reveal = prepareWordReveal(headline);
    reveal.setInitial();
    gsap.set(lead, { y: 16, opacity: 0 });
    if (partnerCards.length) gsap.set(partnerCards, { y: 24, opacity: 0 });
    if (smallCards.length) gsap.set(smallCards, { y: 16, opacity: 0 });

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'team-entrance',
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
      '-=0.5'
    );

    if (partnerCards.length) {
      tl.to(
        partnerCards,
        {
          y: 0,
          opacity: 1,
          duration: durations.entrance,
          ease: easings.out,
          stagger: 0.08
        },
        '-=0.45'
      );
    }

    if (smallCards.length) {
      tl.to(
        smallCards,
        {
          y: 0,
          opacity: 1,
          duration: durations.entrance,
          ease: easings.out,
          stagger: 0.06
        },
        '-=0.5'
      );
    }
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
