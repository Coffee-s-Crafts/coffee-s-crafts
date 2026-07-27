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
  - When adding new template files, ensure `site/build.js` writes them (it currently renders `index.html`, `gallery.html`, `contact.html`, `art.html`, `fursuit.html`, `tos.html`, `fursuit-tos.html`).

**Adding Images to the Gallery**
- **Where to put images:** place images in the relevant [`assets/`](https://github.com/Coffee-s-Crafts/coffee-s-crafts/tree/main/assets) subfolder. The build copies files from those folders into the output site.
- **Supported formats:** `png`, `jpg`, `jpeg`, `svg`, `gif`, `webp`.
- **Automatic listing:** the build script reads files in the source directories and generates `<li><img src="..."></li>` entries for samples and for the full gallery. No template edits required.
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
- If pages don’t reflect new text, check the corresponding env var name in `site/build.js` and restart the build.
- To change default copy, either edit the env variables where the site is built (CI/workflow) or change the fallback strings in `site/build.js`.
- The build writes a `build-info.json` into the output folder with diagnostics (image count, sample list, build timestamp).

# GitHub Actions examples
Below are example workflow snippets that set environment variables and run the build during deploy. Store private values (emails, payment handles, tokens) as repository **secrets** and reference them in the workflow.

1) Full [build + deploy to `gh-pages`](https://github.com/Coffee-s-Crafts/coffee-s-crafts/blob/main/.github/workflows/deploy-pages.yml) (push to `main`). Uses `peaceiris/actions-gh-pages` to publish the `dist` folder to the `gh-pages` branch.
