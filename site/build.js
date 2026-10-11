const fs = require('fs');
const path = require('path');
const _now = new Date();
const { isPromotionActive, safeParsePromotions } = require('./promotions');

// All interface copy is environment-backed; defaults contain data, never layout.
const UI_DEFAULTS = {
  NAV_LABEL: 'Main navigation', NAV_HOME: 'Home', NAV_GALLERY: 'Gallery',
  NAV_ART: 'Art', NAV_FURSUIT: 'Fursuits', NAV_PREMADE: 'Premades', NAV_CONTACT: 'Contact',
  ART_HEADING: 'Art Commissions', FURSUIT_HEADING: 'Fursuit Pricing',
  FURSUIT_COMMISSION_HEADING: 'Fursuit Commissions', PREMADE_HEADING: 'Premade Items',
  ART_CATEGORY: 'Art', FURSUIT_CATEGORY: 'Fursuits', PREMADE_CATEGORY: 'Premade Items',
  TABLE_CATEGORY: 'Convention Table Setups', SUPPORT_HEADING: 'Support Me on Ko-fi',
  DETAILS_HEADING: 'Details', ADDONS_HEADING: 'Add-ons', IMPORTANT_HEADING: 'Important',
  OPTIONS_HEADING: 'Available Options', LIGHTBOX_LABEL: 'Image preview',
  LIGHTBOX_CLOSE: 'Close image preview', LIGHTBOX_PREVIOUS: 'Previous image',
  LIGHTBOX_NEXT: 'Next image', IMAGE_ALT_FORMAT: '{category}: {name}',
  COMMISSION_OPEN_LABEL: 'Commissions Open', COMMISSION_CLOSED_LABEL: 'Commissions Closed',
  PROMOTION_PERCENT_LABEL: '{amount}% off', PROMOTION_FLAT_LABEL: '${amount} off',
  PROMOTION_NONE_LABEL: 'No Promotions',
  BRIEF_HEADING: 'Plan your commission',
  BRIEF_INTRO: 'Choose a service and prepare a brief to share by email. Sending a brief does not reserve a slot; availability and a quote are confirmed before booking.',
  BRIEF_SERVICE_LABEL: 'Service', BRIEF_IDEA_LABEL: 'Your idea and reference links',
  BRIEF_BUDGET_LABEL: 'Budget', BRIEF_DEADLINE_LABEL: 'Preferred deadline',
  BRIEF_PREPARE_LABEL: 'Prepare email', BRIEF_SEND_LABEL: 'Open email draft',
  BRIEF_PREVIEW_LABEL: 'Your brief', BRIEF_SUBJECT: 'Commission inquiry',
  BRIEF_NEXT_STEPS: 'Review the draft below, then open it in your email app. You can also copy it and use one of the contact links. Nothing is sent from this page.',
  ART_NEXT_STEPS: 'Share your idea and an unshaded reference for an availability check and quote.',
  FURSUIT_NEXT_STEPS: 'Complete the fursuit commission form for an availability check and written quote.',
  PREMADE_AVAILABILITY: 'Check shop inventory', PREMADE_NEXT_STEPS: 'Visit the shop for current stock and shipping details.',
  KOFI_EMBED_TITLE: 'Support Coffee’s Crafts on Ko-fi',
};
const UI = Object.fromEntries(Object.entries(UI_DEFAULTS).map(([key, fallback]) => [key, process.env[key] || fallback]));

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
const PREMADE_SRC             = process.env.PREMADE_SOURCE_DIR || 'assets/premades';
const PREMADE_LINK            = process.env.PREMADE_LINK       || 'premades.html';
const TABLE_SRC               = process.env.TABLE_SOURCE_DIR   || 'assets/tables';

// ── Commission status ─────────────────────────────────
const COMMISSION_OPEN         = (process.env.COMMISSION_STATUS || 'open').toLowerCase() === 'open';
const COMMISSION_STATUS_CLASS = COMMISSION_OPEN ? 'open' : 'closed';
const COMMISSION_STATUS_LABEL = COMMISSION_OPEN ? UI.COMMISSION_OPEN_LABEL : UI.COMMISSION_CLOSED_LABEL;

