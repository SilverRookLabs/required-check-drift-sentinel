import type { getOctokit } from '@actions/github';
import type { RequiredContext, WorkflowEmitter } from './model.js';

type Octokit = ReturnType<typeof getOctokit>;

export async function fetchRulesetRequiredContexts(octokit: Octokit, owner: string, repo: string, refs: string[]): Promise<RequiredContext[]> {
  const rulesets = await octokit.paginate(octokit.rest.repos.getRepoRulesets, {
    owner,
    repo,
    includes_parents: true,
    per_page: 100,
  });

  const contexts: RequiredContext[] = [];
  for (const ruleset of rulesets) {
    const detailedRuleset = await octokit.request('GET /repos/{owner}/{repo}/rulesets/{ruleset_id}', {
      owner,
      repo,
      ruleset_id: ruleset.id,
    });
    const rules = Array.isArray(detailedRuleset.data.rules) ? detailedRuleset.data.rules : [];
    for (const rule of rules) {
      if (rule.type !== 'required_status_checks') {
        continue;
      }
      const parameters = rule.parameters as { required_status_checks?: Array<{ context?: string }> } | undefined;
      for (const check of parameters?.required_status_checks ?? []) {
        if (check.context) {
          contexts.push({ context: check.context, source: `ruleset:${detailedRuleset.data.name ?? ruleset.id}` });
        }
      }
    }
  }

  if (contexts.length > 0 || refs.length === 0) {
    return contexts;
  }

  return contexts;
}

export async function fetchObservedEmitters(
  octokit: Octokit,
  owner: string,
  repo: string,
  ref: string,
  lookbackCommits: number,
): Promise<WorkflowEmitter[]> {
  const commits = await octokit.paginate(octokit.rest.repos.listCommits, {
    owner,
    repo,
    sha: ref,
    per_page: Math.min(Math.max(lookbackCommits, 1), 100),
  });

  const emitters: WorkflowEmitter[] = [];
  for (const commit of commits.slice(0, lookbackCommits)) {
    const sha = commit.sha;
    const checkRuns = await octokit.paginate(octokit.rest.checks.listForRef, {
      owner,
      repo,
      ref: sha,
      per_page: 100,
    });
    for (const checkRun of checkRuns) {
      if (checkRun.name) {
        emitters.push({ context: checkRun.name, source: `check-run:${sha.slice(0, 7)}` });
      }
    }

    const statuses = await octokit.paginate(octokit.rest.repos.listCommitStatusesForRef, {
      owner,
      repo,
      ref: sha,
      per_page: 100,
    });
    for (const status of statuses) {
      if (status.context) {
        emitters.push({ context: status.context, source: `commit-status:${sha.slice(0, 7)}` });
      }
    }
  }

  return emitters;
}
