// Five additional portraits for the solar-system section; hero assets are never changed.
const fs = require('node:fs');
const sharp = require(process.env.SHARP_MODULE || 'sharp');
const sources = {
  mercury: 'https://science.nasa.gov/wp-content/uploads/2024/03/pia15162-mercury-basins-messenger-16x9-1.jpg?w=1024',
  jupiter: 'https://science.nasa.gov/wp-content/uploads/2024/03/jupiter-marble-pia22946-16x9-1.jpg?w=1024',
  saturn: 'https://science.nasa.gov/wp-content/uploads/2023/05/saturn-farewell-pia21345-sse-banner-1920x640-1.jpg?w=1024',
  uranus: 'https://science.nasa.gov/wp-content/uploads/2024/03/uranus-pia18182-16x9-1.jpg?w=1024',
  neptune: 'https://science.nasa.gov/wp-content/uploads/2024/03/pia01492-neptune-full-disk-16x9-1.jpg?w=1024',
};
(async () => {
  fs.mkdirSync('assets/explore', { recursive: true });
  for (const [name, url] of Object.entries(sources)) {
    const response = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!response.ok) throw new Error(name + ': ' + response.status);
    const source = Buffer.from(await response.arrayBuffer());
    await sharp(source).trim({ background: '#000000', threshold: 18 }).resize(560, 480, { fit: 'inside', withoutEnlargement: true }).webp({ quality: 91 }).toFile('assets/explore/' + name + '.webp');
    console.log(name + ': ' + fs.statSync('assets/explore/' + name + '.webp').size + ' bytes');
  }
})().catch(error => { console.error(error.message); process.exitCode = 1; });
