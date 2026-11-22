import { lstat, open } from 'node:fs/promises';
import { resolve, parse, join, sep } from 'node:path';
import { homedir } from 'node:os';
export function relativePath(value) {
  if (typeof value !== 'string' || value.length > 240 ||
      !/^[a-zA-Z0-9_.-]+(?:\/[a-zA-Z0-9_.-]+)*$/.test(value) ||
      value.split('/').some(part => part === '.' || part === '..')) {
    throw new Error('expected a simple project-relative path');
  }
  return value;
}
export async function statMaybe(path) {
  try { return await lstat(path); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
// Inspect every existing ancestor, including ancestors of the chosen root.
export async function noLinks(path) {
  const absolute = resolve(path);
  let current = parse(absolute).root;
  for (const part of absolute.slice(current.length).split(sep).filter(Boolean)) {
    current = join(current, part);
    const stat = await statMaybe(current);
    if (stat?.isSymbolicLink()) throw new Error('symlink traversal refused');
    if (current !== absolute && stat && !stat.isDirectory()) throw new Error('parent is not a directory');
  }
  return absolute;
}
export async function workspaceRoot(workspace) {
  if (typeof workspace !== 'string' || !workspace) throw new Error('--workspace is required');
  const root = await noLinks(workspace);
  if (root === parse(root).root || root === homedir()) throw new Error('choose a project directory, not a global root');
  if (!(await lstat(root)).isDirectory()) throw new Error('workspace must be an existing directory');
  return root;
}
export async function localPath(root, relative) {
  return noLinks(join(root, relativePath(relative)));
}
export async function readLocal(root, relative) {
  return (await readLocalFile(root, relative)).content;
}
export async function readLocalFile(root, relative) {
  const path = await localPath(root, relative);
  const before = await lstat(path);
  if (!before.isFile() || before.size > 1024 * 1024) throw new Error('expected a regular file of at most 1 MiB');
  const file = await open(path, 'r');
  try {
    const stat = await file.stat({ bigint: true });
    if (!stat.isFile() || stat.size > 1024n * 1024n) throw new Error('expected a regular file of at most 1 MiB');
    // Use identity from the same handle as the bytes; do not serialize host metadata.
    if (stat.ino === 0n) throw new Error('filesystem file identity unavailable');
    return { content: await file.readFile(), identity: `${stat.dev}:${stat.ino}` };
  } finally { await file.close(); }
}