// ── Promotions (configurable via env PROMOTIONS as JSON array) ─────────────────
// Each promotion: { id, name, type: 'flat'|'percent', amount, start: 'YYYY-MM-DD', end: 'YYYY-MM-DD', badgeText }
const PROMOTIONS = safeParsePromotions(process.env.PROMOTIONS, { percent: UI.PROMOTION_PERCENT_LABEL, flat: UI.PROMOTION_FLAT_LABEL });

const ACTIVE_PROMOTIONS = PROMOTIONS.filter(p => isPromotionActive(p, _now));
const PROMOTIONS_AVAILABLE = ACTIVE_PROMOTIONS.length > 0;
const PROMOTION_STATUS_CLASS = PROMOTIONS_AVAILABLE ? 'active' : 'none';
const PROMOTION_STATUS_LABEL = PROMOTIONS_AVAILABLE
  ? ACTIVE_PROMOTIONS.map(p => p.badgeText).join(', ')
  : UI.PROMOTION_NONE_LABEL;

// ── Configurable settings ─────────────────────────────────────────────────────
// global site settings
const GITHUB_URL              = process.env.GITHUB_URL                       || 'https://github.com/Coffee-s-Crafts/coffee-s-crafts';
const GITHUB_LINK_TEXT        = process.env.GITHUB_LINK_TEXT                 || '💻 GitHub';
const FOOTER_YEAR             = _now.getFullYear();
const SITE_TITLE              = process.env.SITE_TITLE                       || "Coffee's Crafts";
const CONTACT_EMAIL           = process.env.CONTACT_EMAIL                    || 'coffee@coffeescrafts.com';
const FOOTER_TEXT             = (process.env.FOOTER_TEXT || '© {year} {title}').replace('{year}', FOOTER_YEAR).replace('{title}', SITE_TITLE);
// index page
const HERO_TAGLINE            = process.env.HERO_TAGLINE                     || "Original art & custom commissions — made with love ☕";
const HERO_CTA                = process.env.HERO_CTA                         || 'Browse the Gallery';
const ABOUT_HEADING           = process.env.ABOUT_HEADING                    || 'About';
const ABOUT_BODY              = process.env.ABOUT_BODY                       || "Welcome! I'm an independent artist specializing in character art, fursuits, and custom commissions. Every piece is crafted with care and skill, with your input always in mind.";
const ABOUT_CTA_INTRO         = process.env.ABOUT_CTA_INTRO                  || 'Looking for something unique?';
const ABOUT_CTA_LINK_TEXT     = process.env.ABOUT_CTA_LINK_TEXT              || 'Check commission availability';
const GALLERY_MORE_TEXT       = process.env.GALLERY_MORE_TEXT                || 'See all →';
// gallery page
const GALLERY_HEADING         = process.env.GALLERY_HEADING                  || 'Gallery';
const GALLERY_META            = process.env.GALLERY_META                     || 'A selection of original pieces and commission samples.';
const SAMPLE_COUNT            = parseInt(process.env.SAMPLE_COUNT            || '4', 10);
// premade page
const PREMADE_INTRO           = process.env.PREMADE_INTRO                    || 'Looking for something you can purchase immediately? I offer a growing selection of premade convention accessories, collectibles, and other handmade items that are ready to ship.';
const PREMADE_META            = process.env.PREMADE_META                     || 'Buttons, badges, stickers, and other ready-to-ship creations.';
// contact page
const COMMISSIONS_HEADING     = process.env.COMMISSIONS_HEADING              || 'Commissions';
const COMMISSIONS_INTRO       = process.env.COMMISSIONS_INTRO                || "Interested in a custom piece? I offer a range of commission types. Send me a message with your idea and I'll get back to you as soon as possible.";
const CONTACT_HEADING         = process.env.CONTACT_HEADING                  || 'Contact';
const KOFI_URL                = (process.env.KOFI_URL || '').trim()          || 'https://ko-fi.com/coffeescrafts';
const KOFI_LINK_TEXT          = process.env.KOFI_LINK_TEXT                   || '☕ Ko-fi';
// Legacy trusted HTML override; prefer the structured embed URL/title settings.
const KOFI_IFRAME             = (process.env.KOFI_IFRAME || '').trim();
const KOFI_EMBED_URL          = process.env.KOFI_EMBED_URL || 'https://ko-fi.com/coffeescrafts/?hidefeed=true&widget=true&embed=true&preview=true';
const SITE_URL               = process.env.SITE_URL || 'https://coffeescrafts.com';
const SITE_DESCRIPTION       = process.env.SITE_DESCRIPTION || HERO_TAGLINE;
const ART_DESCRIPTION        = process.env.ART_DESCRIPTION || 'Character art commissions, pricing, and available add-ons.';
const FURSUIT_DESCRIPTION     = process.env.FURSUIT_DESCRIPTION || 'Custom fursuit packages and base pricing.';
const CONTACT_DESCRIPTION    = process.env.CONTACT_DESCRIPTION || COMMISSIONS_INTRO;
const TOS_DESCRIPTION        = process.env.TOS_DESCRIPTION || 'Terms for booking and receiving art commissions.';
const FURSUIT_TOS_DESCRIPTION = process.env.FURSUIT_TOS_DESCRIPTION || 'Terms for booking and receiving fursuit commissions.';
const OG_IMAGE_URL           = process.env.OG_IMAGE_URL || `${ART_SRC}/anthrocon-2026-badges.jpg`;
const FAVICON_URL            = process.env.FAVICON_URL || 'favicon.svg';
const IMAGE_METADATA_DEFAULTS = {
  'assets/art/278c7891-3861-4ac5-a751-aa7fe782e9b5.webp': { caption: 'Dreaming in the clouds', alt: 'An orange horned dragon with stitched markings sleeps among white clouds.' },
  'assets/art/3eb40aca-ecde-4d38-84c9-938915cebbde.webp': { caption: 'Sunset companions', alt: 'An orange animal rests beneath a tree beside a glowing companion at sunset.' },
  'assets/art/444e3600-b841-446d-b942-d8f66a0d4fdc.webp': { caption: 'Among the wildflowers', alt: 'A green and cream dragon with colorful speckles lies in a meadow of yellow flowers.' },
  'assets/art/451197ce-dc86-4862-9600-0fa16b1ca379.webp': { caption: 'Electric character portrait', alt: 'A teal creature with purple paws and sharp teeth poses against a lightning-filled sky.' },
  'assets/art/b27dec81-f6c2-4a12-9d04-a4147fe403cb.webp': { caption: 'Pink cloud nap', alt: 'A pink creature curls up asleep among pink clouds against a purple sky.' },
  'assets/art/anthrocon-2026-badges.jpg': { caption: 'Anthrocon 2026 character badges', alt: 'A hand holds several laminated animal character badges in front of a printer.' },
  'assets/art/boyo.png': { caption: 'Horned character headshot', alt: 'A smiling black and brown character with a red horn, pink eyes, and gold piercings.' },
  'assets/art/eeeee.png': { caption: 'Character badge headshot', alt: 'A brown canine character with red eyes, cream hair, and gold facial piercings.' },
  'assets/art/Layer_3.png': { caption: 'Dragon character illustration', alt: 'A standing pink and purple dragon character with blue spikes and a long curled tail.' },
  'assets/art/reki.png': { caption: 'Forest at sunset', alt: 'A pink and black animal character walks through a sunset forest surrounded by fireflies.' },
  'assets/fursuits/00_splankie_fursuit_mini_partial.jpg': { caption: 'Splankie mini partial', alt: 'A purple and white fursuit head with matching paws and rainbow fur accents.' },
  'assets/fursuits/01_sp00kypaw_head_furring_feetpaws.png': { caption: 'Sp00kypaw head', alt: 'A brown and white fursuit head with large ears and heart-shaped eye highlights.' },
  'assets/fursuits/02_muscleangry.png': { caption: 'Fursuit in motion', alt: 'A person wearing a dark fursuit head and matching paws raises both arms.' },
  'assets/fursuits/103eba98.jpg': { caption: 'Rainbow tail', alt: 'A long fluffy tail with white fur beside purple, blue, yellow, and orange bands.' },
  'assets/fursuits/49de6831.jpg': { caption: 'Head and paws outdoors', alt: 'A person wears a gray and white fursuit head and raises paws with bright red pads.' },
  'assets/fursuits/5170618d.jpg': { caption: 'White paws with red pads', alt: 'White furry hand paws with red paw pads and black claws rest on a desk.' },
  'assets/fursuits/73ed15db.jpg': { caption: 'Purple fursuit head', alt: 'A purple fursuit head with white spots, a turquoise muzzle, and a red nose.' },
  'assets/fursuits/7ccbd6fe.jpg': { caption: 'Fursuit head detail', alt: 'A white and brown fursuit head with blue ear accents and a pink nose.' },
  'assets/fursuits/8c58a08b.jpg': { caption: 'Skull-style fursuit head', alt: 'Side view of a skull-style fursuit head with brown and black fur and white teeth.' },
  'assets/fursuits/nub-tail-ears.jpg': { caption: 'Tail and ears set', alt: 'A black and cream furry tail and matching ears on a wire headband.' },
  'assets/premades/00_20260720_222654.jpg': { caption: 'Communication button collection', alt: 'Colorful animal-themed buttons with messages including Hug me, Ask to hug, Silent Suiter, Low battery, No touch, and Come chat.' },
  'assets/premades/01_20260720_222532.jpg': { caption: 'Consent and communication buttons', alt: 'A row of colorful buttons expressing touch preferences and communication needs.' },
  'assets/premades/02_20260720_222548.jpg': { caption: 'Low battery button', alt: 'An orange Low battery button featuring a sleeping gray animal.' },
  'assets/premades/03_20260720_222603.jpg': { caption: 'Button pin backing', alt: 'The white reverse of a round button with its metal safety-pin clasp.' },
  'assets/premades/photo_2026-07-19_21-05-02.jpg': { caption: 'Pronoun button collection', alt: 'Four colorful buttons with green characters labeled he/him, they/them, it/its, and she/her.' },
  'assets/premades/photo_2026-07-19_21-05-02 (2).jpg': { caption: 'They/them button', alt: 'A blue they/them button with white stars and a smiling green character.' },
  'assets/premades/photo_2026-07-19_21-05-02 (3).jpg': { caption: 'Pronoun button backing', alt: 'The white reverse of a blue-edged pronoun button with a metal safety-pin clasp.' },
  'assets/tables/00_Anthrocon_PA_2026.jpg': { caption: 'Anthrocon 2026 table', alt: 'A convention artist table with a Coffee’s Crafts chalkboard, portfolio, tip jar, and character badge display.' },
  'assets/tables/01_Furbowl_DE_2026.jpg': { caption: 'Furbowl 2026 table', alt: 'A blue-covered vendor table displaying a purple fursuit head, paws, and colorful button badges.' },
};
const IMAGE_METADATA = JSON.parse(process.env.IMAGE_METADATA || '{}');
if (!IMAGE_METADATA || typeof IMAGE_METADATA !== 'object' || Array.isArray(IMAGE_METADATA)) throw new Error('IMAGE_METADATA must be a JSON object keyed by image source path.');
const ART_COMMISSION_STATUS  = process.env.ART_COMMISSION_STATUS || (COMMISSION_OPEN ? 'open' : 'closed');
const FURSUIT_COMMISSION_STATUS = process.env.FURSUIT_COMMISSION_STATUS || (COMMISSION_OPEN ? 'open' : 'closed');
const VGEN_URL                = (process.env.VGEN_URL || '').trim()          || 'https://vgen.co/CoffeeEX';
const VGEN_LINK_TEXT          = process.env.VGEN_LINK_TEXT                   || '🎨 VGen';
const EMAIL_URL               = (process.env.EMAIL_URL || '').trim()         || `mailto:${CONTACT_EMAIL}`;
const EMAIL_LINK_TEXT         = process.env.EMAIL_LINK_TEXT                  || `✉️ Email: ${CONTACT_EMAIL}`;
const DISCORD_URL             = (process.env.DISCORD_URL || '').trim()       || 'https://www.discord.com/users/339092532162068481';
const DISCORD_LINK_TEXT       = process.env.DISCORD_LINK_TEXT                || '💬 Discord: coffee.ex';
const TELEGRAM_URL            = (process.env.TELEGRAM_URL || '').trim()      || 'https://t.me/coffeescrafts';
const TELEGRAM_LINK_TEXT      = process.env.TELEGRAM_LINK_TEXT               || "📨 Telegram: Coffee's Crafts";
const CASHAPP_URL             = (process.env.CASHAPP_URL || '').trim()       || 'https://cash.app/$ashcoffeeEX';
const CASHAPP_HANDLE          = process.env.CASHAPP_HANDLE                   || '$ashcoffeeEX';
const PAYPAL_URL              = (process.env.PAYPAL_URL || '').trim()        || 'https://paypal.me/coffeescrafts';
const PAYPAL_LINK_TEXT        = process.env.PAYPAL_LINK_TEXT                 || '💸 PayPal';
const TRELLO_URL              = (process.env.TRELLO_URL || '').trim()        || 'https://trello.com/b/uces30Ct/anthrocon-art-queue';
const TRELLO_LINK_TEXT        = process.env.TRELLO_LINK_TEXT                 || '📋 Art Queue Trello';
const QUEUE_TRACKING_TEXT     = process.env.QUEUE_TRACKING_TEXT              || 'Track art commission progress here:';
const TWITCH_URL              = (process.env.TWITCH_URL || '').trim()        || 'https://twitch.tv/coffeescrafts';
const TWITCH_LINK_TEXT        = process.env.TWITCH_LINK_TEXT                 || '📺 Twitch';
// Terms/TOC URLs
const ART_TOS_LINK_TEXT       = process.env.ART_TOS_LINK_TEXT                || '📄 Art Terms of Service';
const FURSUIT_TOS_LINK_TEXT   = process.env.FURSUIT_TOS_LINK_TEXT            || '📄 Fursuit Terms of Service';
const FURSUIT_QUEUE_URL       = (process.env.FURSUIT_QUEUE_URL || '').trim() || 'https://trello.com/b/1NyoDiwp/fursuit-wips';
const FURSUIT_QUEUE_LINK_TEXT = process.env.FURSUIT_QUEUE_LINK_TEXT          || '📋 Fursuit Queue Trello';
const FURSUIT_FORM_URL        = (process.env.FURSUIT_FORM_URL|| '').trim()   || 'https://docs.google.com/forms/d/e/1FAIpQLSeEx9FHGEsBr2daUPxyiUdujYJLatGylw0vb2Q9ykOv8MUBsQ/viewform?usp=publish-editor';
const FURSUIT_FORM_TEXT       = process.env.FURSUIT_FORM_TEXT                || '📝 Fursuit Commission Form';
const ETSY_URL                = (process.env.ETSY_URL || '').trim()          || 'https://coffeezcrafts.etsy.com';
const ETSY_LINK_TEXT          = process.env.ETSY_LINK_TEXT                   || '🛒 Etsy';
const TOYHOUSE_URL            = (process.env.TOYHOUSE_URL || '').trim()      || 'https://toyhou.se/CoffeeEX';
const TOYHOUSE_LINK_TEXT      = process.env.TOYHOUSE_LINK_TEXT               || '🏠 Toyhou.se';
const INSTAGRAM_URL           = (process.env.INSTAGRAM_URL || '').trim()     || 'https://www.instagram.com/coffeedemonn';
const INSTAGRAM_LINK_TEXT     = process.env.INSTAGRAM_LINK_TEXT              || '📸 Instagram';
const CARRD_URL               = (process.env.CARRD_URL || '').trim()         || 'https://coffeescrafts.carrd.co';
const CARRD_LINK_TEXT         = process.env.CARRD_LINK_TEXT                  || '🌐 Carrd';
const X_URL                   = (process.env.X_URL || '').trim()             || 'https://x.com/coffeesden';
const X_LINK_TEXT             = process.env.X_LINK_TEXT                      || '🐦 X / Twitter';
// commission pages
const ART_SECTIONS = process.env.ART_SECTIONS ? JSON.parse(process.env.ART_SECTIONS) : [
  {
    title: 'Full Body — $20',
    paragraphs: ['Full body of your character.'],
    details: ['Delivered as a PNG.'],
    addons: [
      'Commercial usage rights — 35%',
      'Shading — $20',
      'Extra Character — $15'
    ],
    important: [
      'Please be as detailed as possible when describing what you want, such as pose, expression, etc.',
      'Please provide an unshaded reference.'
    ]
  },
  {
    title: 'Bust — $15+',
    paragraphs: ['Shoulder up portrait of your character (paws included).'],
    details: ['Delivered as a PNG.'],
    addons: [
      'Commercial usage rights — 35%',
      'Shading — $15'
    ],
    important: [
      'Please be as detailed as possible when describing what you want, such as pose, expression, etc.',
      'Please provide an unshaded reference.'
    ]
  },
  {
    title: 'Headshot — $10',
    paragraphs: ['Headshot of your character.'],
    details: ['Delivered as a PNG.'],
    addons: [
      'Commercial usage rights — 35%',
      'Button — $5 + Shipping',
      'Shading — $10',
      'Simple color background — Free',
      'Simple splash background — Free'
    ],
    important: [
      'Please be as detailed as possible when describing what you want, such as pose, expression, etc.',
      'Please provide an unshaded reference.',
      'Shipping costs for buttons are not included in the price and will be calculated based on your location. Free pick-up is available at conventions where applicable.'
    ]
  },
  {
    title: 'Furry PNGTuber — $35+',
    paragraphs: ['Four frames of your character and a step-by-step setup guide for PNGTuber use.'],
    details: ['File is a .veado file to be used on Veadotube.'],
    addons: [
      'Commercial usage rights — 35%',
      'Shading — $15',
      'Extra frames — $8.50 per frame'
    ],
    important: ['Please provide an unshaded reference.']
  },
  {
    title: 'Scenic Furry Commissions — $50+',
    paragraphs: ['Scenic drawing of your character. Scenery depends on complexity type.'],
    details: ['Delivered as a PNG.'],
    addons: 
    ['Commercial usage rights — 35%',
      'Extra characters — $15',
      'Background complexity — Ask for quote'
    ],
    important: [
      'Please provide detailed scene description and reference photos when possible.',
      'Please provide an unshaded reference.'
    ]
  },
  {
    title: 'Furry Reference Sheet — $45+',
    paragraphs: ['Symmetrical front & back of your character.'],
    details: ['Delivered as a PNG.'],
    addons: [
      'Commercial usage rights — 35%',
      'Custom Character — $40',
      'Accessories (Up to 3) — $10',
      'Add side view — $10', 
      'Add headshot closeup — $10',
      'Add eyes closeup — $5',
      'Asymmetrical front & back — $10',
      'Symmetrical front & back — Free',
      'Name, gender, species (text) — Free',
      'Likes/Dislikes (text) — Free',
      'Character description (text) — Free'
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
const PREMADE_SECTIONS = process.env.PREMADE_SECTIONS ? JSON.parse(process.env.PREMADE_SECTIONS) : [
  {
    title: 'Consent Badges',
    paragraphs: [
      'Ready-to-ship convention badges designed to make communication easy and fun.',
      'Perfect for conventions, local meets, and other furry events.'
    ],
    details: [
      'Professionally printed',
      'Ready to ship',
      'Multiple designs available'
    ],
    options: [
      'Button badges — $2.75',
      'Laminated badges — $6'
    ],
    important: [
      'Inventory is limited.',
      'Some designs may not be restocked once sold out.'
    ]
  }
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
      'For quotes, inquiries, and urgent matters, use the contact links below.',
      'Thank you for supporting my small business.'
    ],
    links: [{ url: DISCORD_URL, text: DISCORD_LINK_TEXT }, { url: TELEGRAM_URL, text: TELEGRAM_LINK_TEXT }, { url: PAYPAL_URL, text: PAYPAL_LINK_TEXT }, { url: EMAIL_URL, text: EMAIL_LINK_TEXT }]
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
      'Quotes are estimates based on the information provided and are subject to change after a full evaluation. Base pricing and package options are published on the fursuit pricing page. A formal, written quote will be issued prior to requesting payment; the quoted amount at booking is the final binding price.'
    ],
    links: [{ url: FURSUIT_LINK, text: UI.FURSUIT_HEADING }]
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
      'Payments for fursuit commissions are accepted via CashApp or PayPal.',
      "A non-refundable deposit or full payment may be required to secure a commission slot.",
      "The buyer is responsible for any payment-processor fees and for ensuring payments clear.",
      "Work will not begin until the required payment or deposit is received."
    ],
    links: [{ url: CASHAPP_URL, text: CASHAPP_HANDLE }, { url: PAYPAL_URL, text: PAYPAL_LINK_TEXT }]
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
      'For quotes, inquiries, and urgent matters, use the contact links below.',
      'Thank you for supporting my small business.'
    ],
    links: [{ url: DISCORD_URL, text: DISCORD_LINK_TEXT }, { url: TELEGRAM_URL, text: TELEGRAM_LINK_TEXT }, { url: PAYPAL_URL, text: PAYPAL_LINK_TEXT }, { url: EMAIL_URL, text: EMAIL_LINK_TEXT }]
  }
];

