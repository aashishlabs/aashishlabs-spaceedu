import * as THREE from './assets/vendor/three.module.js';

// The HTML remains a complete, selectable still-image fallback until the first render.
export async function createHero({ host, initial, onFailure, onCommit, onProgress }) {
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const canvas = document.createElement('canvas');
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (error) { throw error; }
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, .1, 20);
  camera.position.z = 5;
  const ambient = new THREE.AmbientLight(0xb7c9ec, .24);
  scene.add(ambient);
  const sunlight = new THREE.DirectionalLight(0xfff2db, 2);
  sunlight.position.set(-4, 3, 3);
  scene.add(sunlight);
  const lighting = {
    earth: { ambient: 0x9bb9e4, fill: .3, sun: 0xfff5e8, strength: 1.85, position: [-4, 3, 3] },
    mars: { ambient: 0xc8a494, fill: .3, sun: 0xffe6cb, strength: 2.8, position: [-4, 2, 2.5] },
    venus: { ambient: 0xe1c8a3, fill: .28, sun: 0xffefd7, strength: 2.55, position: [-4.5, 2.7, 1.8] },
  };
  function light(name) {
    const config = lighting[name];
    ambient.color.set(config.ambient); ambient.intensity = config.fill;
    sunlight.color.set(config.sun); sunlight.intensity = config.strength;
    sunlight.position.set(...config.position);
  }
  const geometry = new THREE.SphereGeometry(1, 96, 64);
  const loader = new THREE.TextureLoader();
  const textures = new Set();
  const worlds = new Map();
  const pending = new Map();
  let active, disposed = false, selecting = false;
  let radius = 1.35, horizon = .08;
  let frame = 0, previous = 0, transition = null, paused = motion.matches;
  let pointer = null, dragX = 0, dragY = 0, visible = true;
  const load = async (file, color = false) => {
    const texture = await loader.loadAsync('./assets/textures/' + file);
    if (disposed) { texture.dispose(); throw new Error('Hero disposed'); }
    if (color) texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = Math.min(4, renderer.capabilities.getMaxAnisotropy());
    textures.add(texture);
    return texture;
  };
  function atmosphere(color, name) {
    return new THREE.ShaderMaterial({
      uniforms: { tint: { value: new THREE.Color(color) }, opacity: { value: 1 },
        sunDirection: { value: new THREE.Vector3(...lighting[name].position).normalize() },
        falloff: { value: name === 'venus' ? 3.2 : 4.5 },
        density: { value: name === 'venus' ? .52 : name === 'earth' ? .43 : .4 } },
      vertexShader: `varying vec3 n;
        void main(){n=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
      fragmentShader: `varying vec3 n; uniform vec3 tint; uniform float opacity;
        uniform vec3 sunDirection; uniform float falloff; uniform float density;
        void main(){vec3 normal=normalize(n); float edge=pow(1.-abs(normal.z),falloff);
        float sun=.2+.8*max(0.,dot(normal,sunDirection));
        gl_FragColor=vec4(tint,edge*density*sun*opacity);}`,
      transparent: true, blending: THREE.AdditiveBlending, depthWrite: false,
    });
  }
  async function build(name) {
    if (worlds.has(name)) return worlds.get(name);
    if (pending.has(name)) return pending.get(name);
    const promise = (async () => {
      const isEarth = name === 'earth';
      const map = await load(isEarth ? 'earth_daymap.jpg' : name === 'venus' ? 'venus_surface.jpg' : 'mars.jpg', true);
      const material = isEarth
        ? new THREE.MeshPhongMaterial({ map, shininess: 48, specular: 0x42586d, transparent: true })
        : new THREE.MeshStandardMaterial({ map, roughness: name === 'mars' ? .96 : .88, metalness: 0, color: name === 'mars' ? 0xdac2ac : 0xdcc4a3, transparent: true });
      if (!isEarth) {
        // Artistic micro-relief from the existing map: no extra download or geometry.
        const relief = map.clone(); relief.colorSpace = THREE.NoColorSpace;
        textures.add(relief);
        material.bumpMap = relief; material.bumpScale = name === 'mars' ? .022 : .008;
      }
      const group = new THREE.Group();
      const surface = new THREE.Mesh(geometry, material);
      group.add(surface);
      let clouds, cloudShadow;
      if (isEarth) {
        const [normal, specular, cloudMap] = await Promise.all([load('earth_normal_map.jpg'), load('earth_specular_map.jpg'), load('earth_clouds.webp', true)]);
        material.normalMap = normal;
        material.normalScale.set(.25, .25);
        material.specularMap = specular;
        clouds = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ map: cloudMap, transparent: true, opacity: .78, depthWrite: false, shininess: 2 }));
        clouds.scale.setScalar(1.0065);
        // A very faint offset silhouette adds separation without a shadow-map pass.
        cloudShadow = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ map: cloudMap, color: 0x071529, transparent: true, opacity: .13, depthWrite: false }));
        cloudShadow.scale.setScalar(1.001);
        cloudShadow.rotation.set(.003, .006, 0);
        cloudShadow.renderOrder = 1;
        clouds.renderOrder = 2;
        group.add(cloudShadow);
        group.add(clouds);
      } else if (name === 'venus') {
        const cloudMap = await load('venus_clouds.webp', true);
        const cloudRelief = cloudMap.clone(); cloudRelief.colorSpace = THREE.NoColorSpace;
        textures.add(cloudRelief);
        clouds = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ map: cloudMap, bumpMap: cloudRelief, bumpScale: .012, roughness: 1, transparent: true, opacity: .94, depthWrite: false }));
        clouds.scale.setScalar(1.008);
        group.add(clouds);
      }
      const glow = new THREE.Mesh(geometry, atmosphere(isEarth ? '#398dff' : name === 'venus' ? '#e5bd83' : '#bd6445', name));
      glow.scale.setScalar(isEarth ? 1.01 : name === 'venus' ? 1.017 : 1.004);
      glow.renderOrder = 3;
      group.add(glow);
      group.rotation.set(.18, isEarth ? 2.2 : .5, -.12);
      group.visible = false;
      scene.add(group);
      const world = { name, group, clouds, cloudShadow, material, glow, cloudOpacity: name === 'venus' ? .94 : .78 };
      worlds.set(name, world);
      return world;
    })();
    pending.set(name, promise);
    try { return await promise; } finally { pending.delete(name); }
  }
  function weight(world, value) {
    world.group.visible = value > 0;
    world.material.opacity = value;
    world.material.depthWrite = value === 1;
    if (world.clouds) world.clouds.material.opacity = world.cloudOpacity * value;
    if (world.cloudShadow) world.cloudShadow.material.opacity = .13 * value;
    world.glow.material.uniforms.opacity.value = value;
  }
  function layout() {
    if (disposed) return;
    const { width, height } = host.getBoundingClientRect();
    const aspect = width / height;
    camera.left = -aspect; camera.right = aspect;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, width < 600 ? 1.5 : 2));
    renderer.setSize(width, height);
    // Match the original full-bleed horizon, including portrait and short screens.
    radius = width < 600 ? 1.1 : 1.35;
    horizon = height < 621 ? .34 : .08;
    for (const world of worlds.values()) {
      world.group.scale.setScalar(radius);
      world.group.position.set(0, -radius - horizon, 0);
    }
    wake();
  }
  function pose(world, visibility, direction) {
    weight(world, visibility);
    world.group.scale.setScalar(radius * (.925 + .075 * visibility));
    world.group.position.set(direction * (1 - visibility) * .15, -radius - horizon - (1 - visibility) * .16, 0);
  }
  function commit(next) {
    weight(active, 0);
    active = next;
    light(next.name);
    canvas.dataset.planet = next.name;
    canvas.setAttribute('aria-label', next.name.toUpperCase() + ' interactive planet. Drag to rotate, or use arrow keys.');
    onCommit(next.name);
  }
  function draw(now) {
    frame = 0;
    if (disposed || document.hidden || !visible) return;
    const dt = Math.min((now - (previous || now)) / 1000, .05);
    previous = now;
    if (transition) {
      const t = motion.matches ? 1 : Math.min((now - transition.start) / 1180, 1);
      const midpoint = .36;
      if (t >= midpoint && !transition.committed) {
        commit(transition.next); transition.committed = true;
      }
      const incoming = t >= midpoint;
      const progress = incoming ? (t - midpoint) / (1 - midpoint) : t / midpoint;
      const eased = incoming ? 1 - (1 - progress) ** 3 : progress * progress * progress * (progress * (progress * 6 - 15) + 10);
      const opacity = incoming ? eased : 1 - eased;
      pose(active, opacity, incoming ? 1 : -1);
      onProgress(opacity, (1 - opacity) * (incoming ? 10 : -8));
      if (t === 1) {
        const complete = transition.resolve;
        transition = null; selecting = false;
        canvas.setAttribute('aria-busy', 'false');
        complete(true);
      }
    }
    if (!paused && !motion.matches && pointer === null) {
      for (const world of worlds.values()) if (world.group.visible) {
        world.group.rotation.y += dt * (world.name === 'venus' ? -.025 : .035);
        if (world.clouds) world.clouds.rotation.y += dt * (world.name === 'venus' ? -.018 : .009);
        if (world.cloudShadow) world.cloudShadow.rotation.y = world.clouds.rotation.y + .006;
      }
    }
    renderer.render(scene, camera);
    if (transition || (!paused && !motion.matches)) wake();
  }
  function wake() { if (!frame && !disposed && !document.hidden && visible) frame = requestAnimationFrame(draw); }
  async function select(name) {
    if (selecting || disposed || name === active.name) return false;
    selecting = true;
    canvas.setAttribute('aria-busy', 'true');
    try {
      const next = await build(name);
      if (disposed) return false;
      // Compile before fading; keep the old world and all copy intact while loading.
      next.group.visible = true;
      renderer.compile(scene, camera);
      next.group.visible = false;
      if (motion.matches) {
        commit(next); pose(active, 1, 0); onProgress(1, 0);
        selecting = false; canvas.setAttribute('aria-busy', 'false');
        renderer.render(scene, camera);
        return true;
      }
      return await new Promise(resolve => {
        transition = { next, committed: false, start: performance.now(), resolve };
        wake();
      });
    } catch (error) { if (!disposed) { dispose(); onFailure(error); } return false; }
  }
  function rotate(x, y) {
    if (!active || selecting) return;
    active.group.rotation.y += x;
    active.group.rotation.x = THREE.MathUtils.clamp(active.group.rotation.x + y, -.95, .95);
    wake();
  }
  const events = new AbortController();
  const listen = (target, type, fn) => target.addEventListener(type, fn, { signal: events.signal });
  listen(canvas, 'pointerdown', event => {
    if (!event.isPrimary || event.button !== 0 || selecting) return;
    pointer = event.pointerId; dragX = event.clientX; dragY = event.clientY;
    canvas.setPointerCapture(pointer); canvas.classList.add('is-dragging');
  });
  listen(canvas, 'pointermove', event => {
    if (event.pointerId !== pointer) return;
    rotate((event.clientX - dragX) * .006, (event.clientY - dragY) * .004);
    dragX = event.clientX; dragY = event.clientY;
  });
  const release = () => { pointer = null; canvas.classList.remove('is-dragging'); wake(); };
  listen(canvas, 'pointerup', release); listen(canvas, 'pointercancel', release); listen(canvas, 'lostpointercapture', release);
  listen(canvas, 'keydown', event => {
    const keys = { ArrowLeft: [-.12, 0], ArrowRight: [.12, 0], ArrowUp: [0, -.1], ArrowDown: [0, .1] };
    if (keys[event.key]) { event.preventDefault(); rotate(...keys[event.key]); }
  });
  const pauseButton = document.querySelector('.rotation-toggle');
  function updatePause() {
    const label = motion.matches ? 'Manual rotation' : paused ? 'Resume rotation' : 'Pause rotation';
    pauseButton.setAttribute('aria-label', label);
    pauseButton.title = label;
    pauseButton.dataset.paused = String(paused || motion.matches);
    pauseButton.setAttribute('aria-pressed', String(paused || motion.matches));
    pauseButton.disabled = motion.matches;
  }
  listen(pauseButton, 'click', () => { paused = !paused; updatePause(); wake(); });
  listen(motion, 'change', () => { paused = motion.matches; updatePause(); previous = 0; wake(); });
  listen(document, 'visibilitychange', () => { previous = 0; if (document.hidden) release(); else wake(); });
  listen(canvas, 'webglcontextlost', event => { event.preventDefault(); dispose(); onFailure(new Error('WebGL context lost')); });
  const observer = new ResizeObserver(layout);
  const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; previous = 0; wake(); });
  function dispose() {
    if (disposed) return;
    disposed = true;
    if (transition) { transition.resolve(false); transition = null; }
    cancelAnimationFrame(frame); events.abort(); observer.disconnect(); intersection.disconnect();
    scene.traverse(object => { if (object.material) object.material.dispose(); });
    geometry.dispose(); textures.forEach(texture => texture.dispose()); renderer.dispose(); canvas.remove();
  }
  try {
    active = await build(initial);
    light(initial);
    weight(active, 1);
    canvas.tabIndex = 0; canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-describedby', 'rotation-help');
    canvas.setAttribute('aria-label', initial.toUpperCase() + ' interactive planet. Drag to rotate, or use arrow keys.');
    canvas.dataset.planet = initial;
    canvas.setAttribute('aria-busy', 'false');
    host.append(canvas); layout(); renderer.render(scene, camera);
    observer.observe(host); intersection.observe(host); updatePause(); wake();
    listen(window, 'pagehide', event => { if (!event.persisted) dispose(); });
    return { select, dispose };
  } catch (error) { dispose(); throw error; }
}
