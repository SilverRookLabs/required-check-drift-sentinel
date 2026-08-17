export type CoverageStatus = 'full' | 'partial' | 'unavailable';

export interface WorkflowEmitter {
  context: string;
  source: string;
}

export interface RequiredContext {
  context: string;
  source: string;
}

export interface DriftResult {
  required: RequiredContext[];
  emitted: WorkflowEmitter[];
  missing: RequiredContext[];
  matched: RequiredContext[];
  coverageStatus: CoverageStatus;
  warnings: string[];
}
