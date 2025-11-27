# Developer Guide

This guide covers repository setup, testing, and release procedures. When modifying implementation, follow t-wada style TDD (RED-GREEN-REFACTOR) and do not manually edit `dist/`.

## Development Environment Setup

1. Clone the repository and initialize submodules.
   ```bash
   git clone https://github.com/nuitsjp/swa-github-role-sync-ops.git
   cd swa-github-role-sync-ops
   git submodule update --init --recursive
   ```
2. Prepare Node.js 20.18.0 or later (specified in `.node-version` file). If necessary, disable pnpm/yarn with `corepack enable` and use npm.
3. If you have VS Code extensions (ESLint, Prettier, etc.), enable auto-formatting to keep diffs stable.

### About Submodules

This repository contains the following two submodules:

| Submodule | Path | Repository URL |
|-----------|------|----------------|
| swa-github-role-sync | `actions/role-sync` | https://github.com/nuitsjp/swa-github-role-sync |
| swa-github-discussion-cleanup | `actions/discussion-cleanup` | https://github.com/nuitsjp/swa-github-discussion-cleanup |

## Repository Structure

```
swa-github-role-sync-ops/
├── .github/
│   └── workflows/               # CI, release, and operational workflows
│       ├── npm-ci.yml               # CI for both Actions (format, lint, test, dist verification)
│       ├── deploy-site.yml          # Sample site deployment
│       ├── role-sync-released.yml   # Role sync with released Action version
│       ├── role-sync-local.yml      # Role sync with local build version (for development)
│       ├── delete-discussions.yml   # Delete invitation Discussions
│       ├── release-role-sync.yml    # Role Sync Action release
│       ├── release-discussion-cleanup.yml  # Cleanup Action release
│       └── security-scans.yml       # Security scans (CodeQL, license checks)
├── actions/
│   ├── role-sync/               # swa-github-role-sync (submodule)
│   │   ├── src/                     # TypeScript source
│   │   ├── __tests__/               # Jest tests
│   │   ├── dist/                    # Build artifacts (tracked)
│   │   └── action.yml               # Action definition
│   └── discussion-cleanup/      # swa-github-discussion-cleanup (submodule)
│       ├── src/                     # TypeScript source
│       ├── dist/                    # Build artifacts (tracked)
│       └── action.yml               # Action definition
├── docs/
│   ├── developer-guide.ja.md    # Developer guide (Japanese)
│   └── developer-guide.md       # Developer guide (English)
├── site/                        # Sample SWA site
│   ├── index.html
│   └── staticwebapp.config.json
└── package.json                 # npm workspaces configuration
```

## Local Verification

```bash
# Install dependencies
npm ci --workspaces

# Verify all Actions (format + lint + test + dist check)
npm run verify

# Verify Role Sync Action only
npm run verify:role-sync

# Build Discussion Cleanup only
npm run verify:discussion-cleanup
```

## Role Sync Action Development

```bash
cd actions/role-sync
npm ci
npm run verify   # format + lint + test + dist check
npm run package  # Update dist (required before release)
```

### Local Execution

Copy `.env.example` to create `.env` and set the required environment variables for local execution:

```bash
cp .env.example .env
# Edit .env file to set INPUT_* variables
npm run local-action
```

- Write tests before making changes, cycling through RED-GREEN-REFACTOR one iteration at a time.
- Regenerate `dist/` with `npm run package`; do not edit manually.
- When adding templates or input values, keep `action.yml` and the README (in this repository) in sync.

## Discussion Cleanup Action Development

```bash
cd actions/discussion-cleanup
npm ci
npm run package  # rollup build + dist update
```

- Tests are not yet set up, so implement with small pure functions in mind to prepare for future test additions.
- When inputs change, update `action.yml` and documentation in this repository.

## Test-Driven Development

This repository adopts t-wada style TDD (RED-GREEN-REFACTOR):

1. Write a failing test (RED)
2. Write the minimum code to pass the test (GREEN)
3. Refactor the code (REFACTOR)

