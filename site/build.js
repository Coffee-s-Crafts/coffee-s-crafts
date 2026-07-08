const fs = require('fs');
const path = require('path');

// ── Paths ─────────────────────────────────────────────
const OUT                     = process.env.OUTPUT_DIR     || 'dist';
const ART_SRC                 = process.env.ART_SOURCE_DIR || 'assets/art';
const INDEX_LINK              = process.env.INDEX_LINK     || 'index.html';
const GALLERY_LINK            = process.env.GALLERY_LINK   || 'gallery.html';
const ART_LINK                = process.env.ART_LINK       || 'art.html';
const FURSUIT_LINK            = process.env.FURSUIT_LINK   || 'fursuit.html';
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
const ABOUT_BODY              = process.env.ABOUT_BODY              || "Welcome! I'm an independent artist specializing in character art, fursuits, and custom commissions. Every piece is crafted with care and skill, with your input always in mind.";
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
// Terms/TOC URLs
const ART_TOS_URL             = (process.env.ART_TOS_URL             || 'tos.html').trim();
const ART_TOS_LINK_TEXT       = process.env.ART_TOS_LINK_TEXT       || '📄 Terms of Service';
const FURSUIT_TOS_URL         = (process.env.FURSUIT_TOS_URL        || 'fursuit-tos.html').trim();
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

// ── New page content (configurable via env) ─────────────────────────────────
const ART_SECTIONS = process.env.ART_SECTIONS ? JSON.parse(process.env.ART_SECTIONS) : [
  {
    title: 'Full Body (not for commercial use): $20',
    paragraphs: ['One fullbody of your chosen furry character!'],
    details: ['Delivered as a PNG'],
    addons: ['Shading', 'Extra Characters', 'Background options'],
    important: ['Please be as detailed as possible when explaining what you\'d like, such as pose, expression, etc. NO SHADED REFERENCES PLEASE.']
  },
  {
    title: 'Furry Headshot (not for commercial use): $10',
    paragraphs: ['Includes one headshot of your furry character.'],
    details: ['Delivered as a PNG'],
    addons: ['Shading', 'Simple color background', 'Simple splash background'],
    important: ['Please be as thorough as possible when describing what you want. NO SHADED REFERENCE SHEETS.']
  },
  {
    title: 'Furry PNGTuber: $35',
    paragraphs: ['Four frames of your character and a step-by-step setup guide for PNGTuber use.'],
    details: ['File is a .veado file to be used on Veadotube.'],
    addons: [],
    important: ['Please provide an unshaded reference.']
  },
  {
    title: 'Scenic Furry: $50',
    paragraphs: ['A scenic drawing of one (or more) of your characters. Scenery depends on complexity type.'],
    details: ['File delivered as a PNG.'],
    addons: ['Extra characters', 'Background complexity'],
    important: ['NO SHADED REFERENCE SHEETS. Please provide detailed scene description and reference photos when possible.']
  },
  {
    title: 'Furry Reference Sheet: $45',
    paragraphs: ['Symmetrical front & back of your character. There are free add-ons such as putting the characters likes and dislikes on the ref.'],
    details: [],
    addons: ['See request form for many add-ons'],
    important: ['PLEASE send unshaded artworks of your character. If requesting a custom character, include the custom character add-on fee.']
  }
];

const FURSUIT_PRICES = process.env.FURSUIT_PRICES ? JSON.parse(process.env.FURSUIT_PRICES) : [
  { name: 'Head only', price: '$465' },
  { name: 'Paws only', price: '$85' },
  { name: 'Feetpaws only', price: '$165' },
  { name: 'One foot tail (Each additional foot is +$20)', price: '$60' },
  { name: 'Planti legs only', price: '$225' },
  { name: 'Digi legs only', price: '$325' },
  { name: 'Mini partial', price: '$645' },
  { name: 'Mini partial + feet', price: '$765' },
  { name: 'Mini partial + feet + armsleeves', price: '$865' },
  { name: '3/4 planti', price: '$1,085' },
  { name: '3/4 digi', price: '$1,185' },
  { name: 'Full planti', price: '$1,335' },
  { name: 'Full digi', price: '$1,435' }
];

