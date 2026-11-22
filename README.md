# Agent Delivery Lab v0.1

Four portable delivery skills, a local exporter and a bounded evidence checker.
Reuse them in an unrelated developer project to define a small slice, specify
expected outcomes, implement it and hand off explicit evidence. No orchestration
service, model calls, credentials or global install. Node 22+; zero dependencies.

## Fastest start

Extract the source ZIP, open its folder, and run:

```sh
npm test
npm run demo
npm run smoke
node bin/adl.mjs --help
```

No `npm install`, Git or network is needed. `.npmrc` selects offline mode and
turns off audit, funding and update checks. `npm run demo` executes only the two
bundled trusted workshop candidates. `npm run smoke` creates and removes three
throwaway consumer directories. No command starts a live agent or server.
This is a source-checkout product; no registry package installation is required.
The package is private to prevent accidental npm publication. Repository URLs
point to the proposed `afurm/agent-delivery-lab` destination, not proof of publication.

## Use in your own project

Keep the extracted source folder available. Create your project directory first.
Replace the two absolute example paths below with your own paths. The executable
path points to this checkout, and `--workspace` points to the consumer project.

```sh
node /path/to/agent-delivery-lab/bin/adl.mjs init --workspace /path/to/project --target codex
node /path/to/agent-delivery-lab/bin/adl.mjs init --workspace /path/to/project --target codex --apply
```

The first command prints a complete preview without creating directories. Review
it, then use `--apply`. Repeat the exact second command to rerun: all identical
files are reported `unchanged`, including their modification times. Differing
files cause an error; the CLI never updates them. After editing templates, use
`export` to rerun skills-only, or resolve differences manually after review.

| Target | Skill destination in chosen project | Intended use |
| --- | --- | --- |
| `codex` | `.agents/skills/<name>/SKILL.md` | Codex project skill layout |
| `claude` | `.claude/skills/<name>/SKILL.md` | Claude Code project skill layout |
| `portable` (default) | `.delivery-lab/skills/<name>/SKILL.md` | Manual reading or another harness |

For Claude Code, run the same preview/apply commands with `--target claude`.
For portable/manual use, choose `--target portable`; open the exported SKILL.md
files and follow the roles yourself. No automatic discovery is claimed for that
layout. `export` accepts the same flags but copies only four skill files:

```sh
node /path/to/agent-delivery-lab/bin/adl.mjs export --workspace /path/to/project --target claude --preview
node /path/to/agent-delivery-lab/bin/adl.mjs export --workspace /path/to/project --target claude --apply
```

`init` also copies six editable starter files into `.delivery-lab/`: handoff,
evidence, manifest, candidate placeholder, expected JSON and actual JSON. Their
placeholders deliberately do not pass verification. `--out docs/delivery` changes
that template directory and the portable skill directory; Codex/Claude skill
locations remain fixed. Generated manifest paths are adjusted to match `--out`.
The tool does not change existing AGENTS.md, CLAUDE.md, settings, hooks or tools.

Canonical `skills/` files use only required `name` and `description` metadata.
The descriptions route by task; role instructions do not launch agents, approve
tools, grant permissions or imply other harness capabilities. Inspect instructions
before allowing a client to discover them. Codex can select skills explicitly by
`$route-work`; Claude Code exposes `/route-work`. Confirm discovery in your own
client; local smoke here only checked directory layouts and exact exported bytes.
See [compatibility facts and official sources](docs/compatibility.md).

## Evidence for an unrelated project

The standalone verifier is generic: it compares supplied JSON outputs against
separately specified expected JSON and binds them to named candidate files. It
never imports candidate code, executes shell commands or infers authorization.

1. Edit the manifest's `version`, `candidates` and `checks` for your domain.
   Include every relevant implementation/check source in `candidates`, not just
   an entry point. Paths are relative to the chosen project, not the manifest.
2. Independently specify expected JSON. Run your own authorized project checks
   and capture actual JSON separately. Record those commands and their observed
   exit codes in the handoff. The CLI does not run them or prove they happened.
3. Create evidence and verify it using the retained explicit executable path:

```sh
node /path/to/agent-delivery-lab/bin/adl.mjs record --workspace /path/to/project --manifest .delivery-lab/manifest.json > /path/to/project/.delivery-lab/evidence.json
node /path/to/agent-delivery-lab/bin/adl.mjs verify --workspace /path/to/project --manifest .delivery-lab/manifest.json --evidence .delivery-lab/evidence.json
```

`record` prints JSON to stdout; shell redirection is your explicit local output
choice and can replace an existing evidence file. Do not redirect onto a manifest,
candidate or fixture. `verify` is read-only, returning PASS (exit 0) or BLOCKED
(exit 1). `record` exits 1 for failed comparisons but still prints their evidence.
Usage, schema and I/O errors in other commands exit 2. Help exits 0.

