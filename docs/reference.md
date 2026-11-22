# Evidence and filesystem reference

[Quickstart](../README.md) · [Installation options](usage.md) · [Security](../SECURITY.md)

## Record and verify


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
choice and can replace an existing evidence file. Ensure UTF-8: Windows PowerShell
5.1 redirection can produce UTF-16. For a shell-independent first run use the
[consumer walkthrough](../README.md#turn-checks-into-a-handoff), which captures CLI
stdout and writes UTF-8 via Node. Do not redirect onto a manifest,
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
actual paths must refer to distinct files, including case aliases and hard links. At most 100 candidate entries and 100 checks; each input
is a regular file of at most 1 MiB. Empty candidate/check lists are rejected.
JSON values compare structurally (object key order is immaterial; array order
matters). Numbers use exact decimal lexeme normalization: remove insignificant
zeros and adjust a compact integer exponent, without floating-point conversion.
For example, `1`, `1.0` and `10e-1` compare equal; numbers remain distinct from
strings. Signed zero remains distinct (`-0` differs from `0`). Numeric tokens are
limited to 4,096 characters; longer tokens or runtimes lacking numeric source
text fail closed. Node 22.0.0 exposes the required JSON reviver source. Exponents
are never expanded into zero-filled strings. JSON parsing otherwise retains
standard semantics, including last-value-wins duplicate object keys.

Exact byte digests still detect whitespace changes to any bound file.
Existing evidence must be recorded again after upgrading because verifier and
path-checker bindings change. The evidence schema is unchanged.

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
Choose a real project path without symlink ancestors. Expected/actual identity
is checked with device/inode metadata from the same open handles used to read
bytes; unavailable (zero inode) identity fails closed. Host identity metadata is
not written into portable evidence.

All destinations are preflighted before any copying; same bytes are skipped,
conflicts abort the entire plan, and new files use exclusive creation. This is
not a transactional filesystem or hostile-process sandbox: disk failure or a
concurrent writer may leave a partial new install. Stop concurrent modifications,
review remaining files and rerun. Do not run against a directory concurrently
controlled by an attacker. There is no automatic upgrade, deletion or uninstall;
manually remove only the listed exported files you no longer need.
