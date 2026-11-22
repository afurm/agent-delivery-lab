import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
test('clean consumer executes synthetic code with spaces and non-ASCII, then rejects stale evidence', async () => {
 const parent = await mkdtemp(join(await realpath(tmpdir()), 'adl-consumer-'));
 try {
  const workspace = join(parent, 'consumer café');
  const script = fileURLToPath(new URL('../examples/consumer-walkthrough.mjs', import.meta.url));
  const run = () => spawnSync(process.execPath, [script, workspace], { encoding: 'utf8' });
  const result = run(); assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /verify: exit 0; PASS/);
  assert.match(result.stdout, /exit 1; BLOCKED — stale binding/);
  assert.deepEqual(JSON.parse(await readFile(join(workspace, 'actual.json'), 'utf8')), { result: 'CAFÉ HELLO' });
  assert.notEqual(run().status, 0); // Existing projects must not be overwritten.
 } finally { await rm(parent, { recursive: true, force: true }); }
});
