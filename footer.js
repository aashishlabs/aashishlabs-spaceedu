(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  document.querySelectorAll('.site-footer [data-scroll-to]').forEach(button => {
    button.addEventListener('click', () => {
      const target = document.querySelector(button.dataset.scrollTo);
      target?.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' });
    });
  });
})();
