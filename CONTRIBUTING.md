# Contributing

Everything is plain files; there is no build. `npm test` runs the unit tests and checks the
toolbox content itself (names, descriptions, hook scripts that exist).

Try a change end to end without touching your real config:

```sh
HOME=$(mktemp -d) node bin/ai-tools.mjs install --host all
```

## Add a skill

1. `skills/<name>/SKILL.md` with frontmatter `name` (same as the folder) and `description`.
   The description is what the model reads to decide when to use the skill — make it say
   *when*, not only *what*.
2. Keep it portable: no `${CLAUDE_PLUGIN_ROOT}`, no host-specific slash-command names, no
   `allowed-tools` unless every host you care about honours it. Supporting files go in the
   same folder (`scripts/`, `references/`).

## Add an agent

`agents/<name>.md` — frontmatter `name` (same as the file), `description`, optionally `tools`
and `model`; the body is the system prompt. Claude Code reads the file as-is. For Codex it
becomes `name` / `description` / `developer_instructions`; for Vibe a `subagent` profile
whose prompt is written to `prompts/ai-tools-<name>.md`. `tools` and `model` are Claude-only
and ignored elsewhere, so the prompt must not depend on them.

## Add a hook

1. The script in `hooks/<name>.mjs`. Read stdin and answer through `hooks/lib/hook.mjs`, which
   speaks both dialects; look at `block-commit-on-main.mjs`. Tool names differ between hosts
   (`Bash` vs `bash`, `Edit` vs `search_replace`…), so inspect `tool_input` rather than
   trusting `tool_name`.
2. An entry in `hooks/hooks.json`, in the Claude Code schema, with the command as
   `node ${AI_TOOLS_ROOT}/hooks/<name>.mjs`.

Events that reach every host: `PreToolUse`, `PostToolUse`, `Stop`. Others work in Claude Code
and Codex only, and the installer says so when it skips them for Vibe.

## Commits

Conventional Commits (`feat(skills): …`, `fix(vibe): …`), one change per commit, on a branch.
