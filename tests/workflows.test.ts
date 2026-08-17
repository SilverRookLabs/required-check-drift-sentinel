import { describe, expect, it } from 'vitest';
import { parseWorkflowEmitters } from '../src/workflows.js';

describe('parseWorkflowEmitters', () => {
  it('infers workflow/job check names and bare job names', () => {
    const emitters = parseWorkflowEmitters(
      `
name: CI
on: [pull_request]
jobs:
  test:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - run: npm test
  lint:
    runs-on: ubuntu-latest
    steps:
      - run: npm run lint
`,
      '.github/workflows/ci.yml',
    );

    expect(emitters.map((emitter) => emitter.context)).toEqual(['Unit Tests', 'CI / Unit Tests', 'lint', 'CI / lint']);
  });
});
