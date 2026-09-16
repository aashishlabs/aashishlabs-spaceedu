(() => {
  if (!('IntersectionObserver' in window)) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({target, isIntersecting}) => {
      if (!isIntersecting) return;
      if (!motion.matches) {
        target.classList.add('is-revealing');
        target.querySelector('.missions-story').addEventListener('animationend', () => target.classList.remove('is-revealing'), {once:true});
      }
      observer.unobserve(target);
    });
  }, {threshold:.15});
  document.querySelectorAll('.missions-stop').forEach(stop => observer.observe(stop));
})();
