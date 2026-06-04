import './track-record.css';
import { gsap, ScrollTrigger, easings, onMotion } from '../lib/gsap';

export function initTrackRecord(root: HTMLElement) {
  const stats = Array.from(
    root.querySelectorAll<HTMLElement>('.track-record__stat')
  );
  if (stats.length === 0) return;

  // Simple stagger-up card entrance. No digit wrapping, no gradient-clip,
  // no flip — the numerals render straight from the HTML and stay visible.
  onMotion(({ conditions }) => {
    if (conditions?.reduced) return;

    ScrollTrigger.create({
      id: 'track-record-entrance',
      trigger: root,
      start: 'top 80%',
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => {
        gsap.fromTo(
          stats,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: easings.out,
            stagger: 0.12
          }
        );
      }
    });
  });
}
