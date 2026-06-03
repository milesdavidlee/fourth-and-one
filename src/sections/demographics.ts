import './demographics.css';
import { gsap, ScrollTrigger, easings, durations, onMotion } from '../lib/gsap';

export function initDemographics(root: HTMLElement) {
  const numerals = Array.from(
    root.querySelectorAll<HTMLElement>('.demographics__numeral')
  );
  if (numerals.length === 0) return;

  // Markup carries the final value (e.g. "100+") for crawlers and reduced-motion.
  // When motion is enabled we reset to "0[suffix]" before the count-up fires.
  onMotion(({ conditions }) => {
    if (conditions?.reduced) return;

    numerals.forEach((n) => {
      const suffix = n.getAttribute('data-suffix') ?? '';
      n.textContent = `0${suffix}`;
    });

    ScrollTrigger.create({
      id: 'demographics-entrance',
      trigger: root,
      start: 'top 75%',
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => {
        numerals.forEach((n, i) => {
          const target = parseInt(n.getAttribute('data-count') ?? '0', 10);
          const suffix = n.getAttribute('data-suffix') ?? '';
          const proxy = { val: 0 };
          gsap.to(proxy, {
            val: target,
            duration: durations.count,
            ease: easings.out,
            delay: i * 0.12,
            onUpdate: () => {
              n.textContent = `${Math.floor(proxy.val)}${suffix}`;
            },
            onComplete: () => {
              n.textContent = `${target}${suffix}`;
            }
          });
        });
      }
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
