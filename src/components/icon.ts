// Material Symbols Rounded wrapper. Returns a span element configured with the
// global axes (FILL,wght,GRAD,opsz = 0,300,0,24) inherited from base.css.

export function icon(name: string, label?: string): HTMLSpanElement {
  const el = document.createElement('span');
  el.className = 'icon';
  el.textContent = name;
  if (label) {
    el.setAttribute('role', 'img');
    el.setAttribute('aria-label', label);
  } else {
    el.setAttribute('aria-hidden', 'true');
  }
  return el;
}
