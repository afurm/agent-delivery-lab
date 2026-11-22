import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { record, verify } from '../lib/verify.mjs';
async function project(fn) {
 const workspace = await mkdtemp(join(tmpdir(), 'adl-unrelated-'));
 const manifest = { schema: 'adl-manifest-v1', version: 'text-normalization-v1', candidates: ['normalize.txt'],
  checks: [{ id: 'upper-case', expected: 'expected.json', actual: 'actual.json' }] };
 const put = (path, value) => writeFile(join(workspace, path), JSON.stringify(value));
 const options = { workspace, manifest: 'manifest.json', evidence: 'evidence.json' };
 try {
  await writeFile(join(workspace, 'normalize.txt'), 'An unrelated text normalization candidate');
  await put('manifest.json', manifest); await put('expected.json', { result: 'HELLO' }); await put('actual.json', { result: 'HELLO' });
  await fn({ options, manifest, put });
 } finally { await rm(workspace, { recursive: true, force: true }); }
}
test('unrelated project: complete deterministic record passes', () => project(async ({ options, put }) => {
 const evidence = await record(options); assert.deepEqual(await record(options), evidence);
 await put('evidence.json', evidence); assert.equal((await verify(options)).status, 'PASS');
}));
test('unrelated project: missing, partial, failed and forged evidence blocks', () => project(async ({ options, put }) => {
 assert.equal((await verify(options)).status, 'BLOCKED');
 const good = await record(options);
 for (const evidence of [null, {}, { ...good, results: [] }, { ...good, results: [null] },
  { ...good, results: [{ id: 'upper-case', passed: false }] }, { ...good, origin: 'invented reviewer' }]) {
  await put('evidence.json', evidence); assert.equal((await verify(options)).status, 'BLOCKED');
 }
 await put('actual.json', { result: 'wrong' });
 const failed = await record(options); assert.equal(failed.results[0].passed, false);
 await put('evidence.json', failed); assert.equal((await verify(options)).reason, 'failed checks');
 failed.results[0].passed = true; await put('evidence.json', failed);
 assert.equal((await verify(options)).reason, 'evidence differs from current comparison');
}));
test('unrelated project: candidate, fixture, result and manifest changes stale the record', () => project(async ({ options, put }) => {
 for (const path of ['normalize.txt', 'expected.json', 'actual.json', 'manifest.json']) {
  const evidence = await record(options); await put('evidence.json', evidence);
  const { readFile } = await import('node:fs/promises');
  const original = await readFile(join(options.workspace, path));
  await writeFile(join(options.workspace, path), Buffer.concat([original, Buffer.from('\n')]));
  assert.equal((await verify(options)).reason, 'stale binding');
  await writeFile(join(options.workspace, path), original);
 }
}));
test('unrelated project: alternate candidate path cannot reuse passing evidence', () => project(async ({ options, manifest, put }) => {
 await put('evidence.json', await record(options));
 await writeFile(join(options.workspace, 'another.txt'), 'different candidate');
 manifest.candidates = ['another.txt']; await put('manifest.json', manifest);
 assert.equal((await verify(options)).reason, 'stale binding');
}));
test('generic verifier rejects empty/duplicate checks and unsafe paths', () => project(async ({ options, manifest, put }) => {
 const copies = [ { ...manifest, checks: [] }, { ...manifest, checks: [manifest.checks[0], manifest.checks[0]] },
  { ...manifest, checks: [{ id: 'bad', expected: 'actual.json', actual: 'actual.json' }] },
  ...['../escape', '/tmp/escape', 'C:/escape'].map(path => ({ ...manifest, candidates: [path] })) ];
 for (const invalid of copies) {
  await put('manifest.json', invalid); await assert.rejects(record(options));
 }
}));
test('generic verifier rejects symlinked inputs and oversized files', () => project(async ({ options, manifest, put }) => {
 await symlink(join(options.workspace, 'normalize.txt'), join(options.workspace, 'linked.txt'));
 manifest.candidates = ['linked.txt']; await put('manifest.json', manifest);
 await assert.rejects(record(options), /symlink/);
 manifest.candidates = ['large.txt']; await put('manifest.json', manifest);
 await writeFile(join(options.workspace, 'large.txt'), Buffer.alloc(1024 * 1024 + 1));
 await assert.rejects(record(options), /1 MiB/);
}));

test('prototype-like candidate filename is included in content bindings', () => project(async ({ options, manifest, put }) => {
 await writeFile(join(options.workspace, '__proto__'), 'candidate one');
 manifest.candidates = ['__proto__']; await put('manifest.json', manifest);
 const evidence = await record(options);
 assert.ok(Object.hasOwn(evidence.binding.files, '__proto__'));
 await put('evidence.json', evidence);
 assert.equal((await verify(options)).status, 'PASS');
 await writeFile(join(options.workspace, '__proto__'), 'candidate two');
 assert.equal((await verify(options)).reason, 'stale binding');
}));
