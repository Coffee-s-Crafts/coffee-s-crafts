const fs = require('fs');
const path = require('path');

const OUT = process.env.OUTPUT_DIR || 'dist';
const ART_SRC = process.env.ART_SOURCE_DIR || 'assets/art';
const SITE_TITLE = process.env.SITE_TITLE || "Coffee's Crafts";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'artist@example.com';
const SAMPLE_COUNT = parseInt(process.env.SAMPLE_COUNT || '6', 10);
const INDEX_LINK = process.env.INDEX_LINK || 'index.html';
const GALLERY_LINK = process.env.GALLERY_LINK || 'gallery.html';
const CONTACT_LINK = process.env.CONTACT_LINK || 'contact.html';
// Feature flag: whether to use remote VGEN image generation
const USE_VGEN = process.env.USE_VGEN === 'true' || process.env.USE_VGEN_IMAGES === 'true' || process.env.USE_VGEN_IMAGES === '1';
const VGEN_PORTFOLIO = process.env.VGEN_PORTFOLIO || process.env.VGEN_PORTFOLIO_URL || '';
const VGEN_URL = process.env.VGEN_URL || VGEN_PORTFOLIO || '';

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
// No remote VGEN fetching: build uses local art assets only.

async function build(){
  // prepare output
  ensureDir(OUT);
  copyDir('site/static', OUT);

  // copy art assets (kept for fallback)
  const artDest = path.join(OUT, ART_SRC);
  copyDir(ART_SRC, artDest);

  // list/sample images
  let images = [];

  console.log('Build settings:', { ART_SRC, SAMPLE_COUNT, OUT });

  // Try VGEN portfolio when enabled
  let fetchError = null;
  let contentSaved = false;
  if(USE_VGEN && VGEN_PORTFOLIO){
    try{
      console.log('Attempting to fetch VGEN portfolio from', VGEN_PORTFOLIO);
      const controller = new AbortController();
      const timeout = setTimeout(()=>controller.abort(), 5000);
      const res = await fetch(VGEN_PORTFOLIO, { signal: controller.signal });
      clearTimeout(timeout);
      if(res.ok){
        const ct = res.headers.get('content-type') || '';
        let data;
        if(ct.includes('application/json')) data = await res.json();
        else data = await res.text();

        if(Array.isArray(data)){
          images = data
            .filter(u => typeof u === 'string')
            .filter(f => /\.(png|jpe?g|svg|gif|webp)$/i.test(f))
            .slice(0, SAMPLE_COUNT);
        }else if(typeof data === 'string'){
          const urls = Array.from(data.matchAll(/https?:\/\/[\w\-./%]+\.(png|jpe?g|svg|gif|webp)/ig)).map(m => m[0]);
          images = urls.slice(0, SAMPLE_COUNT);
        }
      }else{
        fetchError = `VGEN responded ${res.status}`;
      }
    }catch(err){
      fetchError = err && err.message ? err.message : String(err);
    }
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
    SAMPLE_IMAGES: sampleHtml,
    INDEX_LINK,
    GALLERY_LINK,
    CONTACT_LINK,
    VGEN_URL,
  };

  fs.writeFileSync(path.join(OUT,'index.html'), renderTemplate('index.html', vars));
  fs.writeFileSync(path.join(OUT,'gallery.html'), renderTemplate('gallery.html', vars));
  fs.writeFileSync(path.join(OUT,'contact.html'), renderTemplate('contact.html', vars));

  // diagnostics file for CI: records chosen image sources
  try{
    const diag = {
      ART_SRC,
      SAMPLE_COUNT,
      USE_VGEN,
      VGEN_PORTFOLIO,
      fetchError,
      contentSaved,
      imagesCount: images.length,
      images: images.slice(0, SAMPLE_COUNT),
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
