import test from 'node:test';
import assert from 'node:assert/strict';
import { realpath, mkdtemp, rm, readdir, readFile, writeFile, mkdir, symlink, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { record } from '../lib/verify.mjs';
import { install, skillNames } from '../lib/install.mjs';
const cli = fileURLToPath(new URL('../bin/adl.mjs', import.meta.url));
async function sandbox(fn) {
 const workspace = await mkdtemp(join(await realpath(tmpdir()), 'adl-install-'));
 try { await fn(workspace); } finally { await rm(workspace, { recursive: true, force: true }); }
}
for (const target of ['codex', 'claude', 'portable']) {
 test(`${target}: preview, apply, exact rerun and canonical bytes`, () => sandbox(async workspace => {
  const preview = await install({ workspace, target });
  assert.equal(preview.mode, 'preview'); assert.equal(preview.files.length, 10);
  assert.deepEqual(await readdir(workspace), []);
  const applied = await install({ workspace, target, apply: true });
  const times = [];
  for (const entry of applied.files) times.push((await stat(join(workspace, entry.path))).mtimeMs);
  const rerun = await install({ workspace, target, apply: true });
  assert.ok(rerun.files.every(entry => entry.action === 'unchanged'));
  assert.deepEqual(await Promise.all(rerun.files.map(async entry => (await stat(join(workspace, entry.path))).mtimeMs)), times);
  for (let i = 0; i < skillNames.length; i++) {
   assert.deepEqual(await readFile(join(workspace, applied.files[i].path)),
    await readFile(new URL(`../skills/${skillNames[i]}/SKILL.md`, import.meta.url)));
  }
 }));
}
test('export copies four skills only and custom local output works', () => sandbox(async workspace => {
 const result = await install({ workspace, command: 'export', out: 'docs/delivery', apply: true });
 assert.equal(result.files.length, 4); assert.ok(result.files.every(entry => entry.path.startsWith('docs/delivery/skills/')));
 await install({ workspace, out: 'docs/delivery', apply: true });
 const evidence = await record({ workspace, manifest: 'docs/delivery/manifest.json' });
 assert.equal(evidence.results[0].passed, false);
 assert.ok(Object.hasOwn(evidence.binding.files, 'docs/delivery/candidate.txt'));
}));
test('last-file conflict blocks all earlier planned writes', () => sandbox(async workspace => {
 await mkdir(join(workspace, '.delivery-lab'));
 await writeFile(join(workspace, '.delivery-lab/actual.json'), 'existing');
 await assert.rejects(install({ workspace, target: 'codex', apply: true }), /conflict/);
 assert.deepEqual(await readdir(workspace), ['.delivery-lab']);
 assert.deepEqual(await readdir(join(workspace, '.delivery-lab')), ['actual.json']);
 assert.equal(await readFile(join(workspace, '.delivery-lab/actual.json'), 'utf8'), 'existing');
}));
test('directory/file collision is rejected before any copying', () => sandbox(async workspace => {
 await writeFile(join(workspace, '.agents'), 'existing');
 await assert.rejects(install({ workspace, target: 'codex', apply: true }), /parent/);
 assert.deepEqual(await readdir(workspace), ['.agents']);
}));
test('relative path policy rejects traversal and absolute injection', () => sandbox(async workspace => {
 for (const out of ['../escape', '/tmp/escape', 'C:/escape', 'C:\\escape', './x', 'a/../x', 'a//b', '.', '', 'x\0y', 'a%2fb']) {
  await assert.rejects(install({ workspace, out, apply: true }), /relative/);
 }
 assert.deepEqual(await readdir(workspace), []);
}));
test('symlink ancestor and dangling destination are rejected', () => sandbox(async workspace => {
 await mkdir(join(workspace, 'outside'));
 await symlink(join(workspace, 'outside'), join(workspace, '.agents'));
 await assert.rejects(install({ workspace, target: 'codex', apply: true }), /symlink/);
 assert.deepEqual(await readdir(join(workspace, 'outside')), []);
 await symlink(join(workspace, 'absent'), join(workspace, '.delivery-lab'));
 await assert.rejects(install({ workspace, apply: true }), /symlink/);
}));
test('symlink workspace itself is rejected', () => sandbox(async workspace => {
 await mkdir(join(workspace, 'real'));
 await symlink(join(workspace, 'real'), join(workspace, 'alias'));
 await assert.rejects(install({ workspace: join(workspace, 'alias'), apply: true }), /symlink/);
}));
test('existing skill symlink is refused even when bytes match', () => sandbox(async workspace => {
 await mkdir(join(workspace, '.agents/skills/route-work'), { recursive: true });
 await symlink(fileURLToPath(new URL('../skills/route-work/SKILL.md', import.meta.url)), join(workspace, '.agents/skills/route-work/SKILL.md'));
 await assert.rejects(install({ workspace, target: 'codex', apply: true }), /symlink/);
}));
test('CLI rejects unknown flags, duplicate flags and contradictory modes', () => sandbox(async workspace => {
 for (const args of [['init', '--apply', '--preview'], ['init', '--target', 'other'], ['init', '--workspace', workspace], ['init', '--force'], ['exec', 'echo'], ['init', '--out']]) {
  const result = spawnSync(process.execPath, [cli, ...args, '--workspace', workspace], { encoding: 'utf8' });
  assert.equal(result.status, 2, result.stdout + result.stderr);
 }
 assert.deepEqual(await readdir(workspace), []);
}));
test('skill metadata matches the portable required-field subset', async () => {
 for (const name of skillNames) {
  const text = await readFile(new URL(`../skills/${name}/SKILL.md`, import.meta.url), 'utf8');
  const match = text.match(/^---\nname: ([a-z0-9-]{1,64})\ndescription: ("[^\n]+")\n---\n\n/);
  assert.ok(match); assert.equal(match[1], name); assert.ok(!name.startsWith('-') && !name.endsWith('-') && !name.includes('--'));
  const description = JSON.parse(match[2]); assert.ok(description.length > 0 && description.length <= 1024);
 }
});
