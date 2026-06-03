// CSS-class fallback for SplitText. Wraps each word of `el`'s text content in
// `<span class="word-mask"><span class="word">…</span></span>`. The outer mask
// hides overflow so the inner word can be translated from below.
//
// When the SplitText license becomes available, swap this implementation for
// the real plugin and keep the returned shape stable.

export interface SplitResult {
  words: HTMLElement[];
  revert: () => void;
}

export function splitWords(el: HTMLElement): SplitResult {
  const original = el.innerHTML;
  const text = el.textContent ?? '';
  const tokens = text.split(/(\s+)/);

  el.innerHTML = '';
  const words: HTMLElement[] = [];

  for (const token of tokens) {
    if (token.trim().length === 0) {
      el.appendChild(document.createTextNode(token));
      continue;
    }
    const mask = document.createElement('span');
    mask.className = 'word-mask';
    const word = document.createElement('span');
    word.className = 'word';
    word.textContent = token;
    mask.appendChild(word);
    el.appendChild(mask);
    words.push(word);
  }

  return {
    words,
    revert: () => {
      el.innerHTML = original;
    }
  };
}
