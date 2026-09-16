(() => {
  if (!('IntersectionObserver' in window)) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (!motion.matches) {
        entry.target.classList.add('is-revealing');
        entry.target.addEventListener('animationend', () => entry.target.classList.remove('is-revealing'), {once: true});
      }
      observer.unobserve(entry.target);
    }
  }, {threshold: .15});
  document.querySelectorAll('.why-space-story').forEach(story => observer.observe(story));
})();
