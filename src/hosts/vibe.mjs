import { existsSync } from 'node:fs'
import path from 'node:path'

import { linkAll, readText, writeGenerated, writeText } from '../fs.mjs'
import { resolveHooks, scriptName } from '../hooks.mjs'
import { replaceBlock, tomlTable } from '../toml.mjs'

// Mistral Vibe reads skills from `$VIBE_HOME/skills` (user) or `.agents/skills` (project),
// agents as TOML profiles whose prompt lives in `prompts/<id>.md`, and hooks from a
// `hooks.toml` with its own event names — so both are generated from the canonical files.
export const vibe = {
  name: 'vibe',

  detect: ({ home, env }) => existsSync(vibeHome({ home, env })),

  install(ctx) {
    const { toolbox, installRoot, scope, dir, report } = ctx
    const root = scope === 'user' ? vibeHome(ctx) : path.join(dir, '.vibe')
    const skillsDir = scope === 'user' ? path.join(root, 'skills') : path.join(dir, '.agents', 'skills')

    linkAll(report, 'vibe', 'skills', skillsDir,
      toolbox.skills.map((s) => [s.name, path.join(installRoot, 'skills', s.name)]))

    let written = 0
    for (const agent of toolbox.agents) {
      const promptId = `ai-tools-${agent.name}`
      // Vibe documents prompts under `~/.vibe/prompts/`; at project scope they are written
      // beside the profile and may need to be moved there by hand.
      writeText(path.join(root, 'prompts', `${promptId}.md`), `${agent.body}\n`)
      const body = tomlTable({
        agent_type: 'subagent',
        display_name: agent.name,
        description: agent.description,
        system_prompt_id: promptId,
      })
      if (writeGenerated(report, 'vibe', path.join(root, 'agents', `${agent.name}.toml`), body)) written += 1
    }
    if (toolbox.agents.length) report.ok('vibe', `agents: ${written} written → ${path.join(root, 'agents')}`)

    const file = path.join(root, 'hooks.toml')
    const { block, count } = vibeHooksBlock(resolveHooks(toolbox.hooks, installRoot), report)
    writeText(file, replaceBlock(readText(file), block))
    report.ok('vibe', `hooks: ${count} declared → ${file}`)
  },
}

function vibeHome({ home, env }) {
  return env.VIBE_HOME ?? path.join(home, '.vibe')
}

// Claude / Codex event → Vibe hook type. Events with no equivalent are reported and skipped.
export const VIBE_EVENTS = {
  PreToolUse: 'pre_tool',
  PostToolUse: 'post_tool',
  Stop: 'post_agent',
}

export function vibeHooksBlock(hooks, report) {
  const names = new Set()
  let block = ''
  let count = 0
  for (const [event, groups] of Object.entries(hooks)) {
    const type = VIBE_EVENTS[event]
    if (!type) {
      report?.warn('vibe', `no equivalent of ${event} — skipped`)
      continue
    }
    for (const group of groups) {
      for (const hook of group.hooks ?? []) {
        const name = unique(names, `ai-tools:${type}:${scriptName(hook.command)}`)
        // Vibe matches tool names case-insensitively, so Claude's `Bash` regex also hits `bash`.
        const match = group.matcher && type !== 'post_agent' ? `re:^(${group.matcher})$` : undefined
        block += `\n[[hooks]]\n${tomlTable({ name, type, match, command: hook.command, timeout: hook.timeout })}`
        count += 1
      }
    }
  }
  return { block: block ? `${block}\n` : '', count }
}

function unique(seen, name) {
  let candidate = name
  for (let i = 2; seen.has(candidate); i += 1) candidate = `${name}-${i}`
  seen.add(candidate)
  return candidate
}
