import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { workspaceRoot, relativePath, localPath, statMaybe, readLocal } from './paths.mjs';
export const skillNames = ['route-work', 'define-domain-check', 'implement-slice', 'verify-evidence'];
const source = fileURLToPath(new URL('../', import.meta.url));
export async function install({ workspace, target = 'portable', out = '.delivery-lab', apply = false, command = 'init' }) {
  const root = await workspaceRoot(workspace);
  relativePath(out);
  if (!['codex', 'claude', 'portable'].includes(target)) throw new Error('target must be codex, claude or portable');
  if (!['init', 'export'].includes(command)) throw new Error('command must be init or export');
  const base = target === 'codex' ? '.agents/skills' : target === 'claude' ? '.claude/skills' : `${out}/skills`;
  const entries = [];
  for (const name of skillNames) entries.push([`${base}/${name}/SKILL.md`,
    await readLocal(source, `skills/${name}/SKILL.md`)]);
  if (command === 'init') {
    for (const name of ['handoff.md', 'evidence.json', 'manifest.json', 'candidate.txt', 'expected.json', 'actual.json']) {
      let bytes = await readLocal(source, `templates/${name}`);
      if (name === 'manifest.json') bytes = Buffer.from(bytes.toString().replaceAll('__OUT__', out));
      entries.push([`${out}/${name}`, bytes]);
    }
  }
  // Entire plan is checked before the first directory or file is created.
  const plan = [];
  for (const [relative, bytes] of entries) {
    const path = await localPath(root, relative);
    const stat = await statMaybe(path);
    if (stat && (!stat.isFile() || !(await readFile(path)).equals(bytes))) {
      throw new Error(`conflict: ${relative}; no planned writes applied`);
    }
    plan.push({ path: relative, action: stat ? 'unchanged' : 'create', bytes });
  }
  if (apply) {
    for (const entry of plan.filter(entry => entry.action === 'create')) {
      const path = await localPath(root, entry.path);
      await mkdir(dirname(path), { recursive: true });
      await localPath(root, entry.path);
      await writeFile(path, entry.bytes, { flag: 'wx' });
    }
  }
  return { mode: apply ? 'apply' : 'preview', target,
    files: plan.map(({ path, action }) => ({ path, action })) };
}