// Terms of Service structured content
const TOS_TITLE = process.env.TOS_TITLE || "CoffeeEX's Terms of Service";
const TOS_UPDATED = process.env.TOS_UPDATED || 'Updated May 26, 2026';
const TOS_SECTIONS = process.env.TOS_SECTIONS ? JSON.parse(process.env.TOS_SECTIONS) : [
  { heading: 'GENERAL', paragraphs: ["I reserve the right to decline any commission. No ABDL/Feral NSFW."] },
  { heading: 'PAYMENTS', paragraphs: ['All payments will be made through VGen.'] },
  { heading: 'REVISIONS', paragraphs: ['Revisions can be requested during the sketch phase mainly. Small lineart and color/marking changes can be made, such as to make them more accurate to what you want, but drastic changes to lineart/markings are not allowed, if they aren\'t shown on the ref sheet.'] },
  { heading: 'DEADLINES AND DELIVERY', paragraphs: ['Deadlines are minimum 1 month. Delivery is through messaging as a PNG.'] },
  { heading: 'USE', paragraphs: ['Personal use only, DO NOT use for AI purposes. Please credit me wherever you post it.'] },
  { heading: 'REFUNDS', paragraphs: ['No refunds available after sketch is sent. Full refund if no sketch is sent yet.'] },
  { heading: 'COMMUNICATION', paragraphs: ['Please message me on discord, coffee.ex if you cannot contact me on VGen.'] }
];

