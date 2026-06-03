import './lib/fonts';
import './styles/tokens.css';
import './styles/base.css';
import './styles/typography.css';

// Mark the body ready so the inlined "main { visibility: hidden }" guard in
// index.html lifts. The loader still owns the visible state from here.
document.body.classList.add('app-ready');

import { initLoader } from './components/loader';
import { initNav } from './components/nav';
import { initHero } from './sections/hero';
import { initApproach } from './sections/approach';
import { initTeam } from './sections/team';
import { initDemographics } from './sections/demographics';
import { initPortfolio } from './sections/portfolio';
import { initInvestmentApproach } from './sections/investment-approach';
import { initTrackRecord } from './sections/track-record';
import { initConnect } from './sections/connect';
import { initFooter } from './sections/footer';
import { ScrollTrigger } from './lib/gsap';
import { initSmoothScroll } from './lib/scroll';
import { initScrollThread } from './components/scroll-thread';

initSmoothScroll();
initScrollThread();

const bind = (id: string, init: (el: HTMLElement) => void) => {
  const el = document.getElementById(id);
  if (el instanceof HTMLElement) init(el);
};

bind('nav', initNav);
bind('hero', initHero);
bind('approach', initApproach);
bind('team', initTeam);
bind('demographics', initDemographics);
bind('portfolio', initPortfolio);
bind('investment-approach', initInvestmentApproach);
bind('track-record', initTrackRecord);
bind('connect', initConnect);
bind('footer', initFooter);

const yearEl = document.getElementById('footer-year');
if (yearEl) yearEl.textContent = String(new Date().getFullYear());

initLoader().then(() => {
  // Layout may have shifted as fonts loaded; refresh triggers post-dismiss.
  ScrollTrigger.refresh();
});
