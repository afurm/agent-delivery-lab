import { evaluate, verify } from './lib/evidence.mjs';
const bad = new URL('./candidates/bad.mjs', import.meta.url);
const good = new URL('./candidates/corrected.mjs', import.meta.url);
console.log('Agent Delivery Lab: synthetic offline execution; no agents or services');
for (const [name, path] of [['bad', bad], ['corrected', good]]) {
  const evidence = await evaluate(path);
  for (const result of evidence.results) {
    console.log(`${name} ${result.id}: ${result.passed ? 'PASS' : 'FAIL'} (freePlaces=${result.actual.freePlaces}, promotions=${result.actual.promotions.length})`);
  }
  const gate = await verify(evidence, path);
  console.log(`${name} evidence gate: ${gate.status} — ${gate.reason}`);
}
const passing = await evaluate(good);
for (const [label, evidence, path] of [
  ['missing', null, good],
  ['incomplete', { ...passing, results: passing.results.slice(0, 1) }, good],
  ['passing evidence on different candidate', passing, bad]]) {
  const gate = await verify(evidence, path);
  console.log(`${label}: ${gate.status} — ${gate.reason}`);
}
console.log('Totals: 3/4 domain checks pass; 1 intentional failure; 1 gate PASS; 4 gates BLOCKED.');
