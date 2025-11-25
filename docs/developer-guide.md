# Developer Guide

This guide covers repository setup, testing, and release procedures. When modifying implementation, follow t-wada style TDD (RED-GREEN-REFACTOR) and do not manually edit `dist/`.

## Development Environment Setup

1. Clone the repository and initialize submodules.
   ```powershell
   git clone https://github.com/nuitsjp/swa-github-role-sync-ops.git
   cd swa-github-role-sync-ops
   git submodule update --init --recursive
   ```
2. Prepare Node.js 20 or later (common to both Actions). If necessary, disable pnpm/yarn with `corepack enable` and use npm.
3. If you have VS Code extensions (ESLint, Prettier, etc.), enable auto-formatting to keep diffs stable.

## Repository Structure

```
swa-github-role-sync-ops/
├── .github/
│   └── workflows/           # CI, release, and operational workflows
│       ├── npm-ci.yml           # CI for both Actions (format, lint, test, dist verification)
│       ├── deploy-site.yml      # Sample site deployment
│       ├── role-sync-released.yml   # Role sync with released Action version
│       ├── release-role-sync.yml    # Role Sync Action release
│       └── release-discussion-cleanup.yml  # Cleanup Action release
├── actions/
│   ├── role-sync/           # swa-github-role-sync (submodule)
│   └── discussion-cleanup/  # swa-github-discussion-cleanup (submodule)
├── docs/
│   ├── design.md            # Design notes
│   ├── user-guide.md        # User guide
│   └── developer-guide.md   # Developer guide
├── site/                    # Sample SWA site
│   ├── index.html
│   └── staticwebapp.config.json
└── package.json             # npm workspaces configuration
```

## Local Verification

```powershell
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

```
cd actions/role-sync
npm ci
npm run verify   # format + lint + test + dist check
npm run package  # Update dist (required before release)
```

- Write tests before making changes, cycling through RED-GREEN-REFACTOR one iteration at a time.
- Regenerate `dist/` with `npm run package`; do not edit manually.
- When adding templates or input values, keep `action.yml` and the README (in this repository) in sync.

## Discussion Cleanup Action Development

```
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

```powershell
cd actions/role-sync
npm test         # Run tests
npm run coverage # Measure coverage
```

## Sample Site Verification

SWA deployment and /.auth/me verification is done via the `Role Sync - Deploy Site` workflow. Run manually from the GitHub UI and verify role reflection in the browser.

## Workflow List

| Workflow | Description | Trigger |
|----------|-------------|---------|
| `npm-ci.yml` | CI for both Actions (format/lint/test/dist verification) | PR, push, manual |
| `deploy-site.yml` | Deploy sample site to SWA | push (`site/`), manual |
| `role-sync-released.yml` | Run role sync with released Action version | Every Monday 3:00 UTC, manual |
| `role-sync-local.yml` | Role sync with local build version (for development) | manual |
| `delete-discussions.yml` | Delete invitation Discussions | manual |
| `release-role-sync.yml` | Create tag and release for Role Sync Action | manual |
| `release-discussion-cleanup.yml` | Create tag and release for Cleanup Action | manual |
| `security-scans.yml` | Security scans | scheduled |

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
