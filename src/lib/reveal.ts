// Word reveal helpers.
//
// prepareWordReveal — splits text into word-masked spans for fade-up entrance
//   animations (used by hero headline, beliefs headline, etc.).
//
// scrollScrubWords — splits text into spans and scrubs each word's opacity
//   from dim to full as the user scrolls the section into view. Words "light
//   up" sequentially, driven by scroll position rather than time. Used on
//   Approach + Investment Approach for the type-driven cinematic feel.

import { gsap, easings, durations } from './gsap';
import { ScrollTrigger } from './gsap';
import { splitWords } from './split';

export interface RevealHandle {
  words: HTMLElement[];
  play: (delay?: number) => gsap.core.Tween;
  setInitial: () => void;
}

export function prepareWordReveal(el: HTMLElement): RevealHandle {
  const split = splitWords(el);

  const setInitial = () => {
    gsap.set(split.words, { yPercent: 110, opacity: 0 });
  };

  const play = (delay = 0) => {
    return gsap.to(split.words, {
      yPercent: 0,
      opacity: 1,
      duration: durations.headline,
      ease: easings.out,
      stagger: 0.06,
      delay
    });
  };

  return { words: split.words, play, setInitial };
}

// Splits each element's text into per-word spans and attaches one shared
// scrub ScrollTrigger that lights them up sequentially as the user scrolls.
// Returns the ScrollTrigger so callers can kill or refresh it.
export function scrollScrubWords(
  elements: HTMLElement[],
  trigger: HTMLElement,
  options: {
    start?: string;
    end?: string;
    dimOpacity?: number;
    stagger?: number;
    scrub?: number | boolean;
    id?: string;
  } = {}
): ScrollTrigger {
  const {
    start = 'top 80%',
    end = 'bottom 30%',
    dimOpacity = 0.18,
    stagger = 0.04,
    scrub = 0.6,
    id
  } = options;

  // Split every element's text into words. Flatten into one array so the
  // stagger flows continuously across all elements (headline → lead →
  // paragraph all reveal as one cinematic block).
  const allWords: HTMLElement[] = [];
  for (const el of elements) {
    allWords.push(...splitWords(el).words);
  }

  gsap.set(allWords, { opacity: dimOpacity });

  const tween = gsap.to(allWords, {
    opacity: 1,
    ease: 'none',
    stagger: { each: stagger, from: 'start' },
    scrollTrigger: {
      id,
      trigger,
      start,
      end,
      scrub,
      invalidateOnRefresh: true
    }
  });

  return tween.scrollTrigger as ScrollTrigger;
}
