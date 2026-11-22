# Contributing

Use a fork of the proposed public afurm/agent-delivery-lab repository and a topic
branch in your fork. Open a pull request with a bounded problem, changed behavior,
actual checks and limitations. Do not create contribution branches in the owner's
repository. Never include private code, credentials or real attendee information.

Use Node 22+ with no dependency installation. Run `npm test`, `npm run demo` and
`npm run smoke`. Keep canonical skills in skills/; adapters copy the same bytes.
Preserve intentionally failing demo behavior and separately specified fixtures.
Do not claim live harness testing when only exporter layout checks were run.

Only @afurm decides and performs merges. Contributors and agents must not
self-approve or enable automatic merge. A PR authored by the owner cannot satisfy
an independent-review requirement through owner self-approval; arrange a separate
qualified review or leave it pending according to the owner's actual GitHub rules.

CODEOWNERS requests owner review; it does not enforce it. Before public collaboration,
the owner must independently configure GitHub branch protection/rulesets for the
default branch: required PRs, selected checks and reviews, stale-review handling,
restricted bypass/push access, and disabled force-push/deletion as appropriate.
Confirm effective enforcement in GitHub. This repository does not configure or
prove those settings, and workflow files do not restrict who can click Merge.
No automatic merge, release, package publishing or approval action is provided.
