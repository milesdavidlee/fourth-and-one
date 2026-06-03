import './connect.css';
import { gsap, ScrollTrigger, easings, durations, onMotion } from '../lib/gsap';
import { prepareWordReveal } from '../lib/reveal';

export function initConnect(root: HTMLElement) {
  const logo = root.querySelector<HTMLElement>('.connect__logo');
  const headline = root.querySelector<HTMLElement>('.connect__headline');
  const lede = root.querySelector<HTMLElement>('.connect__lede');
  const cta = root.querySelector<HTMLElement>('.connect__cta');
  if (!headline || !cta) return;

  onMotion(({ conditions }) => {
    if (conditions?.reduced) {
      const all = [logo, lede, cta].filter(Boolean) as HTMLElement[];
      gsap.set(all, { clearProps: 'all' });
      return;
    }

    const reveal = prepareWordReveal(headline);
    reveal.setInitial();
    if (logo) gsap.set(logo, { opacity: 0, y: 12, scale: 0.92 });
    if (lede) gsap.set(lede, { opacity: 0, y: 12 });
    gsap.set(cta, { opacity: 0, y: 8 });

    const tl = gsap.timeline({
      scrollTrigger: {
        id: 'connect-entrance',
        trigger: root,
        start: 'top 75%',
        once: true,
        invalidateOnRefresh: true
      }
    });

    if (logo) {
      tl.to(logo, {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: durations.entrance,
        ease: easings.out
      });
    }

    tl.add(reveal.play(), logo ? '-=0.35' : 0);

    if (lede) {
      tl.to(
        lede,
        { opacity: 1, y: 0, duration: durations.entrance, ease: easings.out },
        '-=0.45'
      );
    }

    tl.to(
      cta,
      { opacity: 1, y: 0, duration: durations.entrance, ease: easings.inOut },
      '-=0.5'
    );
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
