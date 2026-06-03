import './track-record.css';
import { gsap, ScrollTrigger, easings, onMotion } from '../lib/gsap';

export function initTrackRecord(root: HTMLElement) {
  const numerals = Array.from(
    root.querySelectorAll<HTMLElement>('.track-record__numeral')
  );
  if (numerals.length === 0) return;

  // Wrap each character of the final numeral text in a
  // <span class="track-record__digit"><span>{char}</span></span> shell so the
  // inner span can be rotated independently of the outer layout slot.
  // The markup remains crawlable / no-JS friendly: final values stay rendered.
  const digitGroups = numerals.map((n) => {
    const finalText = n.textContent ?? '';
    n.textContent = '';
    const innerSpans: HTMLElement[] = [];
    for (const char of finalText) {
      const outer = document.createElement('span');
      outer.className = 'track-record__digit';
      const inner = document.createElement('span');
      inner.textContent = char;
      outer.appendChild(inner);
      n.appendChild(outer);
      innerSpans.push(inner);
    }
    return innerSpans;
  });

  onMotion(({ conditions }) => {
    // Reduced motion: leave the markup at its final values, skip the rotation.
    if (conditions?.reduced) return;

    // Pre-set initial state so there's no flash of upright digits before
    // ScrollTrigger enters.
    digitGroups.forEach((spans) => {
      gsap.set(spans, { rotateX: 90, opacity: 0, transformPerspective: 600 });
    });

    ScrollTrigger.create({
      id: 'track-record-entrance',
      trigger: root,
      start: 'top 75%',
      once: true,
      invalidateOnRefresh: true,
      onEnter: () => {
        digitGroups.forEach((spans, i) => {
          gsap.to(spans, {
            rotateX: 0,
            opacity: 1,
            duration: 0.7,
            ease: easings.out,
            stagger: 0.08,
            delay: i * 0.12
          });
        });
      }
    });
  });

  requestAnimationFrame(() => ScrollTrigger.refresh());
}
