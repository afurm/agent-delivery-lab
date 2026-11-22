import { isDeepStrictEqual } from 'node:util';
export const checkVersion = 'full-state-checks-v1';
export function check(cancel, fixture) {
  let state = structuredClone(fixture.initial);
  return fixture.steps.map(step => {
    try {
      state = cancel(state, step.cancel);
      return { id: step.check, passed: isDeepStrictEqual(state, step.expected),
        actual: structuredClone(state), expected: step.expected };
    } catch {
      return { id: step.check, passed: false, error: 'candidate threw' };
    }
  });
}
