# SpaceEdu demo

Independent fictional SpaceEdu portfolio demo for AashishLabs. Changes are limited to the hero.

## Local preview

Run `node serve.cjs`, then open http://127.0.0.1:4173. No install or build is required. The server binds only to localhost. `original.html` preserves the original MP4 version.

Homepage layout is in `homepage.css`; `hero-3d.css` retains rendering and transition integration. Body copy stays at 18px on desktop/tablet and 16px on mobile. Short screens can scroll vertically instead of shrinking or clipping the content. The renderer in `hero-3d.js` is unchanged by this layout pass.

## Adding content later

The hero is a section inside `main`, in normal document flow. Append future sections as siblings with the `data-homepage-section` attribute. `homepage-scroll.js` shows the subtle scroll cue only when such a visible section exists, scrolls to it, and transfers keyboard focus. Reduced motion uses an instant scroll. No new content sections or placeholder section are included yet; the remaining navigation and enrollment links still need destinations.

## Presentation assets

`prepare-ui-assets.cjs` uses Sharp to produce 288px selector WebPs, full-resolution WebP fallback backgrounds, a 48px PNG favicon and an irregular SVG starfield. Set `SHARP_MODULE` to a local Sharp package directory if needed. Original files are retained. Main Three.js texture files are untouched.

Measured local cold-load transfer at 1440 × 900: approximately 34.8 MB before and 5.5 MB after (84% reduction, using the same uncompressed development server). Three selector sources total 17.75 MB; their derived versions total 73 KB. The favicon is 5.8 KB instead of the 6.9 MB source. These are development measurements, not a production performance score.

The upgraded hero uses local Three.js 0.180.0, textures, fonts and fallback images. Drag horizontally with a finger, or in any direction with a mouse. Focus the planet with Tab and use arrow keys to rotate. Side planets switch worlds. A subtle lower-right icon pauses rotation; instructions remain available to assistive technology. Credits are in CREDITS.md.

Switching loads the next world while keeping the current hero intact, then uses one 1.18-second exit/enter animation for the globe and copy. The headline, description, labels and CTA commit together while hidden. Additional clicks and dragging are ignored until the switch finishes. Previously loaded worlds are cached. Earth clouds use a 2K WebP; Venus adds an original 1K procedural cloud layer. `prepare-hero-assets.cjs` regenerates these two assets using Sharp.

Reduced motion disables automatic rotation and transitions, while manual rotation remains available. Rendering stops in hidden tabs and resumes when visible. WebGL 2 initialization failure, module/texture loading failure and context loss retain the still-image hero and planet switching. Reload to retry 3D after a failure.

## Browser checks

Run `node tests/hero.cjs` with Playwright installed, or set `PLAYWRIGHT_MODULE` to a local Playwright package directory. Checks cover desktop rendering, switching, mouse and touch dragging, keyboard controls, pause, reduced motion, mobile sizes, missing assets, and WebGL failure/context loss. Screenshots are written to `test-results/`.

Run `node tests/homepage.cjs` for 1440, 1024, 768, 430 and 375px layouts plus landscape, minimum text size, selector/CTA bounds, menu bounds, console errors, transfer weight and the future scroll-target contract. It adds a temporary section only inside the test browser, never to the source page.

Textures and licenses: [CREDITS.md](CREDITS.md). This is a visual learning demo; planet lighting, rotation speed and Venus surface visibility are artistic choices. No deployment has been configured or performed.
