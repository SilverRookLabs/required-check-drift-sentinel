import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { parse } from 'yaml';
import type { WorkflowEmitter } from './model.js';

interface WorkflowDocument {
  name?: unknown;
  jobs?: Record<string, { name?: unknown } | null>;
}

export async function loadWorkflowEmitters(workspace: string): Promise<WorkflowEmitter[]> {
  const workflowDir = join(workspace, '.github', 'workflows');
  let entries: string[];

  try {
    entries = await readdir(workflowDir);
  } catch {
    return [];
  }

  const workflowFiles = entries.filter((entry) => entry.endsWith('.yml') || entry.endsWith('.yaml'));
  const emitters: WorkflowEmitter[] = [];

  for (const file of workflowFiles) {
    const fullPath = join(workflowDir, file);
    const raw = await readFile(fullPath, 'utf8');
    emitters.push(...parseWorkflowEmitters(raw, `.github/workflows/${file}`));
  }

  return uniqueEmitters(emitters);
}

export function parseWorkflowEmitters(raw: string, source: string): WorkflowEmitter[] {
  const doc = parse(raw) as WorkflowDocument | null;
  if (!doc || typeof doc !== 'object' || !doc.jobs || typeof doc.jobs !== 'object') {
    return [];
  }

  const workflowName = typeof doc.name === 'string' && doc.name.trim() ? doc.name.trim() : source;
  const emitters: WorkflowEmitter[] = [];

  for (const [jobId, job] of Object.entries(doc.jobs)) {
    const jobName = job && typeof job.name === 'string' && job.name.trim() ? job.name.trim() : jobId;
    emitters.push({ context: jobName, source });
    emitters.push({ context: `${workflowName} / ${jobName}`, source });
  }

  return uniqueEmitters(emitters);
}

function uniqueEmitters(emitters: WorkflowEmitter[]): WorkflowEmitter[] {
  const seen = new Set<string>();
  return emitters.filter((emitter) => {
    const key = normalizeContext(emitter.context);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

export function normalizeContext(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toLowerCase();
}
