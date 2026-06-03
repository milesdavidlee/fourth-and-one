// Shared text-reveal helper for section headlines. Splits the element's
// content into word-masked spans (via split.ts) and returns a function that,
// when called, fades the words up in a staggered cascade.
//
// Used in sections where the headline is the leading motion beat. Keeps the
// look consistent across the site without each section reimplementing the
// split + timeline mechanics.

import { gsap, easings, durations } from './gsap';
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
