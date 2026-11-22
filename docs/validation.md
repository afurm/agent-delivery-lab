# Local validation

Observed runtime: Linux, Node v24.22.3, npm 11.19.1. No dependency installation.
Documentation polish rechecked on 2026-11-22. Run from the source folder:

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

The original source-archive staging also checked ZIP CRC and file-by-file bytes.
The documentation polish was tested from a Git checkout; it did not repeat that
historical archive check. Live clients, package publication, and platforms outside
this Linux runtime were not checked. GitHub Actions status is separate from these
local results; no hosted-CI success is claimed here.

## Documentation checks

The README excerpt matches actual `node demo.mjs` stdout. The original SVG has
an accessible title/description, explicit status text, a fixed dark background,
and no scripts, links, external assets, or fonts. Local Markdown file links and
SVG XML are validated alongside `git diff --check`.

The consumer smoke command exercises preview/apply/repeat, record/verify, failed
comparisons, and changed-candidate rejection for all three target layouts. The
skills-only `export` preview/apply path is checked separately in temporary folders.
These checks use synthetic data and do not start a live client.
