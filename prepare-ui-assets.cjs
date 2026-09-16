// Derived presentation assets only; the Three.js surface maps remain untouched.
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const fs = require('node:fs');
const sources = {
  earth: ['hf_20260827_202005_3346cc4d-ec3b-44ab-825c-b18e49f5021a.png', 'hf_20260827_202133_508c64b8-a31e-4290-bdfc-1187df70e0a6.png'],
  venus: ['hf_20260827_202012_640b239a-d08a-4200-adb2-741bbe129ac8.png', 'hf_20260827_202133_cf55d1d8-7b59-4a64-80da-d72052ae974e.png'],
  mars: ['hf_20260827_202018_3d559490-f613-4ed7-a3bb-3b7e9fc90fb8.png', 'hf_20260827_202133_0ba6de7c-285d-43dc-b7ab-8c54c73707cb.png'],
};
(async () => {
  fs.mkdirSync('assets/ui', { recursive: true });
  for (const [name, [thumbnail, fallback]] of Object.entries(sources)) {
    await sharp('assets/' + thumbnail).resize(288, 288, { fit: 'inside' }).webp({ quality: 94, alphaQuality: 100 }).toFile('assets/ui/' + name + '-thumbnail.webp');
    // Preserve fallback resolution; use visually lossless high-quality encoding.
    await sharp('assets/' + fallback).webp({ quality: 94 }).toFile('assets/ui/' + name + '-fallback.webp');
  }
  await sharp('assets/' + sources.earth[0]).resize(48, 48, { fit: 'contain', background: '#00000000' }).png().toFile('assets/ui/favicon.png');
  let seed = 42;
  const random = () => { seed = (1664525 * seed + 1013904223) >>> 0; return seed / 4294967296; };
  const stars = Array.from({ length: 175 }, () => `<circle cx="${(random()*1600).toFixed(1)}" cy="${(random()*1100).toFixed(1)}" r="${(.35+random()*.8).toFixed(2)}" opacity="${(.15+random()*.5).toFixed(2)}"/>`).join('');
  fs.writeFileSync('assets/ui/stars.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1100" viewBox="0 0 1600 1100"><g fill="#d3e5fa">${stars}</g></svg>`);
  console.log('Created selector thumbnails, full-resolution fallbacks, favicon and subtle starfield.');
})().catch(error => { console.error(error); process.exitCode = 1; });
