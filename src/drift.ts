import type { CoverageStatus, DriftResult, RequiredContext, WorkflowEmitter } from './model.js';
import { normalizeContext } from './workflows.js';

export function analyzeDrift(input: {
  required: RequiredContext[];
  emitted: WorkflowEmitter[];
  coverageStatus?: CoverageStatus;
  warnings?: string[];
}): DriftResult {
  const emittedContexts = new Set(input.emitted.map((emitter) => normalizeContext(emitter.context)));
  const uniqueRequired = uniqueRequiredContexts(input.required);
  const missing = uniqueRequired.filter((required) => !emittedContexts.has(normalizeContext(required.context)));
  const matched = uniqueRequired.filter((required) => emittedContexts.has(normalizeContext(required.context)));

  return {
    required: uniqueRequired,
    emitted: uniqueEmitters(input.emitted),
    missing,
    matched,
    coverageStatus: input.coverageStatus ?? 'partial',
    warnings: input.warnings ?? [],
  };
}

export function mergeEmitters(...groups: WorkflowEmitter[][]): WorkflowEmitter[] {
  return uniqueEmitters(groups.flat());
}

function uniqueRequiredContexts(required: RequiredContext[]): RequiredContext[] {
  const seen = new Set<string>();
  return required.filter((item) => {
    const key = normalizeContext(item.context);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function uniqueEmitters(emitters: WorkflowEmitter[]): WorkflowEmitter[] {
  const seen = new Set<string>();
  return emitters.filter((item) => {
    const key = normalizeContext(item.context);
    if (!key || seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}
