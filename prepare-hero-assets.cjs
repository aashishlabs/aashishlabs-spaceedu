// Reproducible small, local assets; no network dependency at runtime.
const sharp = require(process.env.SHARP_MODULE || 'sharp');
function hash(x,y,z) { const v = Math.sin(x*127.1+y*311.7+z*74.7)*43758.5453; return v-Math.floor(v); }
const mix = (a,b,t) => a+(b-a)*t;
function noise(x,y,z) {
  const ix=Math.floor(x),iy=Math.floor(y),iz=Math.floor(z);
  let u=x-ix,v=y-iy,w=z-iz; u=u*u*(3-2*u);v=v*v*(3-2*v);w=w*w*(3-2*w);
  return mix(mix(mix(hash(ix,iy,iz),hash(ix+1,iy,iz),u),mix(hash(ix,iy+1,iz),hash(ix+1,iy+1,iz),u),v),mix(mix(hash(ix,iy,iz+1),hash(ix+1,iy,iz+1),u),mix(hash(ix,iy+1,iz+1),hash(ix+1,iy+1,iz+1),u),v),w);
}
(async()=>{
  await sharp('assets/textures/earth_clouds.png').resize(2048,1024).webp({quality:88,alphaQuality:90}).toFile('assets/textures/earth_clouds.webp');
  const width=1024,height=512,data=Buffer.alloc(width*height*3);
  for(let y=0;y<height;y++) for(let x=0;x<width;x++) {
    const lon=x/width*Math.PI*2,lat=y/(height-1)*Math.PI;
    const a=Math.cos(lon)*Math.sin(lat),b=Math.cos(lat),c=Math.sin(lon)*Math.sin(lat);
    const warp=noise(a*3+8,b*3,c*3)*2;
    let density=0,amp=.43;
    for(let octave=0;octave<6;octave++) {const f=3*2**octave;density+=amp*noise(a*f+warp,b*f*1.7+warp,c*f);amp*=.58;}
    // Fine, warped ribbons give the cloud deck structure without larger textures.
    const filaments=noise(a*18+warp,b*24,c*18);
    const bands=Math.sin(b*42+warp*7+a*3+filaments*2)*.09;
    const t=Math.max(0,Math.min(1,(density+bands-.16)*1.5));
    const i=(y*width+x)*3;
    data[i]=mix(150,242,t);data[i+1]=mix(124,225,t);data[i+2]=mix(84,185,t);
  }
  await sharp(data,{raw:{width,height,channels:3}}).webp({quality:90}).toFile('assets/textures/venus_clouds.webp');
  console.log('Prepared 2K Earth clouds and 1K procedural Venus clouds.');
})().catch(error=>{console.error(error);process.exitCode=1});
