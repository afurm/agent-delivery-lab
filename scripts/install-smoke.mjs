// Layout/CLI smoke only: does not start Codex, Claude Code or Git.
import { mkdtemp, rm, writeFile, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
const cli = fileURLToPath(new URL('../bin/adl.mjs', import.meta.url));
const parent = await mkdtemp(join(tmpdir(), 'adl-smoke-'));
function run(args, expected = 0) {
 const result = spawnSync(process.execPath, [cli, ...args], { encoding: 'utf8' });
 assert.equal(result.status, expected, result.stderr || result.stdout);
 return JSON.parse(result.stdout);
}
try {
 for (const target of ['codex', 'claude', 'portable']) {
  const workspace = await mkdtemp(join(parent, `${target}-`));
  const args = ['init', '--workspace', workspace, '--target', target];
  assert.equal(run(args).mode, 'preview');
  assert.equal(run([...args, '--apply']).files.filter(f => f.action === 'create').length, 10);
  assert.ok(run([...args, '--apply']).files.every(f => f.action === 'unchanged'));
  const opts = ['--workspace', workspace, '--manifest', '.delivery-lab/manifest.json'];
  const failed = run(['record', ...opts], 1);
  await writeFile(join(workspace, '.delivery-lab/evidence.json'), JSON.stringify(failed));
  assert.equal(run(['verify', ...opts, '--evidence', '.delivery-lab/evidence.json'], 1).status, 'BLOCKED');
  await writeFile(join(workspace, '.delivery-lab/actual.json'), await readFile(join(workspace, '.delivery-lab/expected.json')));
  const passing = run(['record', ...opts]);
  await writeFile(join(workspace, '.delivery-lab/evidence.json'), JSON.stringify(passing));
  assert.equal(run(['verify', ...opts, '--evidence', '.delivery-lab/evidence.json']).status, 'PASS');
  await writeFile(join(workspace, '.delivery-lab/candidate.txt'), 'changed candidate');
  assert.equal(run(['verify', ...opts, '--evidence', '.delivery-lab/evidence.json'], 1).reason, 'stale binding');
  console.log(`${target}: preview/apply/repeat PASS; failed evidence BLOCKED; matching evidence PASS; changed candidate BLOCKED`);
 }
 console.log('3 fresh consumer folders passed layout/CLI smoke. No live clients were run.');
} finally { await rm(parent, { recursive: true, force: true }); }
