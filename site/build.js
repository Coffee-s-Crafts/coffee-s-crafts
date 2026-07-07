const fs = require('fs');
const path = require('path');

const OUT = process.env.OUTPUT_DIR || 'dist';
const ART_SRC = process.env.ART_SOURCE_DIR || 'assets/art';
const SITE_TITLE = process.env.SITE_TITLE || "Coffee's Crafts";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'artist@example.com';
const VGEN_URL = process.env.VGEN_URL || 'https://vgen.co/CoffeeEX';
const VGEN_PORTFOLIO = process.env.VGEN_PORTFOLIO_URL || `${VGEN_URL}/portfolio`;
const SAMPLE_COUNT = parseInt(process.env.SAMPLE_COUNT || '6', 10);
// Allow enabling VGEN image fetch via env or automatically enable in GitHub Actions CI
const USE_VGEN = (
  process.env.USE_VGEN_IMAGES === 'true' ||
  process.env.USE_VGEN_IMAGES === '1' ||
  process.env.GITHUB_ACTIONS === 'true'
);

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
    const list = Array.from(new Set(srcs)).filter(s => /^https?:\/\//i.test(s)).slice(0, SAMPLE_COUNT);
    return { images: list, error: null };
  }catch(e){
    const msg = e && e.message ? e.message : String(e);
    console.error('Error fetching VGEN images with Puppeteer:', msg);
    return { images: [], error: msg };
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
  let fetchError = null;

  console.log('Build settings:', { USE_VGEN, VGEN_PORTFOLIO, ART_SRC, SAMPLE_COUNT });
  if(USE_VGEN){
    console.log('USE_VGEN_IMAGES enabled — attempting to fetch images from', VGEN_PORTFOLIO);
    const res = await fetchVgenImages();
    images = res.images || [];
    fetchError = res.error || null;
    console.log('VGEN images found:', images.length);
    if(fetchError) console.error('VGEN fetch error:', fetchError);
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

  // diagnostics file for CI: records chosen image sources and any errors
  try{
    const diag = {
      USE_VGEN,
      VGEN_PORTFOLIO,
      ART_SRC,
      SAMPLE_COUNT,
      imagesCount: images.length,
      images: images.slice(0, SAMPLE_COUNT),
      fetchError,
      builtAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(OUT,'build-info.json'), JSON.stringify(diag, null, 2));
    console.log('Wrote build-info.json with diagnostics');
  }catch(e){
    console.error('Failed to write build-info.json:', e && e.message ? e.message : e);
  }

  console.log('Site built to', OUT);
}

build().catch(err => {
  console.error('Build failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