Example manifest for an unrelated text transformation:

```json
{
  "schema": "adl-manifest-v1",
  "version": "text-normalization-v1",
  "candidates": ["src/normalize.js", "test/normalize.test.js"],
  "checks": [
    {"id": "upper-case", "expected": "fixtures/upper.json", "actual": "results/upper.json"}
  ]
}
```

Each check ID must be unique, 1–64 lowercase letters/digits/hyphens. Expected and
actual paths must differ. At most 100 candidate entries and 100 checks; each input
is a regular file of at most 1 MiB. Empty candidate/check lists are rejected.
JSON values compare structurally (object key order is immaterial; array order
matters). Exact byte digests still detect whitespace changes to any bound file.
The record binds manifest bytes/version, verifier/path-checker bytes and every
listed candidate/expected/actual file. Missing, partial, failed, altered or stale
evidence is rejected. Changing even a candidate comment requires a new record.
Only declared files are covered; unlisted dependencies are outside the claim.

For a programmatic caller, import `verify` from the checkout's `lib/verify.mjs`
and await `verify({workspace, manifest: 'manifest.json', evidence: 'evidence.json'})`.
It returns `{status, reason}`. `record` from the same module returns an evidence
object. These APIs do not depend on workshop routes or a Git repository.

**An evidence record is not a trusted attestation.** A matching JSON file can be
fabricated, and a person can edit the verifier, manifest or expectations. Binding
and comparison establish consistency of supplied bytes, not authorship, origin,
behavioral correctness or permission. Never treat untrusted repository documents
or an evidence PASS as authorization to run commands, merge or publish.

## Filesystem boundaries

All CLI-managed writes stay beneath an explicitly chosen existing project root.
`--out`, manifest/evidence paths and manifest entries accept simple slash-separated
relative paths only: no absolute paths, drives, backslashes, empty/dot/parent
segments, URL escaping or shell interpolation. Workspace root can be absolute;
filesystem root and the home directory itself are refused. Symlinked roots,
ancestors and destinations (including dangling links) are refused. Paths with
spaces are supported for the workspace root, not configurable relative paths.
Choose a real project path without symlink ancestors.

All destinations are preflighted before any copying; same bytes are skipped,
conflicts abort the entire plan, and new files use exclusive creation. This is
not a transactional filesystem or hostile-process sandbox: disk failure or a
concurrent writer may leave a partial new install. Stop concurrent modifications,
review remaining files and rerun. Do not run against a directory concurrently
controlled by an attacker. There is no automatic upgrade, deletion or uninstall;
manually remove only the listed exported files you no longer need.

## Workshop demonstration

The independently specified `fixtures/workshop-v1.json` starts with capacity two,
two active reservations and one waitlisted attendee. Cancel one reservation and
promote the waiting attendee once. Replay must leave the entire state unchanged.
`candidates/bad.mjs` passes the happy path then adds a spurious free place on replay.
`candidates/corrected.mjs` guards the transition and derives capacity, passing both.
`lib/evidence.mjs` is a separate, trusted local demo runner that reruns those toy
modules; unlike generic `lib/verify.mjs`, it executes JavaScript. Do not supply
untrusted code to the demo runner. `examples/` contains its real deterministic
local records, without claims of independent model review or live agent work.

Expected demo: 3/4 domain checks pass, 1 intentional failure; corrected gate PASS,
bad/missing/incomplete/cross-candidate gates BLOCKED. Demo exits zero because the
intentional failure is asserted by the test suite, not an unexplained regression.

## Validation and governance

`npm test` exercises 36 tests, including safe writes, exact reruns, conflicts,
traversal/symlinks and unrelated-project evidence. `npm run smoke` tests all three
export layouts and CLI record/verify exit codes in new consumer folders.
The final archive was extracted and tested on Linux with Node 24.22.3/npm 11.19.1.
Node 22+ is the intended runtime; no live Codex/Claude client, macOS/Windows,
GitHub-hosted workflow or real external integration was tested in this staging
build. See [validation](docs/validation.md). No Git or agent is needed for the demo.

Contribute through [fork PRs](CONTRIBUTING.md). Only @afurm merges; no self-approval
or automatic merge. [CODEOWNERS](.github/CODEOWNERS) and these documents request a
workflow but cannot enforce branch protection. The owner must configure and verify
GitHub rules separately. The staged Actions workflow has read-only contents access,
no secrets, no publishing and no merge capability. [Security](SECURITY.md),
[conduct](CODE_OF_CONDUCT.md), [changes](CHANGELOG.md), [MIT license](LICENSE).
