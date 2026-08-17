import type { DriftResult } from './model.js';

export function renderMarkdownReport(result: DriftResult): string {
  const lines = [
    '# Required Check Drift Report',
    '',
    `Coverage: \`${result.coverageStatus}\``,
    `Required contexts: ${result.required.length}`,
    `Inferred emitted contexts: ${result.emitted.length}`,
    `Missing required contexts: ${result.missing.length}`,
    '',
  ];

  if (result.warnings.length > 0) {
    lines.push('## Warnings', '');
    for (const warning of result.warnings) {
      lines.push(`- ${warning}`);
    }
    lines.push('');
  }

  lines.push('## Missing Required Contexts', '');
  if (result.missing.length === 0) {
    lines.push('None detected.', '');
  } else {
    for (const item of result.missing) {
      lines.push(`- \`${item.context}\` from ${item.source}`);
    }
    lines.push('');
  }

  lines.push('## Matched Required Contexts', '');
  if (result.matched.length === 0) {
    lines.push('None.', '');
  } else {
    for (const item of result.matched) {
      lines.push(`- \`${item.context}\` from ${item.source}`);
    }
    lines.push('');
  }

  lines.push('## Inferred Emitters', '');
  if (result.emitted.length === 0) {
    lines.push('None detected.', '');
  } else {
    for (const item of result.emitted) {
      lines.push(`- \`${item.context}\` from ${item.source}`);
    }
    lines.push('');
  }

  return `${lines.join('\n')}\n`;
}
