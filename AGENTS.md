# Repository Guidelines

## Primary Directive

- Think in English, interact with the user in Japanese.
- Plans and artifacts must be written in Japanese.
- Can execute GitHub CLI/Azure CLI. Will execute and verify them personally
  whenever possible.
- When modifying the implementation, strictly adhere to the t-wada style of
  Test-Driven Development (TDD). RED-GREEN-REFACTOR cycle must be followed
  without exception.

## Project Structure & Module Organization
- This repo is a harness for two Actions plus a sample SWA site. Workflows for CI/release live in `.github/workflows/`.
- `actions/role-sync/`: main TypeScript Action with source in `src/`, tests in `__tests__/`, bundled output in `dist/` (tracked).
- `actions/discussion-cleanup/`: smaller TypeScript Action; edit `src/`, build to `dist/` before publishing.
- `site/`: minimal SWA page and `staticwebapp.config.json` used by the deploy workflow.
- Always fetch submodules before working: `git submodule update --init --recursive`.

## Build, Test, and Development Commands
- Role sync Action (Node 20+): `cd actions/role-sync`, `npm ci`, then `npm run verify` (format + lint + test + dist check). Bundle for release with `npm run package` or full `npm run all`. Dry-run locally with `npm run local-action` plus `.env`.
- Discussion cleanup Action: `cd actions/discussion-cleanup`, `npm ci`, `npm run package` (rollup build).
- Site deploy validation runs through the `Role Sync - Deploy Site` workflow; trigger manually from GitHub if you need `/auth/me` checks.
- CI mirrors the above via `npm-ci.yml`; align local runs to avoid format/lint regressions.

## Coding Style & Naming Conventions
- TypeScript, ESM, strict typing. Prefer `async/await` and small, pure functions for CLI/API calls.
- Formatting is Prettier-driven (2 spaces, single quotes). Lint uses ESLint; run `npm run format:write` before committing to prevent churn.
- Filenames stay kebab-case; exported types/classes in PascalCase, variables/functions in camelCase. Keep `action.yml` in sync with defaults/types when inputs change.
- Do not hand-edit `dist/`; rebuild after logic or template changes and include the updated artifacts in the PR.
- For Japanese documentation, do not insert spaces between Japanese characters and alphanumeric words/symbols (e.g., write `SWAカスタムロール` not `SWA カスタムロール`).

## Testing Guidelines
- Jest powers `actions/role-sync` tests in `__tests__/*.test.ts`; avoid live GitHub/Azure calls—mock interfaces instead. Table-driven cases help cover role mapping and discussion templates.
- Coverage badge refresh: `npm run coverage` (writes `badges/coverage.svg`).
- `actions/discussion-cleanup` currently ships without tests; keep logic small and deterministic so it can be covered easily when added.

## Commit & Pull Request Guidelines
- Use concise, imperative titles; conventional prefixes (`feat:`, `fix:`, `chore:`) match existing history. Mention whether `dist/` was regenerated.
- Summarize behavior changes, inputs/outputs touched, and any workflow impacts. Link related issues or discussions.
- PRs should include: a short description, how you verified locally (`npm run verify`, `npm run package`), and screenshots or sample outputs when changing discussion or site templates.
- Ensure secrets (`AZURE_*`, `AZURE_STATIC_WEB_APPS_API_TOKEN`, `ACTIONS_RELEASE_TOKEN`, `ROLE_SYNC_APP_ID`, `ROLE_SYNC_APP_PRIVATE_KEY`) remain in GitHub Secrets only; never commit `.env` files.
