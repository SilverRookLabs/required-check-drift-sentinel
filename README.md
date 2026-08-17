# Required Check Drift Sentinel

Detect GitHub required-check drift before pull requests hang on missing status contexts.

The Action compares required status/check contexts against names the repository appears to emit from workflow files, recent check runs, and commit statuses. It is intentionally Action-first: it works inside the repository with ordinary workflow permissions where possible, and reports partial coverage instead of pretending legacy branch-protection data is always visible.

## Basic Use

```yaml
name: Required check drift

on:
  pull_request:
  workflow_dispatch:

permissions:
  contents: read
  checks: read
  statuses: read

jobs:
  drift:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: SilverRookLabs/required-check-drift-sentinel@v1
```

## What v1 Checks

- Parses `.github/workflows/*.yml` and `.github/workflows/*.yaml`.
- Infers likely GitHub Actions check names from workflow names and job IDs/names.
- Reads repository rulesets when available through the current token.
- Optionally inspects recent check runs and commit statuses.
- Emits a Markdown report and fails when required contexts appear missing.

## Permission Boundary

Default mode is constrained to ordinary workflow permissions. Legacy branch protection required-status-check coverage may require an elevated read token or a future GitHub App with Administration read access. v1 treats that as a documented limitation, not a reason to require hosted infrastructure.

Recommended permissions:

```yaml
permissions:
  contents: read
  checks: read
  statuses: read
```

## Inputs

| Input | Default | Description |
| --- | --- | --- |
| `token` | `${{ github.token }}` | Token used to read GitHub repository data. |
| `fail-on-drift` | `true` | Fail when missing required checks are detected. |
| `include-observed-checks` | `true` | Include recent check runs and commit statuses in inferred emitters. |
| `lookback-commits` | `20` | Number of recent commits to inspect for observed check runs/statuses. |
| `ruleset-refs` | current ref | Optional newline-delimited refs to inspect with repository rulesets. |

## Outputs

- `required-count`
- `emitted-count`
- `missing-count`
- `coverage-status`
- `report-path`

## Non-Goals

- Hosted service.
- GitHub App installation.
- Organization-wide dashboard.
- Full legacy branch-protection auditing without elevated access.
- Historical drift database.
