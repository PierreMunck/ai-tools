# ai-tools

My skills, agents and hooks for AI coding assistants, kept in one place and installed into
whichever one I happen to use: **Claude Code**, **OpenAI Codex** or **Mistral Vibe**.

Skills follow the [Agent Skills](https://agentskills.io) standard and work everywhere as-is.
Agents and hooks are authored once, in one format, and the installer converts them to what
each host reads.

## Install

```sh
npx @pierremunck/ai-tools install
```

That detects the assistants installed on the machine and wires the toolbox into each one at
**user scope**. Run it again to update: it is idempotent and never overwrites a file it did
not create. Options:

```sh
npx @pierremunck/ai-tools install --host claude,vibe       # pick hosts (or --host all)
npx @pierremunck/ai-tools install --scope project          # into the current repo instead
npx @pierremunck/ai-tools list                             # what the toolbox contains
```

Not published to npm yet? `npx github:PierreMunck/ai-tools install` works the same way.

## What lands where

The toolbox is copied once to `~/.ai-tools/` (or `<repo>/.ai-tools/` with `--scope project`),
so it outlives the npx cache. Each host is then pointed at that copy:

|  | Claude Code | Codex | Mistral Vibe |
| --- | --- | --- | --- |
| Skills | symlinks in `~/.claude/skills/` | symlinks in `~/.agents/skills/` | symlinks in `~/.vibe/skills/` |
| Agents | symlinks in `~/.claude/agents/` | generated TOML in `~/.codex/agents/` | generated TOML in `~/.vibe/agents/` + prompt in `~/.vibe/prompts/` |
| Hooks | merged into `~/.claude/settings.json` | merged into `~/.codex/hooks.json` | a marked block in `~/.vibe/hooks.toml` |

At project scope the same layout sits under `.claude/`, `.codex/`, `.vibe/` and `.agents/` in
the repo (Codex and Vibe share `.agents/skills/`). `CLAUDE_CONFIG_DIR`, `CODEX_HOME` and
`VIBE_HOME` are honoured.

Hooks are declared in the Claude Code / Codex schema, which the two share. For Vibe the
events are translated — `PreToolUse → pre_tool`, `PostToolUse → post_tool`,
`Stop → post_agent` — and anything else is skipped with a warning. Hook scripts answer in
whichever dialect called them, through [`hooks/lib/hook.mjs`](hooks/lib/hook.mjs).

## Layout

```
skills/<name>/SKILL.md   one folder per skill — portable, no host-specific fields
agents/<name>.md         frontmatter (name, description, tools, model) + the prompt
hooks/hooks.json         the manifest; commands reference scripts via ${AI_TOOLS_ROOT}
hooks/*.mjs              hook scripts, sharing hooks/lib/hook.mjs
src/                     the installer: one adapter per host under src/hosts/
```

Zero dependencies, Node ≥ 20.11. See [CONTRIBUTING.md](CONTRIBUTING.md) to add something.
