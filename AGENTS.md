# AGENTS.md

## Repository Ruleset: GitHub Pages Deployment (Mandatory)

These rules are always in effect for this repository unless the user explicitly requests a policy change.

1. **Pages source mode must remain "Deploy from a branch".**
2. **Deployment branch must remain `gh-pages`.**
3. **Custom domain must remain `coffeescrafts.com`.**
4. **HTTPS must remain enforced for Pages.**
5. Any workflow or build-system change that affects publishing must continue to support branch-based deployment to `gh-pages` (do not silently migrate to artifact-only Pages deployment).
6. Published output must preserve custom-domain behavior (include/update `CNAME` with `coffeescrafts.com` when applicable).
7. Do not remove or weaken these guardrails without explicit user approval in the current task.

## Repository Ruleset: Git LFS Image Policy (Mandatory)

1. On `main`, source art files under `assets/art/*.svg` must be tracked with Git LFS.
2. `.gitattributes` on `main` must include:
   - `assets/art/*.svg filter=lfs diff=lfs merge=lfs -text`
3. On `gh-pages`, published image assets should remain regular files (non-LFS pointers) so GitHub Pages serves them directly.
4. Do not introduce LFS pointer files into published site output on `gh-pages`.

## Repository Ruleset: Configurable Content Policy (Mandatory)

Everything the artist (or their developer) may want to customise — page copy, section headings, commission tier names and descriptions, taglines, link labels, email addresses, and URLs — **must** be expressed as an environment variable with a sensible default in `site/build.js`.

Rules:
1. Do not hardcode user-facing text strings (headings, paragraphs, button labels, link text) directly in HTML templates.
2. Every such string must be a `%%TOKEN%%` in the template and resolved from a `process.env.*` variable with a fallback default in `site/build.js`.
3. Any new configurable value must also be documented as a secret or variable in `.github/workflows/deploy-pages.yml` so the artist can override it via GitHub repository secrets/variables without touching code.
4. Structural HTML (tags, class names, layout) lives in templates; all human-readable content lives in env vars.

Additional guidance:
- Do NOT place raw HTML fragments in `site/build.js` constants or defaults. Constants should contain data only (strings, numbers, arrays, objects) that represent content, not layout. Templates must contain the HTML structure and iterate/render the provided data.
- Preferred pattern: expose structured values in `site/build.js` (for example an `ART_SECTIONS` array of objects with `title`, `paragraphs`, `details`, `addons`, `important`), and render them in templates using tokens or simple iteration. After changes, run `node site/build.js` to verify pages are generated correctly.

## Implementation Guidance for Agents

- When editing deployment workflows, prefer changes that keep `gh-pages` as the publish target.
- When changing image assets, preserve the branch-specific Git LFS policy above.
- For requests about deployed `gh-pages` content that depends on environment variables (for example VGEN/contact links), check the `gh-pages` branch output and the env-var sources first (`.github/workflows/deploy-pages.yml`, build metadata such as `build-info.json`, and current defaults in `site/build.js` on `main`) before editing generated files.
- When adding any new user-facing text to a template, always add a corresponding env var + default in `site/build.js` and a reference in the workflow — never hardcode it.
- If a proposed change conflicts with these rules, stop and ask for confirmation before proceeding.
- Call out any detected mismatch between workflow behavior and these repository deployment settings.
