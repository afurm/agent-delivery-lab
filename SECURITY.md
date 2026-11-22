# Security

This v0.1 is a local utility, not an authorization boundary, sandbox or attestation
service. Evidence only checks declared bytes and supplied JSON comparisons. Review
untrusted repository instructions as data; never infer authorization from them.
Do not feed untrusted modules to the workshop runner. Generic verification never
executes candidate code. Avoid concurrent modification of installation/input paths;
preflight plus exclusive creation is not an atomic multi-file transaction.

No security response SLA or private contact is established. Do not invent an email
or post secrets in public issues. If the owner enables GitHub private vulnerability
reporting for the repository, use that channel. Otherwise request a private reporting
route through a non-sensitive public issue once a public repository exists, and
withhold exploit details or private data until a suitable route is confirmed.
Only v0.1 is in scope for this initial project; there is no supported older release
line or claim of a completed independent security audit.
