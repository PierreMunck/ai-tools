import { existsSync } from 'node:fs'
import path from 'node:path'

import { linkAll, readJson, writeGenerated, writeJson } from '../fs.mjs'
import { countHooks, mergeHooks, resolveHooks } from '../hooks.mjs'
import { tomlMultiline, tomlTable } from '../toml.mjs'

// Codex reads skills from `.agents/skills` (shared with Vibe at project scope), custom
// agents as TOML under `$CODEX_HOME/agents`, and hooks from `$CODEX_HOME/hooks.json` —
// the same schema as Claude Code's, so the manifest is merged in verbatim.
export const codex = {
  name: 'codex',

  detect: ({ home, env }) => existsSync(configDir({ home, env })),

  install(ctx) {
    const { toolbox, installRoot, scope, dir, home, report } = ctx
    const root = scope === 'user' ? configDir(ctx) : path.join(dir, '.codex')
    const skillsDir = path.join(scope === 'user' ? home : dir, '.agents', 'skills')

    linkAll(report, 'codex', 'skills', skillsDir,
      toolbox.skills.map((s) => [s.name, path.join(installRoot, 'skills', s.name)]))

    let written = 0
    for (const agent of toolbox.agents) {
      const body = tomlTable({
        name: agent.name,
        description: agent.description,
        developer_instructions: tomlMultiline(agent.body),
      })
      if (writeGenerated(report, 'codex', path.join(root, 'agents', `${agent.name}.toml`), body)) written += 1
    }
    if (toolbox.agents.length) report.ok('codex', `agents: ${written} written → ${path.join(root, 'agents')}`)

    const file = path.join(root, 'hooks.json')
    const current = readJson(file, {})
    const hooks = mergeHooks(current.hooks, resolveHooks(toolbox.hooks, installRoot))
    writeJson(file, { ...current, hooks })
    report.ok('codex', `hooks: ${countHooks(toolbox.hooks)} declared → ${file}`)
  },
}

function configDir({ home, env }) {
  return env.CODEX_HOME ?? path.join(home, '.codex')
}
