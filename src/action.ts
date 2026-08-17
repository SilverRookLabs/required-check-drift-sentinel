import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import * as core from '@actions/core';
import * as github from '@actions/github';
import { analyzeDrift, mergeEmitters } from './drift.js';
import { fetchObservedEmitters, fetchRulesetRequiredContexts } from './githubData.js';
import type { RequiredContext, WorkflowEmitter } from './model.js';
import { renderMarkdownReport } from './report.js';
import { loadWorkflowEmitters } from './workflows.js';

async function run(): Promise<void> {
  const token = core.getInput('token', { required: true });
  const failOnDrift = core.getBooleanInput('fail-on-drift');
  const includeObservedChecks = core.getBooleanInput('include-observed-checks');
  const lookbackCommits = Number.parseInt(core.getInput('lookback-commits') || '20', 10);
  const rulesetRefs = core.getMultilineInput('ruleset-refs');
  const workspace = process.env.GITHUB_WORKSPACE ?? process.cwd();
  const reportPath = join(workspace, 'required-check-drift-report.md');

  const { owner, repo } = github.context.repo;
  const ref = github.context.ref || github.context.sha;
  const octokit = github.getOctokit(token);
  const warnings: string[] = [];
  let coverageStatus: 'full' | 'partial' | 'unavailable' = 'partial';

  const workflowEmitters = await loadWorkflowEmitters(workspace);

  let required: RequiredContext[] = [];
  try {
    required = await fetchRulesetRequiredContexts(octokit, owner, repo, rulesetRefs.length > 0 ? rulesetRefs : [ref]);
  } catch (error) {
    coverageStatus = 'unavailable';
    warnings.push(`Could not read repository rulesets with the provided token: ${error instanceof Error ? error.message : String(error)}`);
  }

  let observedEmitters: WorkflowEmitter[] = [];
  if (includeObservedChecks) {
    try {
      observedEmitters = await fetchObservedEmitters(octokit, owner, repo, ref, Number.isFinite(lookbackCommits) ? lookbackCommits : 20);
    } catch (error) {
      warnings.push(`Could not inspect recent check runs/statuses: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  warnings.push('Legacy branch-protection required checks may require elevated Administration read access or a future GitHub App; this Action reports ruleset/workflow/observed-check coverage only by default.');

  const result = analyzeDrift({
    required,
    emitted: mergeEmitters(workflowEmitters, observedEmitters),
    coverageStatus,
    warnings,
  });

  await mkdir(workspace, { recursive: true });
  await writeFile(reportPath, renderMarkdownReport(result));

  core.setOutput('required-count', result.required.length.toString());
  core.setOutput('emitted-count', result.emitted.length.toString());
  core.setOutput('missing-count', result.missing.length.toString());
  core.setOutput('coverage-status', result.coverageStatus);
  core.setOutput('report-path', reportPath);

  await core.summary.addRaw(renderMarkdownReport(result)).write();

  if (result.missing.length > 0 && failOnDrift) {
    core.setFailed(`${result.missing.length} required check context(s) appear to be missing.`);
  }
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
