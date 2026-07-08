const fs = require('fs');
const path = require('path');

const OUT = process.env.OUTPUT_DIR || 'dist';
const ART_SRC = process.env.ART_SOURCE_DIR || 'assets/art';
const SITE_TITLE = process.env.SITE_TITLE || "Coffee's Crafts";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'coffee@coffeescrafts.com';
const SAMPLE_COUNT = parseInt(process.env.SAMPLE_COUNT || '6', 10);
const INDEX_LINK = process.env.INDEX_LINK || 'index.html';
const GALLERY_LINK = process.env.GALLERY_LINK || 'gallery.html';
const CONTACT_LINK = process.env.CONTACT_LINK || 'contact.html';
// Feature flag: whether to use remote VGEN image generation
const USE_VGEN = process.env.USE_VGEN === 'true' || process.env.USE_VGEN_IMAGES === 'true' || process.env.USE_VGEN_IMAGES === '1';
const VGEN_PORTFOLIO = process.env.VGEN_PORTFOLIO || process.env.VGEN_PORTFOLIO_URL || '';
const DEFAULT_VGEN_URL = 'https://vgen.co/CoffeeEX';
const VGEN_URL = (process.env.VGEN_URL || VGEN_PORTFOLIO || DEFAULT_VGEN_URL).trim();
const COMMISSION_OPEN = (process.env.COMMISSION_STATUS || 'open').toLowerCase() === 'open';
const COMMISSION_STATUS_CLASS = COMMISSION_OPEN ? 'open' : 'closed';
const COMMISSION_STATUS_LABEL = COMMISSION_OPEN ? 'Commissions Open' : 'Commissions Closed';
const FOOTER_YEAR = new Date().getFullYear();
const FOOTER_TEXT = `© ${FOOTER_YEAR} ${SITE_TITLE} — ${CONTACT_EMAIL}`;

// ── Configurable copy ─────────────────────────────────────────────────────
// index page
const HERO_TAGLINE        = process.env.HERO_TAGLINE        || "Original art & custom commissions — made with love ☕";
const HERO_CTA            = process.env.HERO_CTA            || "Browse the Gallery";
const ABOUT_HEADING       = process.env.ABOUT_HEADING       || "About";
const ABOUT_BODY          = process.env.ABOUT_BODY          || "Welcome! I'm an independent artist specialising in character art, cozy illustrations, and custom commissions. Every piece is crafted with care — from first sketch to final colour.";
const ABOUT_CTA_INTRO     = process.env.ABOUT_CTA_INTRO     || "Looking for something unique?";
const ABOUT_CTA_LINK_TEXT = process.env.ABOUT_CTA_LINK_TEXT || "Check commission availability";
const FEATURED_HEADING    = process.env.FEATURED_HEADING    || "Featured Work";
const GALLERY_MORE_TEXT   = process.env.GALLERY_MORE_TEXT   || "See all artwork →";
// gallery page
const GALLERY_HEADING     = process.env.GALLERY_HEADING     || "Gallery";
const GALLERY_META        = process.env.GALLERY_META        || "A selection of original pieces and commission samples.";
// contact page
const COMMISSIONS_HEADING = process.env.COMMISSIONS_HEADING || "Commissions";
const COMMISSIONS_INTRO   = process.env.COMMISSIONS_INTRO   || "Interested in a custom piece? I offer a range of commission types. Send me a message with your idea and I'll get back to you as soon as possible.";
const TIER1_TITLE         = process.env.TIER1_TITLE         || "Bust / Icon";
const TIER1_DESC          = process.env.TIER1_DESC          || "Single character, cropped at shoulders. Great for profile pictures and reference sheets.";
const TIER2_TITLE         = process.env.TIER2_TITLE         || "Half Body";
const TIER2_DESC          = process.env.TIER2_DESC          || "Character shown to the waist with simple background options.";
const TIER3_TITLE         = process.env.TIER3_TITLE         || "Full Body";
const TIER3_DESC          = process.env.TIER3_DESC          || "Full character with detailed shading and a custom background scene.";
const TIER4_TITLE         = process.env.TIER4_TITLE         || "Custom / Ask";
const TIER4_DESC          = process.env.TIER4_DESC          || "Something else in mind? Reach out and we can work out a quote together.";
const CONTACT_HEADING     = process.env.CONTACT_HEADING     || "Get in Touch";
const VGEN_LINK_TEXT      = process.env.VGEN_LINK_TEXT      || "🎨 VGen Portfolio";
const EMAIL_LINK_TEXT     = process.env.EMAIL_LINK_TEXT     || "✉️ Email Me";

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
// Optional remote VGEN fetching with local art fallback.

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
    let timeout;
    try{
      console.log('Attempting to fetch VGEN portfolio from', VGEN_PORTFOLIO);
      const controller = new AbortController();
      timeout = setTimeout(()=>controller.abort(), 5000);
      const res = await fetch(VGEN_PORTFOLIO, { signal: controller.signal });
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
          contentSaved = images.length > 0;
        }else if(typeof data === 'string'){
          const urls = Array.from(data.matchAll(/https?:\/\/[\w\-./%]+\.(png|jpe?g|svg|gif|webp)/ig)).map(m => m[0]);
          images = urls.slice(0, SAMPLE_COUNT);
          contentSaved = images.length > 0;
        }
      }else{
        fetchError = `VGEN responded ${res.status}`;
      }
    }catch(err){
      fetchError = err && err.message ? err.message : String(err);
    }finally{
      if(timeout) clearTimeout(timeout);
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
    FOOTER_TEXT,
    SAMPLE_IMAGES: sampleHtml,
    INDEX_LINK,
    GALLERY_LINK,
    CONTACT_LINK,
    VGEN_URL,
    COMMISSION_STATUS_CLASS,
    COMMISSION_STATUS_LABEL,
    // index copy
    HERO_TAGLINE,
    HERO_CTA,
    ABOUT_HEADING,
    ABOUT_BODY,
    ABOUT_CTA_INTRO,
    ABOUT_CTA_LINK_TEXT,
    FEATURED_HEADING,
    GALLERY_MORE_TEXT,
    // gallery copy
    GALLERY_HEADING,
    GALLERY_META,
    // contact copy
    COMMISSIONS_HEADING,
    COMMISSIONS_INTRO,
    TIER1_TITLE,
    TIER1_DESC,
    TIER2_TITLE,
    TIER2_DESC,
    TIER3_TITLE,
    TIER3_DESC,
    TIER4_TITLE,
    TIER4_DESC,
    CONTACT_HEADING,
    VGEN_LINK_TEXT,
    EMAIL_LINK_TEXT,
  };

  fs.writeFileSync(path.join(OUT,'index.html'), renderTemplate('index.html', vars));
  fs.writeFileSync(path.join(OUT,'gallery.html'), renderTemplate('gallery.html', vars));
  fs.writeFileSync(path.join(OUT,'contact.html'), renderTemplate('contact.html', vars));

  // diagnostics file for CI: records image source selection and fetch status
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
