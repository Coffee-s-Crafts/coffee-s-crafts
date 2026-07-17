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
- **Where to put images:** place images in `assets/art/` for the main gallery or `assets/fursuits/` for fursuit images. The build copies those folders into the output site.
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

1) Full build + deploy to `gh-pages` (push to `main`). Uses `peaceiris/actions-gh-pages` to publish the `dist` folder to the `gh-pages` branch.

```yaml
name: Build and Deploy Pages
on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: write
      pages: write
      id-token: write
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        # Coffee's Crafts

        [![Build and Deploy Pages](https://github.com/valzargaming/coffee-s-crafts/actions/workflows/deploy-pages.yml/badge.svg?branch=main)](https://github.com/valzargaming/coffee-s-crafts/actions)

        A static site generator and deployment pipeline for Coffee's Crafts — a small gallery and commission site. This README shows how to build locally, configure content via environment variables, author templates, add images, and run CI deploys.

        Table of Contents
        - Quickstart
        - Configuration (env vars)
        - Templates & rendering
        - Adding images
        - Build & deploy (GitHub Actions)
        - Advanced: JSON content & secrets
        - Troubleshooting

        ## Quickstart

        Prerequisites
        - Node.js (18+ recommended)
        - A shell (bash, PowerShell, or CI runner)

        Clone and build locally

        ```bash
        git clone https://github.com/Coffee-s-Crafts/coffee-s-crafts.git
        cd coffee-s-crafts
        npm ci
        node site/build.js
        ```

        Open `dist/index.html` (or the directory specified by `OUTPUT_DIR`) in a browser to preview.

        ## Configuration (environment variables)

        `site/build.js` reads many values from `process.env`. Most have sensible defaults; set env vars to customize the build without editing code. Important variables:

        - `OUTPUT_DIR` (default: `dist`) — output folder for generated pages.
        - `ART_SOURCE_DIR` (default: `assets/art`) — folder containing gallery art.
        - `FURSUIT_SOURCE_DIR` (default: `assets/fursuits`) — folder for fursuit images.
        - `SAMPLE_COUNT` (default: `4`) — number of featured sample images.
        - `SITE_TITLE`, `CONTACT_EMAIL`, `HERO_TAGLINE`, `HERO_CTA` — short site copy values.
        - `GALLERY_LINK`, `INDEX_LINK`, `ART_LINK`, `FURSUIT_LINK`, `CONTACT_LINK` — control generated page filenames/links.
        - `COMMISSION_STATUS` — set to `open` or `closed` to change commission labels.
        - `ART_SECTIONS`, `FURSUIT_PRICES`, `TOS_SECTIONS`, `FURSUIT_TOS_SECTIONS` — JSON-encoded strings that supply structured page content.

        Set variables in your shell before running the build. Examples:

        Bash

        ```bash
        export SAMPLE_COUNT=6
        export OUTPUT_DIR=dist
        node site/build.js
        ```

        PowerShell

        ```powershell
        $env:SAMPLE_COUNT = '6'
        node site/build.js
        ```

        ## Templates & rendering

        Templates are in `site/templates/`. Partials live in `site/templates/partials/`.

        Renderer features
        - `{{> partialName}}` — include `site/templates/partials/partialName.html`.
        - `{{KEY}}` — substitute a variable from `build.js`.
        - `{{#each ARRAY}}...{{/each}}` — iterate arrays such as `ART_SECTIONS` or image lists. Inside an each block use `{{this.prop}}` or `{{this}}`.
        - `%%TOKEN%%` — tokens replaced by values in `build.js`.

        Best practices
        - Keep structure and layout in templates; put human-visible text in env vars or JSON to make the site configurable from CI.
        - Use partials for shared elements (head, header, footer).
        - When adding templates, ensure `site/build.js` writes them. Currently it renders: `index.html`, `gallery.html`, `contact.html`, `art.html`, `fursuit.html`, `tos.html`, `fursuit-tos.html`.

        ## Adding images to the gallery

        Place artwork in the source folders:
        - Main gallery: `assets/art/`
        - Fursuit images: `assets/fursuits/`

        Supported formats: `png`, `jpg`, `jpeg`, `svg`, `gif`, `webp`.

        The build copies those folders into the output directory and auto-generates `<li><img src="...">` entries for samples and the full gallery. To control featured images, change `SAMPLE_COUNT`.

        Tips
        - Avoid spaces in filenames; use short descriptive names like `char-name_pose.png`.
        - For a specific display order, prefix filenames with numbers (`01-`, `02-`). The script uses the directory order returned by `fs.readdirSync()`.

        ## Build & deploy (GitHub Actions examples)

        Below are example workflow snippets. Store private values in repository **Secrets** and reference them in workflows.

        1) Build + deploy to `gh-pages` (publish `dist`):

        ```yaml
        name: Build and Deploy Pages
        on:
          push:
            branches: [ main ]

        jobs:
          build-and-deploy:
            runs-on: ubuntu-latest
            permissions:
              contents: write
              pages: write
              id-token: write
            steps:
              - uses: actions/checkout@v4
              - name: Use Node.js
                uses: actions/setup-node@v4
                with:
                  node-version: '18'
              - name: Install dependencies
                run: npm ci
              - name: Build site
                env:
                  OUTPUT_DIR: 'dist'
                  ART_SOURCE_DIR: 'assets/art'
                  SAMPLE_COUNT: '6'
                  SITE_TITLE: "Coffee's Crafts"
                  CONTACT_EMAIL: ${{ secrets.CONTACT_EMAIL }}
                  PAYPAL_URL: ${{ secrets.PAYPAL_URL }}
                  ART_SECTIONS: '[{"title":"Bust","paragraphs":["Shoulder-up portrait"],"details":["PNG"]}]'
                run: node site/build.js
              - name: Deploy to gh-pages
                uses: peaceiris/actions-gh-pages@v4
                with:
                  publish_dir: ./dist
                  publish_branch: gh-pages
                  github_token: ${{ secrets.GITHUB_TOKEN }}
        ```

        2) Minimal build-only job (CI checks / preview):

        ```yaml
        name: Build Site
        on: [push, pull_request]

        jobs:
          build:
            runs-on: ubuntu-latest
            steps:
              - uses: actions/checkout@v4
              - uses: actions/setup-node@v4
                with:
                  node-version: '18'
              - name: Build
                env:
                  SAMPLE_COUNT: '4'
                run: |
                  npm ci
                  node site/build.js
        ```

        Notes
        - Put sensitive values into repository **Secrets** and reference them as `${{ secrets.NAME }}`.
        - Store large JSON payloads in secrets and inject as env vars to avoid long YAML lines.
        - The repo's Pages settings must target `gh-pages` (branch-based deployment).

        ## Advanced: JSON content & secrets

        Large or structured page content can be provided as JSON via env vars. Example:

        ```bash
        export ART_SECTIONS='[{"title":"Bust","paragraphs":["Shoulder-up portrait"],"details":["PNG"]}]'
        node site/build.js
        ```

        For CI, store such JSON in a secret and reference it: `ART_SECTIONS: ${{ secrets.ART_SECTIONS }}`.

        ## Troubleshooting

        - If builds don't show updated copy, ensure the env var name matches the key in `site/build.js` and re-run the build.
        - Check `dist/build-info.json` for diagnostics including `imagesCount`, `images`, and `builtAt`.
        - If images don’t appear, confirm they are in `assets/art` or `assets/fursuits` and are a supported format.

        ## Where to look next
        - Templates: `site/templates/` and partials in `site/templates/partials/`.
        - Build script: `site/build.js` (contains defaults and env var keys you can override).

        ---
```