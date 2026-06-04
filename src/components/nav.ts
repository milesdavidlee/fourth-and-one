import './nav.css';
import { gsap } from '../lib/gsap';
import { getLenis } from '../lib/scroll';

// Three concerns:
//   1. data-scrolled — true once past the hero (CSS swaps to backdrop-blur).
//   2. data-hidden   — true while scrolling DOWN past a threshold, false on
//      any upward scroll. Pulls the bar off the top of the viewport.
//   3. data-menu-open — controls the mobile full-screen overlay; the
//      hamburger button toggles it, and any anchor click closes it.
// Plus: every in-page anchor link (anywhere on the page) gets a Lenis-powered
// smooth scroll handler so nothing jumps.

const easeOutExpo = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

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
  const HIDE_AFTER = 120;
  const DELTA_THRESHOLD = 4;

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

  // === Mobile overlay menu ===
  // The overlay markup now lives at body root (not inside .nav), so the
  // .nav transform doesn't clip it. Look it up via document, not root.
  const toggle = root.querySelector<HTMLButtonElement>('.nav__toggle');
  const overlay = document.querySelector<HTMLElement>('.nav__overlay');
  const overlayLinks = Array.from(
    document.querySelectorAll<HTMLAnchorElement>('.nav__overlay-link')
  );

  let isMenuOpen = false;

  function openMenu() {
    if (!overlay || isMenuOpen) return;
    isMenuOpen = true;
    root.setAttribute('data-menu-open', 'true');
    overlay.setAttribute('data-open', 'true');
    toggle?.setAttribute('aria-expanded', 'true');
    overlay.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
    lenis?.stop();

    gsap.fromTo(
      overlay,
      { opacity: 0 },
      { opacity: 1, duration: 0.35, ease: 'power3.out' }
    );
    gsap.fromTo(
      overlayLinks,
      { y: 28, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        stagger: 0.06,
        duration: 0.5,
        delay: 0.12,
        ease: 'power3.out'
      }
    );
  }

  function closeMenu(then?: () => void) {
    if (!overlay || !isMenuOpen) {
      then?.();
      return;
    }
    isMenuOpen = false;
    root.setAttribute('data-menu-open', 'false');
    toggle?.setAttribute('aria-expanded', 'false');

    gsap.to(overlay, {
      opacity: 0,
      duration: 0.28,
      ease: 'power3.in',
      onComplete: () => {
        overlay.setAttribute('data-open', 'false');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
        lenis?.start();
        then?.();
      }
    });
  }

  toggle?.addEventListener('click', () => {
    if (isMenuOpen) closeMenu();
    else openMenu();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isMenuOpen) closeMenu();
  });

  // === Smooth scroll for EVERY in-page anchor link, page-wide ===
  // Intercepts <a href="#…"> clicks and routes them through Lenis with an
  // ease-out-expo curve. If the mobile menu is open, close it first then
  // scroll. External links / pure "#" hrefs are skipped.
  const anchorLinks = document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]');
  anchorLinks.forEach((link) => {
    link.addEventListener('click', (e) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;
      const target = document.querySelector(href);
      if (!target) return;
      e.preventDefault();

      const doScroll = () => {
        const l = getLenis();
        if (l) {
          l.scrollTo(target as HTMLElement, {
            duration: 1.4,
            easing: easeOutExpo,
            offset: -20
          });
        } else {
          (target as HTMLElement).scrollIntoView({ behavior: 'smooth' });
        }
      };

      if (isMenuOpen) {
        closeMenu(doScroll);
      } else {
        doScroll();
      }
    });
  });
}
