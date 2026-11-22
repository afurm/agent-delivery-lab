# Staging validation

Observed runtime: Linux, Node v24.22.3, npm 11.19.1. No dependency installation.
Run from the source folder or cleanly extracted final archive:

```sh
npm test
npm run demo
npm run smoke
```

All three commands exit 0. The suite has 36 passing tests and zero failures.
Coverage includes three layouts, canonical skill bytes/metadata, no-write preview,
unchanged modification times on rerun, custom portable output, conflict preflight,
path traversal/absolute injection, symlink roots/ancestors/leaves, malformed CLI
flags, unrelated-project verification, missing/partial/failed/forged/stale evidence,
cross-candidate reuse and changed candidate/fixture/check bindings.

Demo output:

```text
bad happy-path: PASS (freePlaces=0, promotions=1)
bad duplicate-cancellation: FAIL (freePlaces=1, promotions=1)
bad evidence gate: BLOCKED — failed checks
corrected happy-path: PASS (freePlaces=0, promotions=1)
corrected duplicate-cancellation: PASS (freePlaces=0, promotions=1)
corrected evidence gate: PASS — complete evidence matches exact bytes and rerun
missing: BLOCKED — missing evidence
incomplete: BLOCKED — incomplete evidence
passing evidence on different candidate: BLOCKED — stale binding
```

Each fresh codex/claude/portable consumer passes preview/apply/repeat smoke, rejects
failed evidence, accepts matching evidence and rejects stale evidence after a
candidate edit. Matching smoke JSON is deliberately constructed test data: this
tests consistency checks, not real execution of an unrelated implementation.

ZIP CRC and file-by-file byte comparison are checked before rerunning all three
commands in a clean extract. The archive excludes .git, dependencies, caches,
consumer output and temporary scripts. The source remains available for owner-led
staging. Live clients, GitHub Actions execution, branch protection, package
publication and platform compatibility outside this Linux runtime are untested.
