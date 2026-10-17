import { existsSync } from 'node:fs'
import path from 'node:path'

import { linkAll, readJson, writeJson } from '../fs.mjs'
import { countHooks, mergeHooks, resolveHooks } from '../hooks.mjs'

// Claude Code reads skills, agents and hooks from `~/.claude` (user) or `.claude/` (project).
// Agents are authored in its own markdown format, so skills and agents are symlinked as-is;
// hooks are merged into `settings.json`, next to whatever the user already has there.
export const claude = {
  name: 'claude',

  detect: ({ home, env }) => existsSync(configDir({ home, env })),

  install(ctx) {
    const { toolbox, installRoot, scope, dir, report } = ctx
    const root = scope === 'user' ? configDir(ctx) : path.join(dir, '.claude')

    linkAll(report, 'claude', 'skills', path.join(root, 'skills'),
      toolbox.skills.map((s) => [s.name, path.join(installRoot, 'skills', s.name)]))
    linkAll(report, 'claude', 'agents', path.join(root, 'agents'),
      toolbox.agents.map((a) => [`${a.name}.md`, path.join(installRoot, 'agents', path.basename(a.file))]))

    const file = path.join(root, 'settings.json')
    const settings = readJson(file, {})
    const hooks = mergeHooks(settings.hooks, resolveHooks(toolbox.hooks, installRoot))
    if (Object.keys(hooks).length) settings.hooks = hooks
    else delete settings.hooks
    writeJson(file, settings)
    report.ok('claude', `hooks: ${countHooks(toolbox.hooks)} declared → ${file}`)
  },
}

function configDir({ home, env }) {
  return env.CLAUDE_CONFIG_DIR ?? path.join(home, '.claude')
}
