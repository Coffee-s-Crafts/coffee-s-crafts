**Overview**
- **Purpose:** concise guide for configuring `site/build.js`, authoring templates, and adding gallery images.

**Configure build.js via Environment Variables**
- **Where:** `site/build.js` reads environment variables to control output paths, site copy, and structured content.
- **How it works:** variables are read via `process.env.*` with sensible defaults. Set env vars to override defaults before running `node site/build.js`.
- **Common variables:**
  - **OUTPUT_DIR:** output folder for the generated site (default: `dist`).
  - **ART_SOURCE_DIR:** folder containing gallery art (default: `assets/art`).
  - **FURSUIT_SOURCE_DIR:** folder containing fursuit images (default: `assets/fursuits`).
  - **SAMPLE_COUNT:** number of sample images shown on the index/featured sections (default: `4`).
  - **SITE_TITLE, CONTACT_EMAIL, HERO_TAGLINE, HERO_CTA:** short site copy values used across templates.
  - **GALLERY_LINK, INDEX_LINK, ART_LINK, FURSUIT_LINK, CONTACT_LINK:** control generated page filenames/links.
  - **COMMISSION_STATUS:** set to `open` or `closed` to change commission labels.
  - **ART_SECTIONS, FURSUIT_PRICES, TOS_SECTIONS, FURSUIT_TOS_SECTIONS:** JSON-encoded strings to supply structured content for those pages.

**Creating and Editing Site Templates**
- **Location:** templates live under `site/templates/` and partials in `site/templates/partials/`.
- **Template syntax:** the build uses a tiny custom renderer that supports:
  - `{{> partialName}}` to include a partial from `partials/partialName.html`.
  - `{{KEY}}` to substitute variables passed from `build.js`.
  - `{{#each ARRAY}}...{{/each}}` blocks to iterate arrays such as `ART_SECTIONS` or image lists. Within an each block, use `{{this.prop}}` or `{{this}}` for the current item.
  - `%%TOKEN%%` tokens — these are replaced with values from `build.js` variables (useful for configuration tokens in templates).
- **Best practices:**
  - Keep structural HTML in templates and place text/content in env vars or JSON variables so the deployed site is configurable without editing templates.
  - Use partials for header/footer/meta to avoid duplication.
  - When adding new pages, add a fixed template/output mapping to `PAGES` in `site/build.js`. It currently renders eight pages, including `premades.html`.

**Adding Images to the Gallery**
- **Where to put images:** place images in the relevant [`assets/`](https://github.com/Coffee-s-Crafts/coffee-s-crafts/tree/main/assets) subfolder. The build copies files from those folders into the output site.
- **Supported formats:** `png`, `jpg`, `jpeg`, `svg`, `gif`, `webp`.
- **Automatic listing:** the build provides structured image data to templates, which render linked images with captions and alt text. Use `IMAGE_METADATA` to override descriptions without editing templates.
- **Controlling featured samples:** change `SAMPLE_COUNT` to adjust how many images appear in the index/featured areas.
- **Filename tips:** avoid spaces and use short, descriptive names (e.g., `char-name_pose.png`). If ordering matters, you can prefix filenames with numbers (`01-`, `02-`), the script uses directory order.

**Advanced: JSON-configured content**
- **ART_SECTIONS and FURSUIT_PRICES:** both can be supplied as JSON strings via environment variables. Example (bash):

```bash
export ART_SECTIONS='[{"title":"Bust","paragraphs":["Shoulder-up portrait"],"details":["PNG"]}]'
export FURSUIT_PRICES='[{"name":"Head only","price":"$465"}]'
node site/build.js
```

- **Windows PowerShell example:**

```powershell
$env:ART_SOURCE_DIR = 'assets/art'
$env:SAMPLE_COUNT = '6'
node site/build.js
```

**Run the build**
- Install dependencies (if any) and run the build script from the repository root:

```bash
node site/build.js
```

**Troubleshooting & Notes**

See [the build and configuration guide](site/README.md) for verification commands,
configurable page filenames, image descriptions, promotion dates, SEO, and commission
brief settings. CI uses Node 24 and `npm ci`, validates built HTML/local links, and
runs responsive keyboard/accessibility checks before publishing from `main`.
- If pages don’t reflect new text, check the corresponding env var name in `site/build.js` and restart the build.
- To change default copy, either edit the env variables where the site is built (CI/workflow) or change the fallback strings in `site/build.js`.
- The build writes a `build-info.json` into the output folder with diagnostics (image count, sample list, build timestamp).

# GitHub Actions examples
Below are example workflow snippets that set environment variables and run the build during deploy. Store private values (emails, payment handles, tokens) as repository **secrets** and reference them in the workflow.

1) Full [build + deploy to `gh-pages`](https://github.com/Coffee-s-Crafts/coffee-s-crafts/blob/main/.github/workflows/deploy-pages.yml) (push to `main`). Uses `peaceiris/actions-gh-pages` to publish the `dist` folder to the `gh-pages` branch.

## Browsable render previews

The separate **Render previews** workflow builds default site content locally with
real source artwork, then captures all eight pages, the gallery lightbox, and the
commission brief preview at desktop (1280px) and mobile (390px) widths. It checks
navigation, image decoding, layout overflow, and the interactive states. External
network requests are blocked, and no email, payment, or commission form is sent.
This does not deploy, replace the existing accessibility suite, or approve pixel
baselines. It does not validate production secrets, configured copy,
external services, or browsers other than Chromium.

Run locally with Node 24:

```sh
npm ci
npx playwright install chromium
git lfs pull
node scripts/render-safety.cjs record
npm run build:render
OUTPUT_DIR=render-dist npm run check:output
npm run check:render
node scripts/render-safety.cjs verify
npx playwright show-report render-report
```

The build uses real Git LFS source artwork and writes only `render-dist`; it never
changes source artwork. Locally, run `git lfs pull` before building. The report embeds screenshots as
attachments. CI uses one public standard runner, no dependency cache, one worker,
no retries, and a ten-minute timeout. The owning organization confirmed a $0
stop-usage budget for storage and LFS. Uploads can be disabled through
`RENDER_UPLOAD_ENABLED` in the workflow. A report must be no larger than 15 MiB and
is retained for one day. A size failure blocks upload but does not hide test
failures. Without successful upload, CI logs remain available but screenshots and
the HTML report are not retained. The existing deployment workflow is unchanged.

Source artwork and all static files are inventoried by SHA-256 before the build
and compared after render tests. Generated outputs use dedicated render directories;
source/deploy paths and symlink escapes are rejected. Only the generated report
artifact expires. No source artwork, deployed assets, history, or older artifacts
are deleted or rewritten.
