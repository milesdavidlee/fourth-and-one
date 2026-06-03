import './scroll-thread.css';
import { getLenis } from '../lib/scroll';

// Right-edge progress thread. A thin gradient rail with a glowing accent dot
// that tracks the document scroll position. Activates after the user has
// scrolled past the hero.

export function initScrollThread() {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return;

  const root = document.createElement('div');
  root.className = 'scroll-thread';
  root.setAttribute('aria-hidden', 'true');

  const rail = document.createElement('div');
  rail.className = 'scroll-thread__rail';
  const dot = document.createElement('div');
  dot.className = 'scroll-thread__dot';

  root.appendChild(rail);
  root.appendChild(dot);
  document.body.appendChild(root);

  // Activate once user has scrolled past ~60vh.
  const activationThreshold = window.innerHeight * 0.6;
  const lenis = getLenis();

  function update(scrollY: number) {
    const doc = document.documentElement;
    const max = Math.max(1, doc.scrollHeight - window.innerHeight);
    const progress = Math.min(1, Math.max(0, scrollY / max));

    const railHeight = root.clientHeight;
    dot.style.transform = `translateY(${progress * railHeight}px)`;

    const active = scrollY > activationThreshold;
    root.setAttribute('data-active', String(active));
  }

  if (lenis) {
    lenis.on('scroll', ({ scroll }: { scroll: number }) => update(scroll));
  } else {
    window.addEventListener(
      'scroll',
      () => update(window.scrollY),
      { passive: true }
    );
  }

  update(window.scrollY || 0);
}