// Fursuit TOS (default placeholder: paste content from provided Google Doc)
const FURSUIT_TOS_TITLE = process.env.FURSUIT_TOS_TITLE || 'Fursuit Terms of Service';
const FURSUIT_TOS_UPDATED = process.env.FURSUIT_TOS_UPDATED || 'Source: https://docs.google.com/document/d/1nN5qPhuR_FkKkcDdRS9EFwbbkudlANWd0wdbjgQee5s/edit?tab=t.0';
const FURSUIT_TOS_SECTIONS = process.env.FURSUIT_TOS_SECTIONS ? JSON.parse(process.env.FURSUIT_TOS_SECTIONS) : [
  {
    heading: 'Introduction',
    paragraphs: [
      "Howdy there! I see you like my fursuits, eh? Well, let’s get into some information I think you should know about me and my work.",
      `LINK TO MY TRELLO QUEUE: <a href="${FURSUIT_QUEUE_URL}" target="_blank" rel="noopener">${FURSUIT_QUEUE_URL}</a>`
    ]
  },
  {
    heading: 'Prices',
    paragraphs: [
      "Each price is the flat rate that I charge for my time, effort, and skill for making a suit. It DOES NOT include any extra add-ons, complexity of the character, or overall material cost. For an exact price for a certain character, you’d have to get a quote from me (quotes are free). If I give you a quote and you dislike the price, please respond courteously — a brief 'I've decided not to get this' is fine.",
      `If you’d like a free quote, DM me on my Instagram: <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">${INSTAGRAM_URL}</a>. If I do not respond in about a day, contact me via my business email at <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>.`
    ]
  },
  {
    heading: 'Add-Ons',
    paragraphs: [
      'Add-ons are anything extra you want on a suit. Some are highly specific and are not listed here — DM me to ask about custom add-ons and pricing.',
      'Current add-ons include: Magnetic Eyelids (experimental) — base set + second set of your choosing for $35; Claws for Paws — $20 base (larger/longer claws cost more).'
    ]
  },
  {
    heading: 'What to Expect',
    paragraphs: [
      "My work is done by hand and small imperfections can occur (for example, a hidden hot-glue spot or a small bald patch). I will always put my best effort into each piece.",
      'I DO NOT currently line my fursuit heads — I find lining can make the head more stuffy. If this is a dealbreaker, please find another maker. ' ,
      'I work in focused sessions and may take breaks. Some suits can take from a few months up to a year depending on complexity and scheduling. You may request WIPs or progress reports at any time.'
    ]
  },
  {
    heading: 'Payment Plans',
    paragraphs: [
      'Payment plans are available. You must make a payment each month; the amount is agreed when the plan is set up. Do not underpay (for example $10/month) as that is not sustainable.',
      'If you fail to make payments or repeatedly underpay, I may drop your commission and issue a partial refund (materials are non-refundable). If you cease contact for several months without response, no refund will be issued until you re-establish communication.'
    ]
  },
  {
    heading: 'Repair & Refund Policy',
    paragraphs: [
      'If items arrive damaged (huge holes, tearing, etc.) provide photo/video evidence and I will repair the items free of charge if the box is undamaged. If the box is damaged in shipping, I will repair the suit but you must cover return shipping.',
      'If you become unresponsive for 6+ months after I request necessary info (materials, measurements, etc.), I will return whatever I have completed and will not issue a refund for work done. For shorter unresponsiveness I will wait and may offer partial refunds depending on progress.'
    ]
  },
  {
    heading: 'Contact & Misc',
    paragraphs: [
      'Contact me on my suit-making account or business email first when requesting a quote.',
      `Instagrams: Art account <a href="${INSTAGRAM_URL}" target="_blank" rel="noopener">${INSTAGRAM_URL}</a>`,
      `Business email: <a href="mailto:${CONTACT_EMAIL}">${CONTACT_EMAIL}</a>`,
      `Toyhou.se: <a href="${TOYHOUSE_URL}" target="_blank" rel="noopener">${TOYHOUSE_URL}</a>`,
      'Thank you for reading — if you consider commissioning me, it really means a lot to me as a small business.'
    ]
  }
];

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
  // Recursive renderer to support nested each blocks and `this` values
  function renderString(str, vars, ctxThis) {
    const openTag = '{{#each';
    let startIndex = str.indexOf(openTag);
    while (startIndex !== -1) {
      const openClose = str.indexOf('}}', startIndex);
      if (openClose === -1) break;
      const arrName = str.slice(startIndex + openTag.length, openClose).trim();

      // find matching closing tag taking nesting into account
      let depth = 1;
      let searchIndex = openClose + 2;
      let nextOpen, nextClose;
      while (depth > 0) {
        nextOpen = str.indexOf(openTag, searchIndex);
        nextClose = str.indexOf('{{/each}}', searchIndex);
        if (nextClose === -1) {
          // no matching close
          searchIndex = -1;
          break;
        }
        if (nextOpen !== -1 && nextOpen < nextClose) {
          depth++;
          searchIndex = nextOpen + 1;
        } else {
          depth--;
          searchIndex = nextClose + '{{/each}}'.length;
        }
      }
      if (searchIndex === -1) break;
      const blockStart = openClose + 2;
      const blockEnd = searchIndex - '{{/each}}'.length;
      const block = str.slice(blockStart, blockEnd);

      let arr = [];
      if (arrName.indexOf('this.') === 0) {
        const prop = arrName.slice(5);
        arr = ctxThis && Array.isArray(ctxThis[prop]) ? ctxThis[prop] : [];
      } else {
        arr = Array.isArray(vars[arrName]) ? vars[arrName] : [];
      }
      const rendered = arr.map(item => renderString(block, vars, item)).join('');
      str = str.slice(0, startIndex) + rendered + str.slice(searchIndex);
      startIndex = str.indexOf(openTag, startIndex + rendered.length);
    }

    // replace simple placeholders like {{this.prop}}, {{this}} or {{KEY}}
    str = str.replace(/\{\{\s*([\w\.]+)\s*\}\}/g, (_, key) => {
      if (key === 'this') return ctxThis != null ? String(ctxThis) : '';
      if (key.indexOf('this.') === 0) {
        const prop = key.slice(5);
        return ctxThis && ctxThis[prop] != null ? String(ctxThis[prop]) : '';
      }
      return vars[key] != null ? String(vars[key]) : '';
    });

    // handle %%TOKENS%%
    str = str.replace(/%%(\w+)%%/g, (_, key) => vars[key] != null ? vars[key] : '');
    return str;
  }

  return renderString(tpl, vars, null);
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
    ART_LINK,
    FURSUIT_LINK,
    ART_SECTIONS,
    FURSUIT_PRICES,
    TOS_TITLE,
    TOS_UPDATED,
    TOS_SECTIONS,
    FURSUIT_TOS_TITLE,
    FURSUIT_TOS_UPDATED,
    FURSUIT_TOS_SECTIONS,
    ART_TOS_URL,
    ART_TOS_LINK_TEXT,
    FURSUIT_TOS_URL,
    FURSUIT_TOS_LINK_TEXT,
  };

  fs.writeFileSync(path.join(OUT, 'index.html'), renderTemplate('index.html', vars));
  fs.writeFileSync(path.join(OUT, 'gallery.html'), renderTemplate('gallery.html', vars));
  fs.writeFileSync(path.join(OUT, 'contact.html'), renderTemplate('contact.html', vars));
  fs.writeFileSync(path.join(OUT, 'art.html'), renderTemplate('art.html', vars));
  fs.writeFileSync(path.join(OUT, 'fursuit.html'), renderTemplate('fursuit.html', vars));
  fs.writeFileSync(path.join(OUT, 'tos.html'), renderTemplate('tos.html', vars));
  fs.writeFileSync(path.join(OUT, 'fursuit-tos.html'), renderTemplate('fursuit-tos.html', vars));

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
