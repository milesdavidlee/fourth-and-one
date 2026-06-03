import './footer.css';

export function initFooter(root: HTMLElement) {
  const form = root.querySelector<HTMLFormElement>('.footer__newsletter-form');
  if (!form) return;

  // Newsletter posts to a placeholder endpoint; client will wire ESP later.
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const input = form.querySelector<HTMLInputElement>('.footer__newsletter-input');
    if (!input) return;
    // Visual feedback only — no real submission yet.
    input.value = '';
    input.setAttribute('placeholder', 'Thanks — we\'ll be in touch.');
  });
}
