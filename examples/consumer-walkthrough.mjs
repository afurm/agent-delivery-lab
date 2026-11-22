// Runs only the fixed synthetic candidate below, in a new isolated directory.
import { mkdir, writeFile, appendFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { workspaceRoot, noLinks } from '../lib/paths.mjs';
const destination = resolve(process.argv[2] || 'consumer café');
await noLinks(destination);
await mkdir(destination); // Refuse an existing directory; never overwrite a project.
const workspace = await workspaceRoot(destination);
const cli = fileURLToPath(new URL('../bin/adl.mjs', import.meta.url));
const put = (name, value) => writeFile(join(workspace, name), value, { encoding: 'utf8', flag: 'wx' });
function run(file, args, expected = 0) {
  const result = spawnSync(process.execPath, [file, ...args], { cwd: workspace, encoding: 'utf8' });
  assert.equal(result.status, expected, result.stderr || result.stdout);
  return result.stdout;
}
await put('candidate.mjs', `import { writeFile } from 'node:fs/promises';
const normalize = value => value.trim().toUpperCase();
await writeFile(new URL('./actual.json', import.meta.url),
  JSON.stringify({ result: normalize('  café hello  ') }), 'utf8');
`);
// Independent expectation, not copied from candidate output.
await put('expected.json', JSON.stringify({ result: 'CAFÉ HELLO' }));
await put('manifest.json', JSON.stringify({ schema: 'adl-manifest-v1', version: 'consumer-v1',
  candidates: ['candidate.mjs'], checks: [{ id: 'normalize', expected: 'expected.json', actual: 'actual.json' }] }));
run(join(workspace, 'candidate.mjs'), []);
console.log('synthetic candidate: exit 0; wrote actual.json as UTF-8');
const args = ['--workspace', workspace, '--manifest', 'manifest.json'];
await put('evidence.json', run(cli, ['record', ...args]));
console.log('record: exit 0; wrote evidence.json as UTF-8');
const passing = JSON.parse(run(cli, ['verify', ...args, '--evidence', 'evidence.json']));
assert.equal(passing.status, 'PASS');
console.log('verify: exit 0; PASS');
await appendFile(join(workspace, 'candidate.mjs'), '\n// Synthetic candidate edit after recording.\n', 'utf8');
const stale = JSON.parse(run(cli, ['verify', ...args, '--evidence', 'evidence.json'], 1));
assert.equal(stale.reason, 'stale binding');
console.log('verify after candidate edit: exit 1; BLOCKED — stale binding');
console.log(`Consumer files retained in ${workspace}`);
