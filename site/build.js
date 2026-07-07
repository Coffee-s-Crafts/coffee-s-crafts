const fs = require('fs');
const path = require('path');

const OUT = process.env.OUTPUT_DIR || 'dist';
const ART_SRC = process.env.ART_SOURCE_DIR || 'assets/art';
const SITE_TITLE = process.env.SITE_TITLE || "Coffee's Crafts";
const CONTACT_EMAIL = process.env.CONTACT_EMAIL || 'artist@example.com';
const VGEN_URL = process.env.VGEN_URL || 'https://vgen.co/CoffeeEX';
const SAMPLE_COUNT = parseInt(process.env.SAMPLE_COUNT || '6', 10);

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

// prepare output
ensureDir(OUT);
copyDir('site/static', OUT);

// copy art assets
const artDest = path.join(OUT, ART_SRC);
copyDir(ART_SRC, artDest);

// list sample images from art folder
let images = [];
if(fs.existsSync(ART_SRC)){
  images = fs.readdirSync(ART_SRC)
    .filter(f => /\.(png|jpe?g|svg|gif)$/i.test(f))
    .slice(0, SAMPLE_COUNT)
    .map(f => path.posix.join(ART_SRC.replace(/\\/g,'/'), f));
}

const vars = {
  SITE_TITLE,
  CONTACT_EMAIL,
  VGEN_URL,
  SAMPLE_IMAGES: images.map(i => `<li><img src="${i}" alt="art"/></li>`).join('\n'),
};

fs.writeFileSync(path.join(OUT,'index.html'), renderTemplate('index.html', vars));
fs.writeFileSync(path.join(OUT,'gallery.html'), renderTemplate('gallery.html', vars));
fs.writeFileSync(path.join(OUT,'contact.html'), renderTemplate('contact.html', vars));

console.log('Site built to', OUT);
