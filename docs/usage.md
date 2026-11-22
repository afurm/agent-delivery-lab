# Installation and export reference

[Start here](../README.md) · [Evidence and filesystem reference](reference.md)


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
See [compatibility facts and official sources](compatibility.md).
