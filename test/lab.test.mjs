import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { evaluate, verify } from '../lib/evidence.mjs';
const bad = new URL('../candidates/bad.mjs', import.meta.url);
const good = new URL('../candidates/corrected.mjs', import.meta.url);
const fixture = new URL('../fixtures/workshop-v1.json', import.meta.url);
const passing = await evaluate(good);
const failing = await evaluate(bad);
test('bad candidate passes happy path', () => assert.equal(failing.results[0].passed, true));
test('bad replay exposes extra free place', () => {
  assert.equal(failing.results[1].passed, false);
  assert.equal(failing.results[1].actual.freePlaces, 1);
});
test('corrected candidate passes both literal fixtures', () => assert.ok(passing.results.every(r => r.passed)));
test('replay preserves complete state and exactly one promotion', () => {
  assert.deepEqual(passing.results[0].actual, passing.results[1].actual);
  assert.deepEqual(passing.results[1].actual.promotions, ['attendee-c']);
});
test('evidence is deterministic', async () => assert.deepEqual(await evaluate(good), passing));
test('complete passing evidence is accepted', async () => assert.equal((await verify(passing, good)).status, 'PASS'));
for (const [name, evidence, candidate] of [
  ['missing', null, good], ['incomplete envelope', {}, good],
  ['omitted check', { ...passing, results: passing.results.slice(0, 1) }, good],
  ['duplicate check', { ...passing, results: [passing.results[0], passing.results[0]] }, good],
  ['failed checks', failing, bad], ['cross-candidate reuse', passing, bad],
  ['forged actual state', { ...passing, results: passing.results.map(r => ({ ...r, actual: {} })) }, good]
]) test(`gate rejects ${name}`, async () => assert.equal((await verify(evidence, candidate)).status, 'BLOCKED'));
test('gate rejects passing evidence after candidate bytes change', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'delivery-lab-'));
  try {
    const changed = join(dir, 'changed.mjs');
    await writeFile(changed, (await readFile(good, 'utf8')) + '\n// byte change\n');
    assert.ok((await evaluate(changed)).results.every(r => r.passed));
    assert.deepEqual(await verify(passing, changed), { status: 'BLOCKED', reason: 'stale binding' });
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('gate rejects changed fixture bytes', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'delivery-lab-'));
  try {
    const changed = join(dir, 'fixture.json');
    await writeFile(changed, (await readFile(fixture, 'utf8')) + '\n');
    assert.equal((await verify(passing, good, changed)).reason, 'stale binding');
  } finally { await rm(dir, { recursive: true, force: true }); }
});
test('gate rejects stale check version or digest', async () => {
  for (const field of ['checkVersion', 'checks', 'evaluator']) {
    const stale = structuredClone(passing); stale.binding[field] = 'obsolete';
    assert.equal((await verify(stale, good)).reason, 'stale binding');
  }
});
test('packaged evidence examples match current candidates', async () => {
  for (const [name, current] of [['bad', failing], ['corrected', passing]]) {
    assert.deepEqual(JSON.parse(await readFile(new URL(`../examples/${name}-evidence.json`, import.meta.url))), current);
  }
});
