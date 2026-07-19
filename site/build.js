const fs = require('fs');
const path = require('path');
const _now = new Date();

// ── Paths ─────────────────────────────────────────────
const OUT                     = process.env.OUTPUT_DIR         || 'dist';
const ART_SRC                 = process.env.ART_SOURCE_DIR     || 'assets/art';
const FURSUIT_SRC             = process.env.FURSUIT_SOURCE_DIR || 'assets/fursuits';

const INDEX_LINK              = process.env.INDEX_LINK         || 'index.html';
const GALLERY_LINK            = process.env.GALLERY_LINK       || 'gallery.html';
const CONTACT_LINK            = process.env.CONTACT_LINK       || 'contact.html';
const ART_LINK                = process.env.ART_LINK           || 'art.html';
const FURSUIT_LINK            = process.env.FURSUIT_LINK       || 'fursuit.html';
const ART_TOS_LINK            = process.env.ART_TOS_LINK       || 'tos.html';
const FURSUIT_TOS_LINK        = process.env.FURSUIT_TOS_LINK   || 'fursuit-tos.html';


// ── Commission status ─────────────────────────────────
const COMMISSION_OPEN         = (process.env.COMMISSION_STATUS || 'open').toLowerCase() === 'open';
const COMMISSION_STATUS_CLASS = COMMISSION_OPEN ? 'open' : 'closed';
const COMMISSION_STATUS_LABEL = COMMISSION_OPEN ? 'Commissions Open' : 'Commissions Closed';

// ── Promotions (configurable via env PROMOTIONS as JSON array) ─────────────────
// Each promotion: { id, name, type: 'flat'|'percent', amount, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', badgeText }
function safeParsePromotions(raw) {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map(p => ({
      id: p.id || (p.name || '').toLowerCase().replace(/\s+/g, '-'),
      name: p.name || '',
      type: p.type === 'percent' ? 'percent' : 'flat',
      amount: Number(p.amount) || 0,
      start: p.start || null,
      end: p.end || null,
      badgeText: p.badgeText || null
    }));
  } catch (e) {
    return [];
  }
}

const PROMOTIONS = safeParsePromotions(process.env.PROMOTIONS);
function isPromotionActive(p, now) {
  if (!p) return false;
  const start = p.start ? new Date(p.start) : null;
  const end = p.end ? new Date(p.end) : null;
  if (start && isNaN(start.getTime())) return false;
  if (end && isNaN(end.getTime())) return false;
  if (start && now < start) return false;
  if (end && now > end) return false;
  return true;
}

const ACTIVE_PROMOTIONS = PROMOTIONS.filter(p => isPromotionActive(p, _now));
const PROMOTIONS_AVAILABLE = ACTIVE_PROMOTIONS.length > 0;
const PROMOTION_STATUS_CLASS = PROMOTIONS_AVAILABLE ? 'active' : 'none';
const PROMOTION_STATUS_LABEL = PROMOTIONS_AVAILABLE
  ? (ACTIVE_PROMOTIONS.map(p => (p.badgeText || (p.type === 'percent' ? `${p.amount}% off` : `$${p.amount} off`))).join(', '))
  : 'No Promotions';

