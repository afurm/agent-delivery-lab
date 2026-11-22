import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { isDeepStrictEqual } from 'node:util';
import { workspaceRoot, readLocal, readLocalFile, relativePath } from './paths.mjs';
const sha = value => createHash('sha256').update(value).digest('hex');
const parse = bytes => JSON.parse(bytes.toString('utf8'));
// A private type prevents JSON strings/objects from impersonating numbers.
class ExactNumber {
  constructor(source) {
    if (typeof source !== 'string') throw new Error('JSON numeric source requires Node 22+');
    if (source.length > 4096) throw new Error('JSON number exceeds 4096 characters');
    const match = /^(-?)(\d+)(?:\.(\d+))?(?:[eE]([+-]?\d+))?$/.exec(source);
    if (!match) throw new Error('invalid JSON numeric source');
    const [, sign, integer, fraction = '', exponent = '0'] = match;
    const digits = (integer + fraction).replace(/^0+/, '');
    this.sign = sign; // Preserve the existing distinction between -0 and 0.
    if (!digits) { this.digits = '0'; this.exponent = '0'; return; }
    this.digits = digits.replace(/0+$/, '');
    // Never expand an exponent into zeros. BigInt work is bounded by the lexeme cap.
    this.exponent = (BigInt(exponent) - BigInt(fraction.length) +
      BigInt(digits.length - this.digits.length)).toString();
  }
}
const parseOutput = bytes => JSON.parse(bytes.toString('utf8'), (key, value, context) =>
  typeof value === 'number' ? new ExactNumber(context?.source) : value);
function validate(manifest) {
  if (manifest?.schema !== 'adl-manifest-v1' || typeof manifest.version !== 'string' || !manifest.version ||
      !Array.isArray(manifest.candidates) || !manifest.candidates.length || manifest.candidates.length > 100 ||
      !Array.isArray(manifest.checks) || !manifest.checks.length || manifest.checks.length > 100) {
    throw new Error('invalid or empty manifest');
  }
  manifest.candidates.forEach(relativePath);
  const ids = new Set();
  for (const check of manifest.checks) {
    if (!check || typeof check.id !== 'string' || !/^[a-z0-9-]{1,64}$/.test(check.id) || ids.has(check.id)) {
      throw new Error('invalid or duplicate check id');
    }
    ids.add(check.id); relativePath(check.expected); relativePath(check.actual);
    if (check.expected === check.actual) throw new Error('expected and actual must be distinct paths');
  }
}
// Compares supplied JSON outputs only. Never imports candidate code or runs commands.
export async function record({ workspace, manifest: manifestPath }) {
  const root = await workspaceRoot(workspace);
  const manifestBytes = await readLocal(root, manifestPath);
  const manifest = parse(manifestBytes); validate(manifest);
  const paths = [...new Set([...manifest.candidates,
    ...manifest.checks.flatMap(check => [check.expected, check.actual])])].sort();
  const files = {};
  const bytes = new Map();
  const identities = new Map();
  for (const path of paths) {
    const { content, identity } = await readLocalFile(root, path);
    bytes.set(path, content); identities.set(path, identity);
    Object.defineProperty(files, path, { value: sha(content), enumerable: true });
  }
  for (const check of manifest.checks) {
    if (identities.get(check.expected) === identities.get(check.actual)) {
      throw new Error('expected and actual must be distinct files');
    }
  }
  const results = manifest.checks.map(check => ({ id: check.id,
    passed: isDeepStrictEqual(parseOutput(bytes.get(check.expected)), parseOutput(bytes.get(check.actual))) }));
  return { schema: 'adl-evidence-v1', origin: 'local JSON comparison; no candidate execution',
    binding: { manifest: sha(manifestBytes), manifestVersion: manifest.version,
      verifier: sha(await readFile(new URL('./verify.mjs', import.meta.url))),
      paths: sha(await readFile(new URL('./paths.mjs', import.meta.url))), files }, results };
}
export async function verify({ workspace, manifest, evidence }) {
  const blocked = reason => ({ status: 'BLOCKED', reason });
  try {
    const root = await workspaceRoot(workspace);
    const saved = parse(await readLocal(root, evidence));
    if (saved?.schema !== 'adl-evidence-v1' || !saved.binding || !Array.isArray(saved.results)) return blocked('incomplete evidence');
    const current = await record({ workspace: root, manifest });
    if (!isDeepStrictEqual(saved.binding, current.binding)) return blocked('stale binding');
    if (saved.results.length !== current.results.length || saved.results.some((result, index) =>
      result?.id !== current.results[index].id || typeof result.passed !== 'boolean')) return blocked('incomplete evidence');
    if (saved.results.some(result => !result.passed)) return blocked('failed checks');
    if (!isDeepStrictEqual(saved, current)) return blocked('evidence differs from current comparison');
    return { status: 'PASS', reason: 'exact bindings and all supplied JSON comparisons match' };
  } catch (error) {
    return blocked(`missing or invalid input: ${error.message}`);
  }
}
