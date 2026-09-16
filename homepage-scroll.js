// Enable the cue only when there is real content to scroll to. No placeholder section.
(() => {
  const main = document.querySelector('main');
  const cue = document.querySelector('.scroll');
  const nextSection = () => [...main.querySelectorAll(':scope > [data-homepage-section]')]
    .find(section => !section.hidden && section.getClientRects().length);
  const update = () => { const hidden = !nextSection(); if (cue.hidden !== hidden) cue.hidden = hidden; };
  cue.addEventListener('click', () => {
    const target = nextSection();
    if (!target) return;
    if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'start' });
  });
  new MutationObserver(update).observe(main, { childList: true, attributes: true, attributeFilter: ['hidden'], subtree: true });
  update();
})();