// ── Build functions ───────────────────────────────────────────────────────

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
}

const PAGES = [
  ['index.html', INDEX_LINK, SITE_TITLE, SITE_DESCRIPTION],
  ['gallery.html', GALLERY_LINK, GALLERY_HEADING, GALLERY_META],
  ['contact.html', CONTACT_LINK, CONTACT_HEADING, CONTACT_DESCRIPTION],
  ['art.html', ART_LINK, UI.ART_HEADING, ART_DESCRIPTION],
  ['fursuit.html', FURSUIT_LINK, UI.FURSUIT_HEADING, FURSUIT_DESCRIPTION],
  ['tos.html', ART_TOS_LINK, TOS_TITLE, TOS_DESCRIPTION],
  ['fursuit-tos.html', FURSUIT_TOS_LINK, FURSUIT_TOS_TITLE, FURSUIT_TOS_DESCRIPTION],
  ['premades.html', PREMADE_LINK, UI.PREMADE_HEADING, PREMADE_META],
];
const pageNames = PAGES.map(page => page[1]);
if (pageNames.some(name => !/^[\w-]+\.html$/.test(name)) || new Set(pageNames).size !== pageNames.length) {
  throw new Error('Page *_LINK settings must be distinct root-level .html filenames containing letters, numbers, underscores, or hyphens.');
}
const baseUrl = new URL(SITE_URL.endsWith('/') ? SITE_URL : `${SITE_URL}/`);
if (!['http:', 'https:'].includes(baseUrl.protocol) || baseUrl.search || baseUrl.hash) throw new Error('SITE_URL must be an HTTP(S) site base URL.');
const absoluteUrl = value => new URL(value, baseUrl).href;

