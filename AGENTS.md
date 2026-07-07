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

## Implementation Guidance for Agents

- When editing deployment workflows, prefer changes that keep `gh-pages` as the publish target.
- If a proposed change conflicts with these rules, stop and ask for confirmation before proceeding.
- Call out any detected mismatch between workflow behavior and these repository deployment settings.
