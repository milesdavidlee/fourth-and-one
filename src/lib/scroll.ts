// Lenis smooth scroll, integrated with GSAP's ticker so ScrollTrigger stays
// in sync. Skipped entirely under prefers-reduced-motion.

import Lenis from 'lenis';
import 'lenis/dist/lenis.css';
import { gsap, ScrollTrigger } from './gsap';

let instance: Lenis | null = null;

export function initSmoothScroll(): Lenis | null {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduced) return null;

  instance = new Lenis({
    duration: 1.15,
    easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    syncTouch: false,
    wheelMultiplier: 1.0,
    touchMultiplier: 1.4
  });

  instance.on('scroll', ScrollTrigger.update);

  gsap.ticker.add((time) => {
    instance?.raf(time * 1000);
  });
  gsap.ticker.lagSmoothing(0);

  return instance;
}

export function getLenis(): Lenis | null {
  return instance;
}
