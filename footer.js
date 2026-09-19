(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.site-footer [data-scroll-to]').forEach(button => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.scrollTo);
      if (target) {
        if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }
      target?.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' });
    });
  });
})();
