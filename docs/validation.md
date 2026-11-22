# Local validation

Hardening validation observed on Linux, Node v22.0.0/npm 10.5.1 and
Node v24.22.3/npm 11.19.1 on 2026-11-22. Node 22.0.0 was downloaded from
nodejs.org and its SHA-256 matched that release's SHASUMS256.txt. No dependency
installation. Run from the source folder:

```sh
npm test
npm run demo
npm run smoke
node examples/consumer-walkthrough.mjs "consumer café"
```

All four commands exit 0 on both runtimes. The suite has 57 passing tests and
zero failures or skipped tests. The walkthrough internally observes verify exit 0
(PASS), then exit 1 (BLOCKED: stale binding) after its candidate edit.
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

Numeric regressions cover distinct large integers, decimals, overflow and
underflow; equivalent number formats; number/string separation; object/array
semantics; and the 4,096-character token bound. On the base revision, all four
distinct numeric pairs incorrectly passed, as did an expected/actual hard-link
alias. The patched record/verify rejects these synthetic cases. File alias tests
include hard links and case spelling variations (using an own hard link on this
case-sensitive Linux filesystem).

The clean consumer walkthrough actually executes its fixed synthetic candidate;
it does not copy expected JSON to actual JSON. It exercises UTF-8 text and a
workspace path containing spaces and non-ASCII. Test/smoke temporary-directory
parents are resolved to their real path so system temp aliases (such as macOS
/var) do not mask tests. Caller workspace symlink restrictions are unchanged.

## Checks still to run

- On macOS and Windows, use Node 22 and 24 and run the four commands above in a
  fresh checkout. Record OS/filesystem/runtime versions and every exit code.
  Windows symlink tests require a host with symlink creation enabled; report
  unavailable prerequisites rather than silently skipping tests. Confirm native
  case aliases and hard links are rejected. On PowerShell 5.1, use the walkthrough
  as written; do not redirect evidence with `>`.
- In separately authorized live Codex/Claude sessions, preview/apply the matching
  target in a fresh toy project, inspect exported bytes, confirm discovery of all
  four roles and record client versions and observed behavior. No live client,
  model call or paid model use was performed here.
- Let the existing repository-required CI and owner review run through the normal
  independent-contributor PR process. No hosted CI was triggered by this local
  handoff; Linux results establish neither macOS/Windows nor live-client behavior.

No PR, merge, release tag or registry publication is part of this validation.

## Documentation checks

The README excerpt matches actual `node demo.mjs` stdout. The original SVG has
an accessible title/description, explicit status text, a fixed dark background,
and no scripts, links, external assets, or fonts. Local Markdown file links and
SVG XML are validated alongside `git diff --check`.

The consumer smoke command exercises preview/apply/repeat, record/verify, failed
comparisons, and changed-candidate rejection for all three target layouts. The
skills-only `export` preview/apply path is checked separately in temporary folders.
These checks use synthetic data and do not start a live client.
