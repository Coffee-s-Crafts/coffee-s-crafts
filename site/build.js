const fs = require('fs');
const path = require('path');

const OUT = process.env.OUTPUT_DIR || 'dist';
const ART_SRC = process.env.ART_SOURCE_DIR || 'assets/art';
const SITE_TITLE = process.env.SITE_TITLE || "Coffee's Crafts";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'artist@example.com';
const VGEN_URL = process.env.VGEN_URL || 'https://vgen.co/CoffeeEX';
const VGEN_PORTFOLIO = process.env.VGEN_PORTFOLIO_URL || `${VGEN_URL}/portfolio`;
const SAMPLE_COUNT = parseInt(process.env.SAMPLE_COUNT || '6', 10);
const USE_VGEN = (process.env.USE_VGEN_IMAGES === 'true' || process.env.USE_VGEN_IMAGES === '1');

function ensureDir(p){
  if(!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest){
  if(!fs.existsSync(src)) return;
  ensureDir(dest);
  for(const name of fs.readdirSync(src)){
    const s = path.join(src, name);
    const d = path.join(dest, name);
    const st = fs.statSync(s);
    if(st.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function renderTemplate(name, vars){
  const tpl = fs.readFileSync(path.join('site','templates', name), 'utf8');
  return tpl.replace(/%%(\w+)%%/g, (_, key)=> vars[key] || '');
}

async function fetchVgenImages(){
  try{
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({ args: ['--no-sandbox','--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.goto(VGEN_PORTFOLIO, { waitUntil: 'networkidle2', timeout: 20000 });
    // give client-side JS a moment to render images
    await page.waitForTimeout(1000);
    const srcs = await page.$$eval('img', imgs => imgs.map(i => i.src).filter(Boolean));
    await browser.close();
    return Array.from(new Set(srcs)).filter(s => /^https?:\/\//i.test(s)).slice(0, SAMPLE_COUNT);
  }catch(e){
    console.error('Error fetching VGEN images with Puppeteer:', e && e.message ? e.message : e);
    return [];
  }
}

async function build(){
  // prepare output
  ensureDir(OUT);
  copyDir('site/static', OUT);

  // copy art assets (kept for fallback)
  const artDest = path.join(OUT, ART_SRC);
  copyDir(ART_SRC, artDest);

  // list/sample images
  let images = [];

  if(USE_VGEN){
    console.log('USE_VGEN_IMAGES enabled — attempting to fetch images from', VGEN_PORTFOLIO);
    images = await fetchVgenImages();
    console.log('VGEN images found:', images.length);
  }

  // fallback to local assets when no remote images found or not enabled
  if(!images || images.length === 0){
    if(fs.existsSync(ART_SRC)){
      images = fs.readdirSync(ART_SRC)
        .filter(f => /\.(png|jpe?g|svg|gif|webp)$/i.test(f))
        .slice(0, SAMPLE_COUNT)
        .map(f => path.posix.join(ART_SRC.replace(/\\/g,'/'), f));
    }
  }

  const sampleHtml = images.map(i => `<li><img src="${i}" alt="art"/></li>`).join('\n');

  const vars = {
    SITE_TITLE,
    CONTACT_EMAIL,
    VGEN_URL,
    SAMPLE_IMAGES: sampleHtml,
  };

  fs.writeFileSync(path.join(OUT,'index.html'), renderTemplate('index.html', vars));
  fs.writeFileSync(path.join(OUT,'gallery.html'), renderTemplate('gallery.html', vars));
  fs.writeFileSync(path.join(OUT,'contact.html'), renderTemplate('contact.html', vars));

  console.log('Site built to', OUT);
}

build().catch(err => {
  console.error('Build failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
