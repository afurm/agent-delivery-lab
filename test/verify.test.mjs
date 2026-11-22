import test from 'node:test';
import assert from 'node:assert/strict';
import { realpath, mkdtemp, writeFile, rm, symlink, link } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { record, verify } from '../lib/verify.mjs';
async function project(fn) {
 const workspace = await mkdtemp(join(await realpath(tmpdir()), 'adl-unrelated-'));
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

for (const [expected, actual, passed] of [
 ['9007199254740992', '9007199254740993', false],
 ['0.1', '0.10000000000000001', false],
 ['1e400', '2e400', false], ['1e-400', '2e-400', false],
 ['1e400', '"Infinity"', false], ['1', '"1"', false],
 ['"NaN"', '"Infinity"', false], ['"1e400"', '"1e400"', true],
 ['1', '1.00e+0', true], ['123.4500', '12345e-2', true],
 ['1e400', '10e399', true], ['1e-400', '0.1e-399', true],
 ['-0', '0', false], ['-0', '-0.00e99', true],
 ['{"b":[1,2],"a":true}', '{"a":true,"b":[1.0,2e0]}', true],
 ['[1,2]', '[2,1]', false],
 ['1', '{"sign":"","digits":"1","exponent":"0"}', false],
]) {
 test(`exact JSON comparison: ${expected} versus ${actual}`, () => project(async ({ options, put }) => {
  await writeFile(join(options.workspace, 'expected.json'), expected);
  await writeFile(join(options.workspace, 'actual.json'), actual);
  const evidence = await record(options);
  assert.equal(evidence.results[0].passed, passed);
  await put('evidence.json', evidence);
  assert.equal((await verify(options)).status, passed ? 'PASS' : 'BLOCKED');
  if (!passed) {
   evidence.results[0].passed = true; await put('evidence.json', evidence);
   assert.equal((await verify(options)).reason, 'evidence differs from current comparison');
  }
 }));
}
test('numeric token bounds fail closed and huge exponents stay compact', () => project(async ({ options, put }) => {
 for (const value of ['1e' + '9'.repeat(4094), '1'.repeat(4096)]) {
  for (const path of ['expected.json', 'actual.json']) await writeFile(join(options.workspace, path), value);
  await put('evidence.json', await record(options));
  assert.equal((await verify(options)).status, 'PASS');
 }
 await writeFile(join(options.workspace, 'actual.json'), '1'.repeat(4097));
 await assert.rejects(record(options), /4096/);
 assert.equal((await verify(options)).status, 'BLOCKED');
}));
test('hard-link aliases cannot compare a file to itself', () => project(async ({ options, manifest, put }) => {
 await put('evidence.json', await record(options));
 await link(join(options.workspace, 'expected.json'), join(options.workspace, 'alias.json'));
 manifest.checks[0].actual = 'alias.json'; await put('manifest.json', manifest);
 await assert.rejects(record(options), /distinct files/);
 assert.equal((await verify(options)).status, 'BLOCKED');
}));
test('case aliases are rejected on case-insensitive filesystems', () => project(async ({ options, manifest, put }) => {
 const { stat } = await import('node:fs/promises');
 const alias = join(options.workspace, 'EXPECTED.JSON');
 try { await stat(alias); } catch (error) {
  if (error.code !== 'ENOENT') throw error;
  // Exercise the same spelling variation on case-sensitive hosts with an own hard link.
  await link(join(options.workspace, 'expected.json'), alias);
 }
 manifest.checks[0].actual = 'EXPECTED.JSON'; await put('manifest.json', manifest);
 await assert.rejects(record(options), /distinct files/);
}));
