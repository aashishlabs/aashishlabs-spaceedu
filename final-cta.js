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
    const inner = document.querySelector('.final-cta-inner');
    if (inner) observer.observe(inner);
  }

  const exploreAgainBtn = document.querySelector('.final-cta-btn-primary');
  const startLearningBtn = document.querySelector('.final-cta-btn-secondary');
  exploreAgainBtn?.addEventListener('click', () => {
    const target = document.querySelector('#solar-system');
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' });
    }
  });
  startLearningBtn?.addEventListener('click', () => {
    const target = document.querySelector('#start-exploring');
    if (target) {
      if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
      target.scrollIntoView({ behavior: motion.matches ? 'instant' : 'smooth' });
    }
  });
})();