// ── Configurable settings ─────────────────────────────────────────────────────
// global site settings
const FOOTER_YEAR             = _now.getFullYear();
const SITE_TITLE              = process.env.SITE_TITLE                       || "Coffee's Crafts";
const CONTACT_EMAIL           = process.env.CONTACT_EMAIL                    || 'coffee@coffeescrafts.com';
const FOOTER_TEXT             = `© ${FOOTER_YEAR} ${SITE_TITLE} — ${CONTACT_EMAIL}`;
// index page
const HERO_TAGLINE            = process.env.HERO_TAGLINE                     || "Original art & custom commissions — made with love ☕";
const HERO_CTA                = process.env.HERO_CTA                         || 'Browse the Gallery';
const ABOUT_HEADING           = process.env.ABOUT_HEADING                    || 'About';
const ABOUT_BODY              = process.env.ABOUT_BODY                       || "Welcome! I'm an independent artist specializing in character art, fursuits, and custom commissions. Every piece is crafted with care and skill, with your input always in mind.";
const ABOUT_CTA_INTRO         = process.env.ABOUT_CTA_INTRO                  || 'Looking for something unique?';
const ABOUT_CTA_LINK_TEXT     = process.env.ABOUT_CTA_LINK_TEXT              || 'Check commission availability';
const FEATURED_HEADING        = process.env.FEATURED_HEADING                 || 'Featured Work';
const GALLERY_MORE_TEXT       = process.env.GALLERY_MORE_TEXT                || 'See all →';
// gallery page
const GALLERY_HEADING         = process.env.GALLERY_HEADING                  || 'Gallery';
const GALLERY_META            = process.env.GALLERY_META                     || 'A selection of original pieces and commission samples.';
const SAMPLE_COUNT            = parseInt(process.env.SAMPLE_COUNT            || '4', 10);
// contact page
const COMMISSIONS_HEADING     = process.env.COMMISSIONS_HEADING              || 'Commissions';
const COMMISSIONS_INTRO       = process.env.COMMISSIONS_INTRO                || "Interested in a custom piece? I offer a range of commission types. Send me a message with your idea and I'll get back to you as soon as possible.";
const TIER1_TITLE             = process.env.TIER1_TITLE                      || 'Bust';
const TIER1_DESC              = process.env.TIER1_DESC                       || 'Shoulder-up portrait of your character with paws included.';
const TIER2_TITLE             = process.env.TIER2_TITLE                      || 'Half Body';
const TIER2_DESC              = process.env.TIER2_DESC                       || 'Waist-up of your character.';
const TIER3_TITLE             = process.env.TIER3_TITLE                      || 'Full Body';
const TIER3_DESC              = process.env.TIER3_DESC                       || 'Full body of your character.';
const TIER4_TITLE             = process.env.TIER4_TITLE                      || 'Custom / Ask';
const TIER4_DESC              = process.env.TIER4_DESC                       || 'Something else in mind? Reach out and we can work out a quote together.';
const CONTACT_HEADING         = process.env.CONTACT_HEADING                  || 'Contact';
const VGEN_URL                = (process.env.VGEN_URL || '').trim()          || 'https://vgen.co/CoffeeEX';
const VGEN_LINK_TEXT          = process.env.VGEN_LINK_TEXT                   || '🎨 VGen Portfolio';
const EMAIL_LINK_TEXT         = process.env.EMAIL_LINK_TEXT                  || '✉️ Email Me';
const DISCORD_URL             = (process.env.DISCORD_URL || '').trim()       || 'https://www.discord.com/users/339092532162068481';
const DISCORD_LINK_TEXT       = process.env.DISCORD_LINK_TEXT                || '💬 Discord: coffee.ex';
const TELEGRAM_URL            = (process.env.TELEGRAM_URL || '').trim()      || 'https://t.me/coffeescrafts';
const TELEGRAM_LINK_TEXT      = process.env.TELEGRAM_LINK_TEXT               || "📨 Telegram: Coffee's Crafts";
const CASHAPP_HANDLE          = process.env.CASHAPP_HANDLE                   || '$ashcoffeeEX';
const CASHAPP_URL             = process.env.CASHAPP_URL                      || 'https://cash.app/$ashcoffeeEX';
const PAYPAL_URL              = process.env.PAYPAL_URL                       || 'https://paypal.me/coffeescrafts';
const PAYPAL_LINK_TEXT        = process.env.PAYPAL_LINK_TEXT                 || 'PayPal';
const TRELLO_URL              = (process.env.TRELLO_URL || '').trim()        || 'https://trello.com/b/uces30Ct/anthrocon-art-queue';
const TRELLO_LINK_TEXT        = process.env.TRELLO_LINK_TEXT                 || '📋 Art Queue Trello';
const QUEUE_TRACKING_TEXT     = process.env.QUEUE_TRACKING_TEXT              || 'Track art commission progress here:';
const TWITCH_URL              = (process.env.TWITCH_URL || '').trim()        || 'https://twitch.tv/coffeescrafts';
const TWITCH_LINK_TEXT        = process.env.TWITCH_LINK_TEXT                 || '📺 Twitch';
// Terms/TOC URLs
const ART_TOS_LINK_TEXT       = process.env.ART_TOS_LINK_TEXT                || '📄 Terms of Service';
const FURSUIT_TOS_LINK_TEXT   = process.env.FURSUIT_TOS_LINK_TEXT            || '📄 Fursuit TOS';
const FURSUIT_QUEUE_URL       = (process.env.FURSUIT_QUEUE_URL || '').trim() || 'https://trello.com/b/1NyoDiwp/fursuit-wips';
const FURSUIT_QUEUE_LINK_TEXT = process.env.FURSUIT_QUEUE_LINK_TEXT          || '📋 Fursuit Queue Trello';
const FURSUIT_QUEUE_TEXT      = process.env.FURSUIT_QUEUE_TEXT               || 'Track fursuit commission progress here:';
const TOYHOUSE_URL            = (process.env.TOYHOUSE_URL || '').trim()      || 'https://toyhou.se/CoffeeEX';
const TOYHOUSE_LINK_TEXT      = process.env.TOYHOUSE_LINK_TEXT               || '🏠 Toyhou.se';
const INSTAGRAM_URL           = (process.env.INSTAGRAM_URL || '').trim()     || 'https://www.instagram.com/coffeedemonn';
const INSTAGRAM_LINK_TEXT     = process.env.INSTAGRAM_LINK_TEXT              || '📸 Instagram';
const CARRD_URL               = (process.env.CARRD_URL || '').trim()         || 'https://coffeescraftsgallery.carrd.co';
const CARRD_LINK_TEXT         = process.env.CARRD_LINK_TEXT                  || '🌐 Carrd';
const X_URL                   = (process.env.X_URL || '').trim()             || 'https://x.com/coffeesden';
const X_LINK_TEXT             = process.env.X_LINK_TEXT                      || '🐦 X / Twitter';
// commission pages
const ART_SECTIONS = process.env.ART_SECTIONS ? JSON.parse(process.env.ART_SECTIONS) : [
  {
    title: 'Full Body: $20',
    paragraphs: ['Full body of your character.'],
    details: ['Delivered as a PNG'],
    addons: [
      'Commercial usage rights - 35%',
      'Shading - $20',
      'Extra Character - $15'
    ],
    important: [
      'Please be as detailed as possible when describing what you want, such as pose, expression, etc.',
      'Please provide an unshaded reference.'
    ]
  },
  {
    title: 'Bust: $15+',
    paragraphs: ['Shoulder up portrait of your character (paws included).'],
    details: ['Delivered as a PNG'],
    addons: [
      'Commercial usage rights - 35%',
      'Shading - $15'
    ],
    important: [
      'Please be as detailed as possible when describing what you want, such as pose, expression, etc.',
      'Please provide an unshaded reference.'
    ]
  },
  {
    title: 'Headshot: $10',
    paragraphs: ['Headshot of your character.'],
    details: ['Delivered as a PNG'],
    addons: [
      'Commercial usage rights - 35%',
      'Shading - $10',
      'Simple color background - Free',
      'Simple splash background - Free'
    ],
    important: [
      'Please be as detailed as possible when describing what you want, such as pose, expression, etc.',
      'Please provide an unshaded reference.'
    ]
  },
  {
    title: 'Furry PNGTuber: $35+',
    paragraphs: ['Four frames of your character and a step-by-step setup guide for PNGTuber use.'],
    details: ['File is a .veado file to be used on Veadotube.'],
    addons: [
      'Commercial usage rights - 35%',
      'Shading - $15',
      'Extra frames - $8.50 per frame'
    ],
    important: ['Please provide an unshaded reference.']
  },
  {
    title: 'Scenic Furry Commissions: $50+',
    paragraphs: ['Scenic drawing of your character. Scenery depends on complexity type.'],
    details: ['Delivered as a PNG.'],
    addons: 
    ['Commercial usage rights - 35%',
      'Extra characters - $15',
      'Background complexity - Ask for quote'
    ],
    important: [
      'Please provide detailed scene description and reference photos when possible.',
      'Please provide an unshaded reference.'
    ]
  },
  {
    title: 'Furry Reference Sheet: $45+',
    paragraphs: ['Symmetrical front & back of your character.'],
    details: ['Delivered as a PNG.'],
    addons: [
      'Commercial usage rights - 35%',
      'Custom Character - $40',
      'Accessories (Up to 3)- $10',
      'Add side view - $10', 
      'Add headshot closeup - $10',
      'Add eyes closeup - $5',
      'Asymmetrical front & back - $10',
      'Symmetrical front & back - Free',
      'Name, gender, species (text) - Free',
      'Likes/Dislikes (text) - Free',
      'Character description (text) - Free'
    ],
    important: [
      'If requesting a custom character without an existing reference, include the custom character add-on fee.',
      'Please provide an unshaded reference.'
    ]
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
// terms of service pages
const TOS_TITLE = process.env.TOS_TITLE || "CoffeeEX's Artwork Terms of Service";
const TOS_UPDATED = process.env.TOS_UPDATED || 'Updated July 17, 2026';
const TOS_SECTIONS = process.env.TOS_SECTIONS ? JSON.parse(process.env.TOS_SECTIONS) : [
  {
    heading: 'GENERAL',
    paragraphs: [
      "I reserve the right to decline any commission for any reason. Prohibited content includes ABDL and feral NSFW. Additional subjects may be declined at my discretion.",
      "These Terms of Service constitute the entire agreement between the artist and the buyer regarding commissioned work unless otherwise agreed in writing."
    ]
  },
  {
    heading: 'GOVERNING LAW',
    paragraphs: [
      "These Terms of Service shall be governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania, United States, without regard to its conflict of law principles."
    ]
  },
  {
    heading: 'FORCE MAJEURE',
    paragraphs: [
      "The artist shall not be considered in breach of these Terms of Service due to delays or inability to perform caused by events beyond their reasonable control, including but not limited to illness, injury, family emergencies, natural disasters, severe weather, internet outages, equipment failure, software issues, power outages, government action, labor disputes, or other force majeure events."
    ]
  },
  {
    heading: 'QUOTES & PRICING',
    paragraphs: [
      `Quotes are estimates based on the information provided and are subject to change after a full evaluation. Base pricing and package options are published on the <a href="${ART_LINK}" target="_blank" rel="noopener">art pricing page</a>. A formal, written quote will be issued prior to requesting payment; the quoted amount at booking is the final binding price.`
    ]
  },
  {
    heading: 'REVISIONS',
    paragraphs: [
      "Minor revisions are included during the sketch phase.",
      "Major revisions, new concepts, or changes in project scope requested after sketch approval may incur additional fees and will extend the estimated completion date.",
      "Revision requests beyond the originally agreed scope will be billed separately.",
      "Sketch approvals or revision requests should be provided within 14 calendar days. Failure to respond may result in the commission being placed on hold until communication resumes."
    ]
  },
  {
    heading: 'PAYMENTS',
    paragraphs: [
      `Payments are processed through <a href="${VGEN_URL}" target="_blank" rel="noopener">VGen</a> unless another payment method is agreed upon in writing.`,
      "A deposit or full payment may be required to reserve a commission slot.",
      "Payment secures a place in the commission queue but does not guarantee that work will begin immediately. Work will not begin until all required payments have cleared and all requested references, descriptions, and other commission details have been received.",
      "The buyer is responsible for any payment processor fees, currency conversion fees, taxes, or other charges imposed by the payment provider."
    ]
  },
  {
    heading: 'REFUNDS',
    paragraphs: [
      "If the buyer cancels before work has begun, the artist may issue a full refund at their discretion.",
      "If the artist cancels the commission before substantial work has begun, the buyer will receive an appropriate refund.",
      "Once work has begun, any refund will be reduced to fairly reflect the work completed and any non-recoverable expenses incurred.",
      "Once a sketch has been delivered, refunds are generally unavailable except at the artist's discretion.",
      "Initiating a chargeback or payment dispute without first attempting to resolve the matter directly with the artist constitutes a violation of these Terms of Service. Fraudulent or unwarranted chargebacks may be contested, and future commissions may be refused."
    ]
  },
  {
    heading: 'DEADLINES AND DELIVERY',
    paragraphs: [
      "Quoted delivery timelines are estimates only and are not guaranteed unless explicitly stated in writing.",
      "Estimated completion dates are automatically extended by client-requested revisions, changes in project scope, missing references, delayed responses, payment delays, technical issues, illness, emergencies, conventions, vacations, or other circumstances beyond the artist's reasonable control.",
      "The artist will make reasonable efforts to notify the buyer of any significant delays.",
      "Final artwork will be delivered via the agreed communication method. Files will typically be provided in PNG format unless otherwise agreed."
    ]
  },
  {
    heading: 'ACCEPTANCE OF DELIVERY',
    paragraphs: [
      "The buyer is responsible for reviewing delivered artwork promptly.",
      "Unless otherwise agreed, delivered artwork is considered accepted 14 calendar days after delivery if no issues are reported. Requests made after acceptance may be treated as new revisions and billed accordingly."
    ]
  },
  {
    heading: 'COMMISSION QUEUE',
    paragraphs: [
      "Commissions are completed according to the artist's production schedule and queue.",
      "The artist reserves the right to determine the order in which commissions are completed, including prioritizing rush orders, convention deadlines, or other business needs."
    ]
  },
  {
    heading: 'USE',
    paragraphs: [
      "Unless explicitly transferred in writing, all copyrights and intellectual property rights remain the sole property of the artist. Purchasing a commission does not transfer copyright ownership.",
      "Artwork is licensed for personal use only unless commercial rights are explicitly granted in writing or included in the quoted commission price. Commercial use, redistribution, resale, minting as NFTs, tokenization, or use in monetized projects is prohibited without the artist's prior written permission.",
      "Artwork may not be used to train, fine-tune, evaluate, or otherwise develop artificial intelligence or machine learning systems, nor may it be included in datasets used for such purposes without the artist's prior written permission.",
      "Credit to the artist is appreciated whenever practical."
    ]
  },
  {
    heading: 'PORTFOLIO RIGHTS',
    paragraphs: [
      "Unless otherwise agreed in writing before work begins, the artist reserves the right to display commissioned artwork in portfolios, galleries, livestreams, social media, websites, convention displays, and other promotional materials.",
      "Private or confidential commissions must be requested and agreed upon before work begins and may incur an additional fee."
    ]
  },
  {
    heading: 'FILE RETENTION',
    paragraphs: [
      "The artist is not obligated to retain project files indefinitely. Buyers should download and back up delivered files promptly. Unless otherwise agreed, project files may be permanently deleted after 90 calendar days following final delivery."
    ]
  },
  {
    heading: 'COMMUNICATION',
    paragraphs: [
      "The buyer is responsible for providing accurate contact information and monitoring the agreed communication method. Failure to receive notifications due to muted servers, spam filters, blocked messages, or outdated contact information does not constitute artist negligence.",
      "The artist will generally respond to commission-related messages within three business days, although response times may be longer due to illness, conventions, travel, emergencies, holidays, or periods of high workload.",
      "If the buyer fails to respond to requests for required information, approvals, or revisions within 14 calendar days, the commission may be placed on hold.",
      "If no communication is received for 60 calendar days, the commission may be considered inactive. Inactive commissions may be moved to the back of the queue when communication resumes.",
      "If no communication is received for 180 calendar days, the commission may be considered abandoned. In such cases, the artist may cancel the commission and retain payment proportional to work completed.",
    ]
  },
  {
    heading: 'CONDUCT',
    paragraphs: [
      "Abusive, threatening, discriminatory, harassing, or otherwise inappropriate behavior toward the artist may result in immediate cancellation of the commission. Any refund issued will be determined in accordance with the Refunds section of these Terms."
    ]
  },
  {
    heading: 'CONTACT & MISC',
    paragraphs: [
      `For quotes, inquiries, and urgent matters: <a href="${DISCORD_URL}" target="_blank" rel="noopener">Discord</a>, <a href="${TELEGRAM_URL}" target="_blank" rel="noopener">Telegram</a>, <a href="${PAYPAL_URL}" target="_blank" rel="noopener">Paypal</a>, or <a href="mailto:${CONTACT_EMAIL}">email</a>.`,
      'Thank you for supporting my small business.'
    ]
  }
];
const FURSUIT_TOS_TITLE = process.env.FURSUIT_TOS_TITLE || "CoffeeEX's Fursuit Terms of Service";
const FURSUIT_TOS_UPDATED = process.env.FURSUIT_TOS_UPDATED || 'Updated July 17, 2026';
const FURSUIT_TOS_SECTIONS = process.env.FURSUIT_TOS_SECTIONS ? JSON.parse(process.env.FURSUIT_TOS_SECTIONS) : [
  {
    heading: 'GENERAL',
    paragraphs: [
      "I reserve the right to decline any commission for any reason. Prohibited content includes ABDL and feral NSFW. Additional subjects may be declined at my discretion.",
      "These Terms of Service constitute the entire agreement between the artist and the buyer regarding commissioned work unless otherwise agreed in writing."
    ]
  },
  {
    heading: 'GOVERNING LAW',
    paragraphs: [
      "These Terms of Service shall be governed by and construed in accordance with the laws of the Commonwealth of Pennsylvania, United States, without regard to its conflict of law principles."
    ]
  },
  {
    heading: 'FORCE MAJEURE',
    paragraphs: [
      "The maker shall not be considered in breach of these Terms due to delays or inability to perform caused by events beyond their reasonable control, including but not limited to illness, injury, family emergencies, natural disasters, severe weather, internet outages, equipment failure, software issues, power outages, government action, labor disputes, or other force majeure events."
    ]
  },
  {
    heading: 'QUOTES & PRICING',
    paragraphs: [
      `Quotes are estimates based on the information provided and are subject to change after a full evaluation. Base pricing and package options are published on the <a href="${FURSUIT_LINK}" target="_blank" rel="noopener">fursuit pricing page</a>. A formal, written quote will be issued prior to requesting payment; the quoted amount at booking is the final binding price.`
    ]
  },
  {
    heading: 'REVISIONS',
    paragraphs: [
      "Revisions are limited to minor adjustments during agreed stages.",
      "Major changes introduced after production begins may incur additional fees and will affect delivery timelines.",
      "Any revisions outside the original scope will be quoted separately."
    ]
  },
  {
    heading: 'PAYMENTS',
    paragraphs: [
      `Payments for fursuit commissions are accepted via <a href="${CASHAPP_URL}" target="_blank" rel="noopener">CashApp</a> or <a href="${PAYPAL_URL}" target="_blank" rel="noopener">PayPal</a>.`,
      "A non-refundable deposit or full payment may be required to secure a commission slot.",
      "The buyer is responsible for any payment-processor fees and for ensuring payments clear.",
      "Work will not begin until the required payment or deposit is received."
    ]
  },
  {
    heading: 'PAYMENT PLANS',
    paragraphs: [
      "Payment plans may be offered by agreement.",
      "Buyers must meet scheduled payments; failure to do so may result in suspension, cancellation of the commission, and forfeiture of payments made."
    ]
  },
  {
    heading: 'REFUNDS',
    paragraphs: [
      "Full refunds are available only if no work (including sketches or material purchases) has been produced.",
      "Once production or repairs have commenced, refunds are not available except at the maker's discretion; any partial refund will reflect work completed and non-recoverable expenses.",
      "Refunds for work already completed are at the maker's discretion.",
      "Chargebacks may be contested and could result in refusal of future service."
    ]
  },
  {
    heading: 'ACCEPTANCE OF DELIVERY',
    paragraphs: [
      "The buyer is responsible for reviewing delivered items promptly.",
      "Unless otherwise agreed, delivered fursuit items or documentation are considered accepted 14 calendar days after delivery if no issues are reported. Requests made after acceptance may be treated as new revisions or repairs and billed accordingly."
    ]
  },
  {
    heading: 'REPAIRS & SHIPPING',
    paragraphs: [
      "The buyer must inspect items on receipt and report significant damage within 14 days with photo or video evidence.",
      "The maker will repair defects due to workmanship at no labor cost; return shipping for repairs may be the buyer's responsibility unless otherwise agreed."
    ]
  },
  {
    heading: 'DELIVERY & TIMELINES',
    paragraphs: [
      "Estimated production timelines are provided with quotes and are not guaranteed.",
      "Delays can occur for reasons beyond the maker's control; the maker will notify the buyer of significant delays.",
      "The maker will provide progress updates on request."
    ]
  },
  {
    heading: 'FILE RETENTION',
    paragraphs: [
      "The maker is not obligated to retain project source files or pattern files indefinitely. Buyers should download and back up any provided files, photos, or documentation promptly.",
      "Unless otherwise agreed in writing, project files, reference photos, and editable source materials may be permanently deleted 90 calendar days after final delivery."
    ]
  },  
  {
    heading: 'COMMUNICATION',
    paragraphs: [
      "The buyer must maintain timely communication. If the buyer fails to provide required information or misses agreed payments within a reasonable period, the maker may pause or cancel the commission; refunds in that case are at the maker's discretion."
    ]
  },
  {
    heading: 'CONDUCT',
    paragraphs: [
      "Abusive, threatening, discriminatory, harassing, or otherwise inappropriate behavior toward the maker may result in immediate cancellation of the commission. Any refund issued will be determined in accordance with the Refunds section of these Terms."
    ]
  },
  {
    heading: 'CONTACT & MISC',
    paragraphs: [
      `For quotes, inquiries, and urgent matters: <a href="${DISCORD_URL}" target="_blank" rel="noopener">Discord</a>, <a href="${TELEGRAM_URL}" target="_blank" rel="noopener">Telegram</a>, <a href="${PAYPAL_URL}" target="_blank" rel="noopener">Paypal</a>, or <a href="mailto:${CONTACT_EMAIL}">email</a>.`,
      'Thank you for supporting my small business.'
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
  const fursuitDest = path.join(OUT, FURSUIT_SRC);
  copyDir(FURSUIT_SRC, fursuitDest);

  let allImages = [];
  let fursuitImages = [];
  console.log('Build settings:', { ART_SRC, SAMPLE_COUNT, OUT });

  if (fs.existsSync(ART_SRC)) {
    allImages = fs.readdirSync(ART_SRC)
      .filter(f => /\.(png|jpe?g|svg|gif|webp)$/i.test(f))
      .map(f => path.posix.join(ART_SRC.replace(/\\/g, '/'), f));
  }

  if (fs.existsSync(FURSUIT_SRC)) {
    fursuitImages = fs.readdirSync(FURSUIT_SRC)
      .filter(f => /\.(png|jpe?g|svg|gif|webp)$/i.test(f))
      .map(f => path.posix.join(FURSUIT_SRC.replace(/\\/g, '/'), f));
  }

  const sampleList = allImages.slice(0, SAMPLE_COUNT);
  const sampleHtml = sampleList.map(i => `<li><img src="${i}" alt="art"/></li>`).join('\n');
  const fursuitSampleList = fursuitImages.slice(0, SAMPLE_COUNT);
  const fursuitSampleHtml = fursuitSampleList.map(i => `<li><img src="${i}" alt="fursuit"/></li>`).join('\n');
  const galleryHtml = allImages.map(i => `<li><img src="${i}" alt="art"/></li>`).join('\n');
  const fursuitGalleryHtml = fursuitImages.map(i => `<li><img src="${i}" alt="fursuit"/></li>`).join('\n');

  const vars = {
    SITE_TITLE,
    CONTACT_EMAIL,
    FOOTER_TEXT,
    SAMPLE_IMAGES: sampleHtml,
    GALLERY_IMAGES: galleryHtml,
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
    CASHAPP_HANDLE,
    CASHAPP_URL,
    PAYPAL_URL,
    PAYPAL_LINK_TEXT,
    TRELLO_URL,
    TRELLO_LINK_TEXT,
    QUEUE_TRACKING_TEXT,
    TWITCH_URL,
    TWITCH_LINK_TEXT,
    FURSUIT_TOS_LINK,
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
    ART_TOS_LINK,
    ART_SECTIONS,
    FURSUIT_PRICES,
    TOS_TITLE,
    TOS_UPDATED,
    TOS_SECTIONS,
    FURSUIT_TOS_TITLE,
    FURSUIT_TOS_UPDATED,
    FURSUIT_TOS_SECTIONS,
    ART_TOS_LINK_TEXT,
    ART_GALLERY_IMAGES: galleryHtml,
    FURSUIT_GALLERY_IMAGES: fursuitGalleryHtml,
    FURSUIT_SAMPLE_IMAGES: fursuitSampleHtml,
    PROMOTIONS,
    ACTIVE_PROMOTIONS,
    PROMOTIONS_AVAILABLE,
    PROMOTION_STATUS_CLASS,
    PROMOTION_STATUS_LABEL,
  };

  [
      INDEX_LINK,
      GALLERY_LINK,
      CONTACT_LINK,
      ART_LINK,
      FURSUIT_LINK,
      ART_TOS_LINK,
      FURSUIT_TOS_LINK,
  ].forEach(page => {
      fs.writeFileSync(
          path.join(OUT, page),
          renderTemplate(page, vars)
      );
  });

  try {
    const diag = {
      ART_SRC,
      SAMPLE_COUNT,
      VGEN_URL,
      imagesCount: allImages.length,
      images: allImages.slice(0, SAMPLE_COUNT),
      builtAt: _now.toISOString(),
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
