import './loader.css';
import { gsap, easings, durations, onMotion } from '../lib/gsap';

// Resolves when the wordmark reveal has played AND fonts + DOM are ready,
// then fades the overlay out. Caller awaits this before kicking off section
// entrances.
export function initLoader(): Promise<void> {
  const overlay = document.getElementById('loader');
  if (!overlay) return Promise.resolve();

  const wordmark = overlay.querySelector<HTMLElement>('.loader__logo');
  if (!wordmark) return Promise.resolve();

  // Register --mask-pos as a custom property so it can be tweened smoothly.
  if (typeof CSS !== 'undefined' && 'registerProperty' in CSS) {
    try {
      (CSS as unknown as {
        registerProperty: (def: {
          name: string;
          syntax: string;
          inherits: boolean;
          initialValue: string;
        }) => void;
      }).registerProperty({
        name: '--mask-pos',
        syntax: '<percentage>',
        inherits: true,
        initialValue: '0%'
      });
    } catch {
      // already registered; ignore
    }
  }

  const ready = Promise.all([
    document.fonts ? document.fonts.ready : Promise.resolve(),
    new Promise<void>((resolve) => {
      if (document.readyState !== 'loading') resolve();
      else document.addEventListener('DOMContentLoaded', () => resolve(), { once: true });
    })
  ]);

  const reveal = new Promise<void>((resolve) => {
    onMotion(({ conditions }) => {
      if (conditions?.reduced) {
        wordmark.style.setProperty('--mask-pos', '100%');
        resolve();
        return;
      }
      gsap.fromTo(
        wordmark,
        { '--mask-pos': '0%' },
        {
          '--mask-pos': '100%',
          duration: parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dur-loader')) || durations.entrance * 1.875,
          ease: easings.inOut,
          onComplete: () => resolve()
        }
      );
    });
  });

  // Safety net — if any of the ready/reveal promises fails to resolve for
  // any reason (matchMedia weirdness, font hang, etc.), dismiss anyway after
  // 4 seconds so the user never sees a stuck black screen.
  const safety = new Promise<void>((resolve) => {
    setTimeout(resolve, 4000);
  });

  return Promise.race([Promise.all([ready, reveal]), safety]).then(() => {
    return new Promise<void>((resolve) => {
      gsap.to(overlay, {
        opacity: 0,
        duration: durations.base,
        ease: easings.inOut,
        onComplete: () => {
          overlay.setAttribute('data-state', 'done');
          overlay.style.display = 'none';
          resolve();
        }
      });
    });
  });
}
