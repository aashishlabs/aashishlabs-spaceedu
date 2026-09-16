(() => {
  const gallery = document.querySelector('.solar-gallery');
  if (!gallery) return;
  const worlds = [...gallery.children];
  const navigation = document.querySelector('.solar-navigation');
  const previous = navigation.querySelector('.solar-prev');
  const next = navigation.querySelector('.solar-next');
  const position = navigation.querySelector('.solar-position');
  const mobile = matchMedia('(max-width: 700px)');
  let frame = 0;
  let index = 0;
  const offset = world => world.getBoundingClientRect().left - gallery.getBoundingClientRect().left - parseFloat(getComputedStyle(gallery).paddingLeft) + gallery.scrollLeft;
  function update() {
    frame = 0;
    navigation.hidden = !mobile.matches;
    index = worlds.reduce((best, world, i) => Math.abs(offset(world) - gallery.scrollLeft) < Math.abs(offset(worlds[best]) - gallery.scrollLeft) ? i : best, 0);
    // The last item cannot always align to the leading edge of the rail.
    if (mobile.matches && gallery.scrollLeft >= gallery.scrollWidth - gallery.clientWidth - 2) index = worlds.length - 1;
    position.textContent = `${String(index + 1).padStart(2, '0')} / 08`;
    previous.disabled = index === 0;
    next.disabled = index === worlds.length - 1;
  }
  function move(direction) {
    const target = Math.max(0, Math.min(worlds.length - 1, index + direction));
    gallery.scrollTo({left: offset(worlds[target]), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
  }
  gallery.addEventListener('scroll', () => { if (!frame) frame = requestAnimationFrame(update); }, {passive: true});
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  new ResizeObserver(update).observe(gallery);
  mobile.addEventListener('change', update);
  update();
})();
