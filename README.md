# Required Check Drift Sentinel

> **Research preview** — a bounded Silver Rook Labs experiment for learning whether repository maintainers need a lightweight required-check drift detector. The Action is functional and tested, but adoption, long-term support, and broader product investment are not yet established.

Detect required GitHub checks that your repository no longer appears to emit—before a pull request or merge queue waits on a status that never arrives.

Renaming a workflow or job, changing path filters, or retiring a CI integration can leave repository rules pointing at an obsolete check name. Required Check Drift Sentinel compares required contexts against workflow files, recent check runs, and commit statuses, then writes a reviewable Markdown report.

It runs as a GitHub Action with ordinary read permissions where possible. When GitHub does not expose every source of required-check configuration to the workflow token, the report says coverage is partial rather than claiming certainty.

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

Run it manually after changing workflow names, job names, rulesets, branch protection, or CI providers. Keeping `pull_request` enabled can also catch later drift during normal development.

## Expected Report

The Action writes `required-check-drift-report.md` and adds the same result to the workflow summary. A drift result looks like this:

```markdown
# Required Check Drift Report

Coverage: `partial`
Required contexts: 3
Inferred emitted contexts: 2
Missing required contexts: 1

## Warnings

- Legacy branch-protection required checks may require elevated Administration read access or a future GitHub App; this Action reports ruleset/workflow/observed-check coverage only by default.

## Missing Required Contexts

- `CI / Integration` from repository ruleset

## Matched Required Contexts

- `CI / Test` from repository ruleset
- `Lint` from repository ruleset
```

`partial` describes what the token could inspect; it is not itself a failure. By default the Action fails only when it finds an apparently missing required context.

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

## Privacy and Telemetry

The Action runs inside your GitHub Actions environment and does not send repository data to a Silver Rook Labs service. GitHub's own Actions logs and usage policies still apply.

## Support and Review Window

This preview is provided as-is under the repository license, without a response-time or maintenance commitment. Report reproducible defects through the repository issue tracker. Silver Rook Labs will review the experiment's disposition by September 17, 2026 and will continue, revise, freeze, or archive it based on observed usefulness and operating burden.
