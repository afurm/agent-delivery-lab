#!/usr/bin/env node
import { install } from '../lib/install.mjs';
import { record, verify } from '../lib/verify.mjs';
const help = `Agent Delivery Lab 0.1.0 (Node 22+)
Use an explicit path: node /path/to/agent-delivery-lab/bin/adl.mjs COMMAND FLAGS
init|export --workspace DIR [--target codex|claude|portable] [--out RELATIVE] [--apply|--preview]
record --workspace DIR --manifest RELATIVE
verify --workspace DIR --manifest RELATIVE --evidence RELATIVE
init copies skills and templates; export copies skills only. Default is preview.
record prints an evidence record; it does NOT execute candidate code.
verify exits 0 on PASS, 1 on BLOCKED. Usage/errors exit 2.
No global configuration, network, accounts, Git operations or command runner.
`;
try {
  const [command, ...args] = process.argv.slice(2);
  if (!command || command === '--help' || command === 'help') console.log(help);
  else {
    const allowed = command === 'init' || command === 'export'
      ? ['workspace', 'target', 'out', 'apply', 'preview']
      : command === 'record' ? ['workspace', 'manifest']
      : command === 'verify' ? ['workspace', 'manifest', 'evidence'] : null;
    if (!allowed) throw new Error('unknown command');
    const options = {};
    for (let i = 0; i < args.length; i++) {
      const key = args[i].startsWith('--') ? args[i].slice(2) : '';
      if (!allowed.includes(key) || key in options) throw new Error('unknown or duplicate option');
      if (key === 'apply' || key === 'preview') options[key] = true;
      else {
        const value = args[++i];
        if (!value || value.startsWith('--')) throw new Error(`missing value for --${key}`);
        options[key] = value;
      }
    }
    if (options.apply && options.preview) throw new Error('choose --apply or --preview');
    let result;
    if (command === 'init' || command === 'export') result = await install({ ...options, command });
    else if (command === 'record') result = await record(options);
    else result = await verify(options);
    console.log(JSON.stringify(result, null, 2));
    if (command === 'verify' && result.status !== 'PASS') process.exitCode = 1;
    if (command === 'record' && result.results.some(item => !item.passed)) process.exitCode = 1;
  }
} catch (error) {
  console.error(`ERROR: ${error.message}`); process.exitCode = 2;
}
