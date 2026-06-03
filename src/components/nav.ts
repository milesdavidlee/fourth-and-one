import './nav.css';
import { getLenis } from '../lib/scroll';

// Two scroll-driven behaviors:
//   1. data-scrolled — true once the user has scrolled past the hero, used
//      by the CSS to swap the nav from transparent to backdrop-blur.
//   2. data-hidden — true when scrolling DOWN past the threshold, false when
//      scrolling UP. Hides the nav off the top of the viewport via translateY
//      so it gets out of the way while reading, then reappears immediately
//      when the user reverses direction.

export function initNav(root: HTMLElement) {
  // === data-scrolled (transparent → blurred) ===
  const sentinel = document.createElement('div');
  sentinel.style.position = 'absolute';
  sentinel.style.top = '0';
  sentinel.style.height = '80vh';
  sentinel.style.width = '1px';
  sentinel.style.pointerEvents = 'none';
  document.body.prepend(sentinel);

  const io = new IntersectionObserver(
    ([entry]) => {
      root.setAttribute('data-scrolled', String(!entry.isIntersecting));
    },
    { threshold: 0 }
  );
  io.observe(sentinel);

  // === data-hidden (hide on scroll down, show on scroll up) ===
  let lastY = 0;
  const HIDE_AFTER = 120;  // pixels before we start hiding
  const DELTA_THRESHOLD = 4; // ignore micro scrolls

  function update(y: number) {
    const delta = y - lastY;
    if (Math.abs(delta) < DELTA_THRESHOLD) return;

    if (delta > 0 && y > HIDE_AFTER) {
      root.setAttribute('data-hidden', 'true');
    } else if (delta < 0) {
      root.setAttribute('data-hidden', 'false');
    }

    lastY = y;
  }

  const lenis = getLenis();
  if (lenis) {
    lenis.on('scroll', ({ scroll }: { scroll: number }) => update(scroll));
  } else {
    window.addEventListener('scroll', () => update(window.scrollY), { passive: true });
  }
}
