import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { isDeepStrictEqual } from 'node:util';
import { check, checkVersion } from './checks.mjs';
const root = new URL('../', import.meta.url);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
export async function evaluate(candidate = new URL('candidates/corrected.mjs', root),
  fixture = new URL('fixtures/workshop-v1.json', root)) {
  const [source, rules, checks, evaluator] = await Promise.all([
    readFile(candidate), readFile(fixture), readFile(new URL('./checks.mjs', import.meta.url)),
    readFile(new URL('./evidence.mjs', import.meta.url))]);
  const spec = JSON.parse(rules);
  // Intended inputs are only trusted, self-contained local toy candidates.
  const { cancel } = await import(`data:text/javascript;base64,${source.toString('base64')}`);
  return { schema: 'illustrative-evidence-v1', origin: 'local deterministic execution',
    binding: { candidate: sha(source), fixture: sha(rules), checks: sha(checks),
      evaluator: sha(evaluator), fixtureVersion: spec.version, checkVersion },
    results: check(cancel, spec) };
}
export async function verify(evidence, candidate, fixture) {
  const blocked = reason => ({ status: 'BLOCKED', reason });
  if (!evidence) return blocked('missing evidence');
  if (evidence.schema !== 'illustrative-evidence-v1' || !evidence.binding ||
      !Array.isArray(evidence.results)) return blocked('incomplete evidence');
  let current;
  try { current = await evaluate(candidate, fixture); }
  catch { return blocked('candidate or fixture cannot be evaluated'); }
  if (!isDeepStrictEqual(evidence.binding, current.binding)) return blocked('stale binding');
  if (evidence.results.length !== current.results.length ||
      evidence.results.some((result, i) => result?.id !== current.results[i].id ||
        typeof result.passed !== 'boolean')) return blocked('incomplete evidence');
  if (evidence.results.some(result => !result.passed)) return blocked('failed checks');
  if (!isDeepStrictEqual(evidence, current)) return blocked('evidence does not match rerun');
  return { status: 'PASS', reason: 'complete evidence matches exact bytes and rerun' };
}