```bash
cd actions/role-sync
npm test         # Run tests
npm run coverage # Measure coverage (updates badges/coverage.svg)
```

## Sample Site Verification

SWA deployment and `/.auth/me` verification is done via the `Deploy Site` workflow. Changes to `site/` pushed to the main branch trigger automatic deployment. Manual execution is also available.

## Workflow List

| Workflow | Description | Trigger |
|----------|-------------|---------|
| `npm-ci.yml` | CI for both Actions (format/lint/test/dist verification, dependency audit) | PR, push (actions/ path), manual |
| `deploy-site.yml` | Deploy sample site to SWA | push (`site/` path), manual |
| `role-sync-released.yml` | Run role sync with released Action version | Every Monday 3:00 UTC, manual |
| `role-sync-local.yml` | Role sync with local build version (for development) | Every Monday 3:00 UTC, manual |
| `delete-discussions.yml` | Delete invitation Discussions (immediate deletion mode) | manual |
| `release-role-sync.yml` | Create tag and release for Role Sync Action | manual |
| `release-discussion-cleanup.yml` | Create tag and release for Cleanup Action | manual |
| `security-scans.yml` | CodeQL analysis and license checks | PR, push (src/ path), Every Wednesday 7:31 UTC, manual |

## Required Secrets

| Secret Name | Purpose | Target Workflows |
|-------------|---------|------------------|
| `AZURE_CLIENT_ID` | Azure OIDC authentication | role-sync-released, role-sync-local |
| `AZURE_TENANT_ID` | Azure OIDC authentication | role-sync-released, role-sync-local |
| `AZURE_SUBSCRIPTION_ID` | Azure OIDC authentication | role-sync-released, role-sync-local |
| `AZURE_STATIC_WEB_APPS_API_TOKEN` | SWA deployment token | deploy-site |
| `ACTIONS_RELEASE_TOKEN` | Release permission to submodules (contents:write) | release-* |
| `ROLE_SYNC_APP_ID` | GitHub App ID | role-sync-released, role-sync-local |
| `ROLE_SYNC_APP_PRIVATE_KEY` | GitHub App private key | role-sync-released, role-sync-local |
| `ROLE_SYNC_REPO_TOKEN` | Push permission to submodules (for license updates) | security-scans |

## Contributing

1. Fork and create a branch
2. Add tests and code using TDD
3. Ensure `npm run verify` passes
4. Regenerate `dist/` (`npm run package`) and commit
5. Create a Pull Request

## Release Procedure

Both Actions are submodules, so tagging and GitHub Release creation are done via workflows in this repository.

1. **Implementation and Build**
   - Role Sync: Verify RED/GREEN with `npm run verify`, commit the result of `npm run package`.
   - Discussion Cleanup: Commit the result of `npm run package`.
2. **Run workflow to create tag**
   - Manually run `Release Role Sync` or `Release Discussion Cleanup`. If `version` is not specified, SemVer is auto-incremented.
   - Rolling tags (e.g., `v1`) are automatically reassigned (except for pre-releases).
3. **Verify results**
   - Check tags and release URLs in the Actions job summary.
   - For first publication only, verify that "Publish this action to the GitHub Marketplace" is checked in the GitHub Release UI.
4. **Update README**
   - Update version references (`@v1` / full tag) in usage examples and document major version operation policy as appropriate.

### Pre-Release Checklist

- [ ] `dist/` is up to date and committed.
- [ ] `ACTIONS_RELEASE_TOKEN` has `contents:write` permission for both submodules.
- [ ] Run `Release Role Sync` / `Release Discussion Cleanup` and verify links in the summary.
- [ ] Verify Marketplace publication checkbox (first time only) in the UI.
- [ ] README and docs are updated for the new version.

## Documentation Management

- Documentation is centralized in this repository and not placed in submodules. When making content changes, update `README.md` and `docs/`, and copy to submodules if necessary.
- When adding new inputs or behaviors, update user guides and design documents to maintain consistency.
