const fs = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────
const OUT                     = process.env.OUTPUT_DIR     || 'dist';
const ART_SRC                 = process.env.ART_SOURCE_DIR || 'assets/art';
const INDEX_LINK              = process.env.INDEX_LINK     || 'index.html';
const GALLERY_LINK            = process.env.GALLERY_LINK   || 'gallery.html';
const CONTACT_LINK            = process.env.CONTACT_LINK   || 'contact.html';

// ── Commission status ─────────────────────────────────
const COMMISSION_OPEN         = (process.env.COMMISSION_STATUS || 'open').toLowerCase() === 'open';
const COMMISSION_STATUS_CLASS = COMMISSION_OPEN ? 'open' : 'closed';
const COMMISSION_STATUS_LABEL = COMMISSION_OPEN ? 'Commissions Open' : 'Commissions Closed';

// ── Configurable settings ─────────────────────────────────────────────────────
// index page
const HERO_TAGLINE            = process.env.HERO_TAGLINE            || "Original art & custom commissions — made with love ☕";
const HERO_CTA                = process.env.HERO_CTA                || 'Browse the Gallery';
const ABOUT_HEADING           = process.env.ABOUT_HEADING           || 'About';
const ABOUT_BODY              = process.env.ABOUT_BODY              || "Welcome! I'm an independent artist specialising in character art, cozy illustrations, and custom commissions. Every piece is crafted with care — from first sketch to final colour.";
const ABOUT_CTA_INTRO         = process.env.ABOUT_CTA_INTRO         || 'Looking for something unique?';
const ABOUT_CTA_LINK_TEXT     = process.env.ABOUT_CTA_LINK_TEXT     || 'Check commission availability';
const FEATURED_HEADING        = process.env.FEATURED_HEADING        || 'Featured Work';
const GALLERY_MORE_TEXT       = process.env.GALLERY_MORE_TEXT       || 'See all artwork →';
// gallery page
const GALLERY_HEADING         = process.env.GALLERY_HEADING         || 'Gallery';
const GALLERY_META            = process.env.GALLERY_META            || 'A selection of original pieces and commission samples.';
const SAMPLE_COUNT            = parseInt(process.env.SAMPLE_COUNT   || '4', 10);
// contact page
const COMMISSIONS_HEADING     = process.env.COMMISSIONS_HEADING     || 'Commissions';
const COMMISSIONS_INTRO       = process.env.COMMISSIONS_INTRO       || "Interested in a custom piece? I offer a range of commission types. Send me a message with your idea and I'll get back to you as soon as possible.";
const TIER1_TITLE             = process.env.TIER1_TITLE             || 'Bust / Icon';
const TIER1_DESC              = process.env.TIER1_DESC              || 'Single character, cropped at shoulders. Great for profile pictures and reference sheets.';
const TIER2_TITLE             = process.env.TIER2_TITLE             || 'Half Body';
const TIER2_DESC              = process.env.TIER2_DESC              || 'Character shown to the waist with simple background options.';
const TIER3_TITLE             = process.env.TIER3_TITLE             || 'Full Body';
const TIER3_DESC              = process.env.TIER3_DESC              || 'Full character with detailed shading and a custom background scene.';
const TIER4_TITLE             = process.env.TIER4_TITLE             || 'Custom / Ask';
const TIER4_DESC              = process.env.TIER4_DESC              || 'Something else in mind? Reach out and we can work out a quote together.';
const CONTACT_HEADING         = process.env.CONTACT_HEADING         || 'Contact';
const VGEN_URL                = (process.env.VGEN_URL               || 'https://vgen.co/CoffeeEX').trim();
const VGEN_LINK_TEXT          = process.env.VGEN_LINK_TEXT          || '🎨 VGen Portfolio';
const EMAIL_LINK_TEXT         = process.env.EMAIL_LINK_TEXT         || '✉️ Email Me';
const DISCORD_URL             = (process.env.DISCORD_URL            || 'https://www.discord.com/users/339092532162068481').trim();
const DISCORD_LINK_TEXT       = process.env.DISCORD_LINK_TEXT       || '💬 Discord: coffee.ex';
const TELEGRAM_URL            = (process.env.TELEGRAM_URL           || 'https://t.me/coffeescrafts').trim();
const TELEGRAM_LINK_TEXT      = process.env.TELEGRAM_LINK_TEXT      || "📨 Telegram: Coffee's Crafts";
const TRELLO_URL              = (process.env.TRELLO_URL             || 'https://trello.com/b/uces30Ct/anthrocon-art-queue').trim();
const TRELLO_LINK_TEXT        = process.env.TRELLO_LINK_TEXT        || '📋 Art Queue Trello';
const QUEUE_TRACKING_TEXT     = process.env.QUEUE_TRACKING_TEXT     || 'Track art commission progress here:';
const TWITCH_URL              = (process.env.TWITCH_URL             || 'https://twitch.tv/coffeescrafts').trim();
const TWITCH_LINK_TEXT        = process.env.TWITCH_LINK_TEXT        || '📺 Twitch';
const FURSUIT_TOS_URL         = (process.env.FURSUIT_TOS_URL        || 'https://docs.google.com/document/d/1nN5qPhuR_FkKkcDdRS9EFwbbkudlANWd0wdbjgQee5s/edit?usp=sharing').trim();
const FURSUIT_TOS_LINK_TEXT   = process.env.FURSUIT_TOS_LINK_TEXT   || '📄 Fursuit TOS';
const FURSUIT_QUEUE_URL       = (process.env.FURSUIT_QUEUE_URL      || 'https://trello.com/b/1NyoDiwp/fursuit-wips').trim();
const FURSUIT_QUEUE_LINK_TEXT = process.env.FURSUIT_QUEUE_LINK_TEXT || '📋 Fursuit Queue Trello';
const FURSUIT_QUEUE_TEXT      = process.env.FURSUIT_QUEUE_TEXT      || 'Track fursuit commission progress here:';
const TOYHOUSE_URL            = (process.env.TOYHOUSE_URL           || 'https://toyhou.se/CoffeeEX').trim();
const TOYHOUSE_LINK_TEXT      = process.env.TOYHOUSE_LINK_TEXT      || '🏠 Toyhou.se';
const INSTAGRAM_URL           = (process.env.INSTAGRAM_URL          || 'https://www.instagram.com/coffeedemonn').trim();
const INSTAGRAM_LINK_TEXT     = process.env.INSTAGRAM_LINK_TEXT     || '📸 Instagram';
const CARRD_URL               = (process.env.CARRD_URL              || 'https://coffeescraftsgallery.carrd.co').trim();
const CARRD_LINK_TEXT         = process.env.CARRD_LINK_TEXT         || '🌐 Carrd';
const X_URL                   = (process.env.X_URL                  || 'https://x.com/coffeesden').trim();
const X_LINK_TEXT             = process.env.X_LINK_TEXT             || '🐦 X / Twitter';
// global site settings
const FOOTER_YEAR             = new Date().getFullYear();
const SITE_TITLE              = process.env.SITE_TITLE              || "Coffee's Crafts";
const CONTACT_EMAIL           = process.env.CONTACT_EMAIL           || 'coffee@coffeescrafts.com';
const FOOTER_TEXT             = `© ${FOOTER_YEAR} ${SITE_TITLE} — ${CONTACT_EMAIL}`;

