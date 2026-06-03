import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const cssVar = (name: string) =>
  getComputedStyle(root).getPropertyValue(name).trim();

export const easings = {
  out: cssVar('--ease-out') || 'power3.out',
  inOut: cssVar('--ease-inout') || 'power2.inOut',
  emphatic: cssVar('--ease-emphatic') || 'expo.out',
  linear: cssVar('--ease-linear') || 'none'
};

const parseSeconds = (raw: string, fallback: number) => {
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return fallback;
  return raw.endsWith('ms') ? n / 1000 : n;
};

export const durations = {
  fast: parseSeconds(cssVar('--dur-fast'), 0.2),
  base: parseSeconds(cssVar('--dur-base'), 0.4),
  entrance: parseSeconds(cssVar('--dur-entrance'), 0.8),
  headline: parseSeconds(cssVar('--dur-headline'), 0.9),
  count: parseSeconds(cssVar('--dur-count'), 1.6),
  ambient: parseSeconds(cssVar('--dur-ambient'), 1.2)
};

export const mm = gsap.matchMedia();

export type MotionContext = (ctx: {
  conditions?: { reduced?: boolean; normal?: boolean };
}) => void | (() => void);

export function onMotion(setup: MotionContext) {
  mm.add(
    {
      reduced: '(prefers-reduced-motion: reduce)',
      normal: '(prefers-reduced-motion: no-preference)'
    },
    setup
  );
}

export { gsap, ScrollTrigger };
