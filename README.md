# SpaceEdu demo

Independent fictional SpaceEdu portfolio demo for AashishLabs. Changes are limited to the hero.

## Local preview

Run `node serve.cjs`, then open http://127.0.0.1:4173. No install or build is required. The server binds only to localhost. `original.html` preserves the original MP4 version.

The upgraded hero uses local Three.js 0.180.0, textures, fonts and fallback images. Drag horizontally with a finger, or in any direction with a mouse. Focus the planet with Tab and use arrow keys to rotate. Side planets switch worlds. A subtle lower-right icon pauses rotation; instructions remain available to assistive technology. Credits are in CREDITS.md.

Switching loads the next world while keeping the current hero intact, then uses one 1.18-second exit/enter animation for the globe and copy. The headline, description, labels and CTA commit together while hidden. Additional clicks and dragging are ignored until the switch finishes. Previously loaded worlds are cached. Earth clouds use a 2K WebP; Venus adds an original 1K procedural cloud layer. `prepare-hero-assets.cjs` regenerates these two assets using Sharp.

Reduced motion disables automatic rotation and transitions, while manual rotation remains available. Rendering stops in hidden tabs and resumes when visible. WebGL 2 initialization failure, module/texture loading failure and context loss retain the still-image hero and planet switching. Reload to retry 3D after a failure.

## Browser checks

Run `node tests/hero.cjs` with Playwright installed, or set `PLAYWRIGHT_MODULE` to a local Playwright package directory. Checks cover desktop rendering, switching, mouse and touch dragging, keyboard controls, pause, reduced motion, mobile sizes, missing assets, and WebGL failure/context loss. Screenshots are written to `test-results/`.

Textures and licenses: [CREDITS.md](CREDITS.md). This is a visual learning demo; planet lighting, rotation speed and Venus surface visibility are artistic choices. No deployment has been configured or performed.