// ── Build functions ───────────────────────────────────────────────────────

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  ensureDir(dest);
  for (const name of fs.readdirSync(src)) {
    const s = path.join(src, name);
    const d = path.join(dest, name);
    const st = fs.statSync(s);
    if (st.isDirectory()) copyDir(s, d);
    else fs.copyFileSync(s, d);
  }
}

function renderTemplate(name, vars) {
  const partialsDir = path.join('site', 'templates', 'partials');
  let tpl = fs.readFileSync(path.join('site', 'templates', name), 'utf8');
  tpl = tpl.replace(/\{\{>\s*([\w-]+)\s*\}\}/g, (_, partialName) => {
    const partialPath = path.join(partialsDir, `${partialName}.html`);
    return fs.existsSync(partialPath) ? fs.readFileSync(partialPath, 'utf8') : '';
  });
  return tpl.replace(/%%(\w+)%%/g, (_, key) => vars[key] != null ? vars[key] : '');
}

async function build() {
  ensureDir(OUT);
  copyDir('site/static', OUT);

  const artDest = path.join(OUT, ART_SRC);
  copyDir(ART_SRC, artDest);

  let images = [];
  console.log('Build settings:', { ART_SRC, SAMPLE_COUNT, OUT });

  if (fs.existsSync(ART_SRC)) {
    images = fs.readdirSync(ART_SRC)
      .filter(f => /\.(png|jpe?g|svg|gif|webp)$/i.test(f))
      .slice(0, SAMPLE_COUNT)
      .map(f => path.posix.join(ART_SRC.replace(/\\/g, '/'), f));
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
    HERO_TAGLINE,
    HERO_CTA,
    ABOUT_HEADING,
    ABOUT_BODY,
    ABOUT_CTA_INTRO,
    ABOUT_CTA_LINK_TEXT,
    FEATURED_HEADING,
    GALLERY_MORE_TEXT,
    GALLERY_HEADING,
    GALLERY_META,
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
    DISCORD_URL,
    DISCORD_LINK_TEXT,
    TELEGRAM_URL,
    TELEGRAM_LINK_TEXT,
    TRELLO_URL,
    TRELLO_LINK_TEXT,
    QUEUE_TRACKING_TEXT,
    TWITCH_URL,
    TWITCH_LINK_TEXT,
    FURSUIT_TOS_URL,
    FURSUIT_TOS_LINK_TEXT,
    FURSUIT_QUEUE_URL,
    FURSUIT_QUEUE_LINK_TEXT,
    FURSUIT_QUEUE_TEXT,
    TOYHOUSE_URL,
    TOYHOUSE_LINK_TEXT,
    INSTAGRAM_URL,
    INSTAGRAM_LINK_TEXT,
    CARRD_URL,
    CARRD_LINK_TEXT,
    X_URL,
    X_LINK_TEXT,
  };

  fs.writeFileSync(path.join(OUT, 'index.html'), renderTemplate('index.html', vars));
  fs.writeFileSync(path.join(OUT, 'gallery.html'), renderTemplate('gallery.html', vars));
  fs.writeFileSync(path.join(OUT, 'contact.html'), renderTemplate('contact.html', vars));

  try {
    const diag = {
      ART_SRC,
      SAMPLE_COUNT,
      VGEN_URL,
      imagesCount: images.length,
      images: images.slice(0, SAMPLE_COUNT),
      builtAt: new Date().toISOString(),
    };
    fs.writeFileSync(path.join(OUT, 'build-info.json'), JSON.stringify(diag, null, 2));
    console.log('Wrote build-info.json with diagnostics');
  } catch (e) {
    console.error('Failed to write build-info.json:', e && e.message ? e.message : e);
  }

  console.log('Site built to', OUT);
}

build().catch(err => {
  console.error('Build failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