function imageData(src, category) {
  const metadata = { ...IMAGE_METADATA_DEFAULTS[src], ...IMAGE_METADATA[src] };
  const name = path.basename(src, path.extname(src)).replace(/[_-]+/g, ' ');
  return { src: src.split('/').map(encodeURIComponent).join('/'),
    alt: metadata.alt || UI.IMAGE_ALT_FORMAT.replace('{category}', category).replace('{name}', name),
    caption: metadata.caption || name };
}

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
      if (key === 'this') return ctxThis != null ? escapeHtml(ctxThis) : '';
      if (key.indexOf('this.') === 0) {
        const prop = key.slice(5);
        return ctxThis && ctxThis[prop] != null ? escapeHtml(ctxThis[prop]) : '';
      }
      return vars[key] != null ? escapeHtml(vars[key]) : '';
    });

    // handle %%TOKENS%%
    str = str.replace(/%%(\w+)%%/g, (_, key) => {
      if (vars[key] == null) throw new Error(`Unresolved template token: ${key}`);
      return key === 'KOFI_WIDGET' ? vars[key] : escapeHtml(vars[key]);
    });
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
  const premadeDest = path.join(OUT, PREMADE_SRC);
  copyDir(PREMADE_SRC, premadeDest);
  const tableDest = path.join(OUT, TABLE_SRC);
  copyDir(TABLE_SRC, tableDest);

  let allImages = [];
  let fursuitImages = [];
  let premadeImages = [];
  let tableImages = [];
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

  if (fs.existsSync(PREMADE_SRC)) {
    premadeImages = fs.readdirSync(PREMADE_SRC)
      .filter(f => /\.(png|jpe?g|svg|gif|webp)$/i.test(f))
      .map(f => path.posix.join(PREMADE_SRC.replace(/\\/g, '/'), f));
  }

  if (fs.existsSync(TABLE_SRC)) {
    tableImages = fs.readdirSync(TABLE_SRC)
      .filter(f => /\.(png|jpe?g|svg|gif|webp)$/i.test(f))
      .map(f => path.posix.join(TABLE_SRC.replace(/\\/g, '/'), f));
  }

  const art = allImages.map(src => imageData(src, UI.ART_CATEGORY));
  const fursuits = fursuitImages.map(src => imageData(src, UI.FURSUIT_CATEGORY));
  const premades = premadeImages.map(src => imageData(src, UI.PREMADE_CATEGORY));
  const tables = tableImages.map(src => imageData(src, UI.TABLE_CATEGORY));
  const services = [
    { name: UI.ART_HEADING, availability: ART_COMMISSION_STATUS === 'open' ? UI.COMMISSION_OPEN_LABEL : UI.COMMISSION_CLOSED_LABEL, nextSteps: UI.ART_NEXT_STEPS },
    { name: UI.FURSUIT_COMMISSION_HEADING, availability: FURSUIT_COMMISSION_STATUS === 'open' ? UI.COMMISSION_OPEN_LABEL : UI.COMMISSION_CLOSED_LABEL, nextSteps: UI.FURSUIT_NEXT_STEPS },
    { name: UI.PREMADE_HEADING, availability: UI.PREMADE_AVAILABILITY, nextSteps: UI.PREMADE_NEXT_STEPS },
  ];

  const vars = {
    ...UI, SERVICES: services, PREMADE_INTRO,
    KOFI_WIDGET: KOFI_IFRAME || renderTemplate('partials/kofi.html', { ...UI, KOFI_EMBED_URL }),
    FAVICON_URL, OG_IMAGE_URL: absoluteUrl(OG_IMAGE_URL),
    ART_AVAILABILITY: services[0].availability, FURSUIT_AVAILABILITY: services[1].availability,
    ART_COMMISSION_STATUS, FURSUIT_COMMISSION_STATUS,
    GITHUB_URL,
    GITHUB_LINK_TEXT,
    SITE_TITLE,
    CONTACT_EMAIL,
    FOOTER_TEXT,
    SAMPLE_IMAGES: art.slice(0, SAMPLE_COUNT),
    GALLERY_IMAGES: art,
    INDEX_LINK,
    GALLERY_LINK,
    PREMADE_LINK,
    CONTACT_LINK,
    KOFI_URL,
    VGEN_URL,
    COMMISSION_STATUS_CLASS,
    COMMISSION_STATUS_LABEL,
    HERO_TAGLINE,
    HERO_CTA,
    ABOUT_HEADING,
    ABOUT_BODY,
    ABOUT_CTA_INTRO,
    ABOUT_CTA_LINK_TEXT,
    GALLERY_MORE_TEXT,
    GALLERY_HEADING,
    GALLERY_META,
    PREMADE_META,
    COMMISSIONS_HEADING,
    COMMISSIONS_INTRO,
    CONTACT_HEADING,
    KOFI_LINK_TEXT,
    KOFI_IFRAME,
    VGEN_LINK_TEXT,
    EMAIL_URL,
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
    FURSUIT_FORM_URL,
    FURSUIT_FORM_TEXT,
    ETSY_URL,
    ETSY_LINK_TEXT,
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
    PREMADE_SECTIONS,
    FURSUIT_PRICES,
    TOS_TITLE,
    TOS_UPDATED,
    TOS_SECTIONS,
    FURSUIT_TOS_TITLE,
    FURSUIT_TOS_UPDATED,
    FURSUIT_TOS_SECTIONS,
    ART_TOS_LINK_TEXT,
    ART_GALLERY_IMAGES: art,
    FURSUIT_GALLERY_IMAGES: fursuits,
    FURSUIT_SAMPLE_IMAGES: fursuits.slice(0, SAMPLE_COUNT),
    PREMADE_SAMPLE_IMAGES: premades.slice(0, SAMPLE_COUNT),
    PREMADE_GALLERY_IMAGES: premades,
    TABLE_SAMPLE_IMAGES: tables.slice(0, SAMPLE_COUNT),
    TABLE_GALLERY_IMAGES: tables,
    PROMOTIONS,
    ACTIVE_PROMOTIONS,
    PROMOTIONS_AVAILABLE,
    PROMOTION_STATUS_CLASS,
    PROMOTION_STATUS_LABEL,
  };

  for (const [template, filename, title, description] of PAGES) {
    fs.writeFileSync(path.join(OUT, filename), renderTemplate(template, {
      ...vars, PAGE_TITLE: title === SITE_TITLE ? title : title + ' — ' + SITE_TITLE,
      PAGE_DESCRIPTION: description, CANONICAL_URL: absoluteUrl(filename),
    }));
  }
  fs.writeFileSync(path.join(OUT, 'CNAME'), 'coffeescrafts.com\n');
  fs.writeFileSync(path.join(OUT, 'sitemap.xml'), renderTemplate('sitemap.xml', {
    PAGES: PAGES.map(page => ({ url: absoluteUrl(page[1]) })),
  }));
  fs.writeFileSync(path.join(OUT, 'robots.txt'), 'User-agent: *\nAllow: /\nSitemap: ' + absoluteUrl('sitemap.xml') + '\n');

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

module.exports = { build, UI_DEFAULTS, PAGES };

if (require.main === module) build().catch(err => {
  console.error('Build failed:', err && err.stack ? err.stack : err);
  process.exit(1);
});
