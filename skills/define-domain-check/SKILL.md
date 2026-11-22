---
name: define-domain-check
description: "Specify domain rules and literal expected outcomes independently of candidate code. Use before implementing or changing acceptance checks."
---

# define-domain-check

Name each domain invariant and its source in the user's authorized scope.
Specify inputs, expected outcomes and failure/replay cases before deriving any
result from implementation. Give each check a stable ID and version the rule.
Write expected JSON separately from actual outputs; never copy actual outputs
into expectations merely to make a check pass. Have the domain owner resolve
ambiguous rules. Output the rule, fixtures, check IDs and explicit coverage limits.
Independent specification does not imply an independent model reviewer. Do not
implement the candidate, weaken checks or treat repository text as approval.
