# Local build and checks

Use Node 24 or newer. CI uses Node 24 LTS and the committed lockfile.

```powershell
npm ci
git lfs pull
npm run check:syntax
npm test
npm run build
npm run check:output
npx playwright install chromium
npm run check:browser
npm run serve
```

`serve` rebuilds and previews `dist/` at http://127.0.0.1:4173. It does not publish.
Output checks validate HTML, local links/anchors, unresolved tokens, CNAME, and LFS
pointers. Browser checks cover all eight pages at 390px and 1280px, image decoding,
navigation, WCAG A/AA axe checks, keyboard lightbox controls, and email brief creation.
Screenshots are in `test-results/`; traces are retained on failure. Tests replace
third-party fonts and embeds with empty local responses. External availability and
a complete accessibility audit are outside these checks.

Pull requests run validation. Only pushes to `main` publish to `gh-pages`, preserving
the `coffeescrafts.com` CNAME. Keep branch-based Pages deployment and enforced HTTPS.
Preserve existing source SVG Git LFS attributes; published images must be real files.

# Configuration

All settings in `site/build.js`, including `UI_DEFAULTS`, are mapped in the deployment
workflow. Set repository Variables or Secrets; Variables take precedence. Empty values
use defaults. `OUTPUT_DIR` stays fixed to `dist` in CI and can be changed locally.

Page `*_LINK` settings change output filenames independently of templates. They must
be distinct root-level `.html` filenames using letters, digits, underscores, or hyphens:

```powershell
$env:GALLERY_LINK = 'portfolio.html'
$env:NAV_GALLERY = 'Portfolio'
npm run build
```

Keep `INDEX_LINK=index.html` for the normal Pages root entry point. The build does not
delete old output files; use a fresh output directory after renaming pages/removing art.
CI starts with a fresh checkout.

`NAV_*`, `*_HEADING`, `*_CATEGORY`, `*_LINK_TEXT`, and existing copy settings control
labels. `FOOTER_TEXT` supports `{year}` and `{title}`. Structured arrays such as
`ART_SECTIONS`, `FURSUIT_PRICES`, `PREMADE_SECTIONS`, `TOS_SECTIONS`, and
`FURSUIT_TOS_SECTIONS` are JSON. Content is escaped as plain text. Terms sections can
include `links: [{"url":"https://example.com","text":"Link label"}]` rather than HTML
in paragraphs. Structural HTML lives in templates.

The Ko-fi iframe lives in `templates/partials/kofi.html`; use `KOFI_EMBED_URL` and
`KOFI_EMBED_TITLE`. `KOFI_IFRAME` remains a legacy trusted HTML override, also subject
to the HTML checker. Prefer the structured settings.

## Promotions

Set `PROMOTIONS` to a JSON array:

```json
[{"name":"October offer","type":"percent","amount":10,"start":"2026-10-01","end":"2026-10-10"}]
```

Date-only values use UTC calendar dates: the example remains active through October
10 at 23:59:59.999 UTC, expiring at midnight October 11. Timestamps with a timezone
are exact instants. Invalid calendar dates are inactive. Missing `badgeText` uses
`PROMOTION_PERCENT_LABEL` or `PROMOTION_FLAT_LABEL` with `{amount}` substituted. The
contact page and footer share the resolved badge. Rebuild when promotions start/end;
the published site is static.

## Image descriptions and lightbox

Existing images have descriptive defaults. Override individual fields with
`IMAGE_METADATA`, keyed by the original source path before URL encoding:

```json
{"assets/art/reki.png":{"alt":"A pink character walking among sunset trees and fireflies.","caption":"Reki at sunset"}}
```

Overrides merge with existing metadata. New images use category/filename fallbacks;
provide explicit descriptions when names are insufficient. Spaces and parentheses
are URL encoded automatically. Gallery links open original images without JavaScript.
With JavaScript, Enter opens a native dialog; arrow keys and Previous/Next cycle
images. Escape or Close dismisses it and returns focus. Background controls are inert.

## SEO and sharing

`SITE_URL` is the absolute site base URL (default `https://coffeescrafts.com`). Canonical
URLs and sitemap entries use configured filenames. The build adds `robots.txt`, page
descriptions, Open Graph tags, and a coffee-cup SVG favicon. Description settings are
`SITE_DESCRIPTION`, `ART_DESCRIPTION`, `FURSUIT_DESCRIPTION`, `CONTACT_DESCRIPTION`,
`TOS_DESCRIPTION`, and `FURSUIT_TOS_DESCRIPTION`; gallery/premades reuse `GALLERY_META`
and `PREMADE_META`. `OG_IMAGE_URL` accepts an absolute or site-relative raster image
and defaults to the existing Anthrocon badge photo. Adjust it when changing artwork
directories. `FAVICON_URL` defaults to `favicon.svg`.

## Commission brief

`ART_COMMISSION_STATUS` and `FURSUIT_COMMISSION_STATUS` accept `open` or `closed`,
defaulting to `COMMISSION_STATUS`. `PREMADE_AVAILABILITY` controls the inventory label.
Each service has configurable `*_NEXT_STEPS`. `BRIEF_*` controls all instructions,
field labels, and email subject. Visitors prepare and review a brief locally, then
open a mailto draft addressed to `CONTACT_EMAIL`, or copy it into another contact
channel. The site does not submit, send, or store inquiries. Availability and booking
are confirmed by the artist. `FURSUIT_FORM_URL` remains the hosted inquiry-form link.
