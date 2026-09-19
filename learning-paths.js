(() => {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting) return;
        if (!motion.matches) {
          target.classList.add('is-revealing');
          target.addEventListener('animationend', () => target.classList.remove('is-revealing'), { once: true });
        }
        observer.unobserve(target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.learning-card').forEach(card => observer.observe(card));
  }
  document.querySelectorAll('.learning-cta[data-scroll-to]').forEach(button => {
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
