# Compatibility and source checks

Official documentation consulted on 2026-11-22; documentation-backed layout
compatibility is not live-client certification.

- [OpenAI skills](https://developers.openai.com/codex/skills) redirects to
  [Build skills](https://learn.chatgpt.com/docs/build-skills). Project skills use
  `.agents/skills/<name>/SKILL.md` and required name/description metadata.
- [Claude Code skills](https://code.claude.com/docs/en/skills) documents the project
  `.claude/skills/<name>/SKILL.md` layout and `/skill-name` invocation. Client trust,
  policies and same-name skills can affect discovery. We set no tool permissions,
  execution hooks, subagent settings or client-specific extensions.
- [Agent Skills format](https://agentskills.io/specification) defines matching
  lowercase directory/name metadata (1–64 characters) and a nonempty description
  (at most 1024 characters). All four canonical files satisfy this required-field
  subset, validated by the local test. No external YAML validator was installed.
- [GitHub secure workflows](https://docs.github.com/en/actions/reference/security/secure-use)
  explains least privilege and pinning actions. Staged CI pins official
  [checkout](https://github.com/actions/checkout/commit/11bd71901bbe5b1630ceea73d27597364c9af683)
  and [setup-node](https://github.com/actions/setup-node/commit/49933ea5288caeca8642d1e84afbd3f7d6820020)
  commits. These explicit v4-era pins are deliberate fixed inputs, not a claim of
  latest action versions. Reassess them before enabling CI. Checkout credentials
  are not persisted; no cache, registry authentication or dependency install runs.

Only Linux/Node 24.22.3/npm 11.19.1 execution was observed. Node 22 and 24 appear
in the proposed CI matrix but that workflow has not run on GitHub. No client was
installed, authenticated or launched. No release or repository was created by
this staging task. CLI layout tests do not test agent compliance, model behavior,
GitHub enforcement, concurrent hostile filesystem mutation or other platforms.
