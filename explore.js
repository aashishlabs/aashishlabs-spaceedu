(() => {
  const gallery = document.querySelector('.solar-gallery');
  if (!gallery) return;
  const worlds = [...gallery.querySelectorAll('.solar-world')];
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

  const panel = document.querySelector('.solar-intelligence');
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  // Measurements: NASA Planetary Fact Sheet. Moon tallies: NASA Science, September 2026.
  const intelligence = [
    {distance:'57.9 million km',diameter:'4,879 km',gravity:'3.7 m/s²',day:'176 Earth days',year:'88 Earth days',moons:'0',temperature:'167°C',fact:'A day on Mercury lasts longer than two of its years.'},
    {distance:'108.2 million km',diameter:'12,104 km',gravity:'8.9 m/s²',day:'117 Earth days',year:'225 Earth days',moons:'0',temperature:'464°C',fact:'Venus spins backward compared with most planets.'},
    {distance:'149.6 million km',diameter:'12,756 km',gravity:'9.8 m/s²',day:'24 hours',year:'365.2 Earth days',moons:'1',temperature:'15°C',fact:'Earth is the only known world with liquid oceans on its surface.'},
    {distance:'228 million km',diameter:'6,792 km',gravity:'3.7 m/s²',day:'24.7 hours',year:'687 Earth days',moons:'2',temperature:'−65°C',fact:'Olympus Mons rises about 22 km above the Martian plain.'},
    {distance:'778.5 million km',diameter:'142,984 km',gravity:'23.1 m/s²',day:'9.9 hours',year:'11.9 Earth years',moons:'115',temperature:'−110°C',fact:'Jupiter’s Great Red Spot is a storm observed for centuries.'},
    {distance:'1.432 billion km',diameter:'120,536 km',gravity:'9.0 m/s²',day:'10.7 hours',year:'29.4 Earth years',moons:'293',temperature:'−140°C',fact:'Saturn’s rings are made chiefly of countless pieces of ice.'},
    {distance:'2.867 billion km',diameter:'51,118 km',gravity:'8.7 m/s²',day:'17.2 hours',year:'84 Earth years',moons:'29',temperature:'−195°C',fact:'Uranus rotates on its side, giving it extreme seasons.'},
    {distance:'4.515 billion km',diameter:'49,528 km',gravity:'11.0 m/s²',day:'16.1 hours',year:'165 Earth years',moons:'16',temperature:'−200°C',fact:'Neptune was predicted by mathematics before it was seen.'}
  ];
  const measureNames = [['distance','Distance from Sun'],['diameter','Diameter'],['gravity','Surface gravity'],['day','Length of day'],['year','Length of year'],['moons','Known moons'],['temperature','Mean temperature']];
  const title = panel.querySelector('#intelligence-title');
  const close = panel.querySelector('.intelligence-close');
  const back = panel.querySelector('.intelligence-prev');
  const forward = panel.querySelector('.intelligence-next');
  let selected = -1;

  function hide(returnFocus = false) {
    if (selected < 0) return;
    const old = selected;
    selected = -1;
    worlds[old].classList.remove('is-selected');
    panel.classList.remove('is-open');
    panel.setAttribute('aria-hidden', 'true');
    panel.inert = true;
    worlds[old].querySelector('details').open = false;
    if (returnFocus) worlds[old].querySelector('summary').focus();
  }

  function show(i, scroll = true) {
    if (i < 0 || i >= worlds.length) return;
    const world = worlds[i];
    const data = intelligence[i];
    if (selected >= 0 && selected !== i) worlds[selected].querySelector('details').open = false;
    selected = i;
    world.querySelector('details').open = true;
    worlds.forEach((item, n) => item.classList.toggle('is-selected', n === i));
    const image = world.querySelector('.solar-portrait img');
    panel.querySelector('.intelligence-index').textContent = `${String(i + 1).padStart(2, '0')} — 08`;
    panel.querySelector('.intelligence-data-title span').textContent = `${String(i + 1).padStart(2, '0')} / 08`;
    panel.querySelector('.intelligence-image').src = image.getAttribute('src');
    panel.querySelector('.intelligence-image').alt = image.alt;
    panel.querySelector('.intelligence-class').textContent = world.querySelector('.solar-meta').textContent.replace(/^\s*\d+\s*/, '').trim();
    title.textContent = world.querySelector('h3').textContent;
    panel.querySelector('.intelligence-fact').textContent = data.fact;
    panel.querySelector('.intelligence-measures').innerHTML = measureNames.map(([key,label]) => `<div><dt>${label}</dt><dd>${data[key]}</dd></div>`).join('');
    panel.querySelector('.intelligence-source').href = world.querySelector('.solar-note a').href;
    back.disabled = i === 0;
    forward.disabled = i === worlds.length - 1;
    panel.inert = false;
    panel.removeAttribute('aria-hidden');
    panel.classList.add('is-open');
    panel.querySelector('.intelligence-inner').classList.remove('is-changing');
    void panel.offsetWidth;
    panel.querySelector('.intelligence-inner').classList.add('is-changing');
    if (mobile.matches) gallery.scrollTo({left: offset(world), behavior: reducedMotion.matches ? 'instant' : 'smooth'});
    if (scroll) {
      panel.scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth', block: 'start'});
      close.focus({preventScroll:true});
    }
  }

  worlds.forEach((world, i) => {
    world.querySelector('.solar-open').firstChild.textContent = 'Planet intelligence ';
    world.querySelector('details').addEventListener('toggle', event => {
      if (event.target.open) show(i);
      else if (selected === i) hide();
    });
  });
  close.addEventListener('click', () => hide(true));
  back.addEventListener('click', () => show(selected - 1, false));
  forward.addEventListener('click', () => show(selected + 1, false));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && selected >= 0) { hide(true); event.preventDefault(); }
  });
  document.querySelector('.solar-system').classList.add('has-intelligence');
})();
