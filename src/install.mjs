import { cpSync, existsSync, rmSync } from 'node:fs'
import path from 'node:path'

import { countHooks } from './hooks.mjs'
import { hosts } from './hosts/index.mjs'

const PARTS = ['skills', 'agents', 'hooks']

export function install({ toolbox, hostNames, scope, dir, home, env = process.env, report }) {
  // One copy of the toolbox that outlives the npx cache; every host then points at it.
  const installRoot = path.join(scope === 'user' ? home : dir, '.ai-tools')
  for (const part of PARTS) {
    const source = path.join(toolbox.root, part)
    const target = path.join(installRoot, part)
    rmSync(target, { recursive: true, force: true })
    if (existsSync(source)) {
      cpSync(source, target, { recursive: true, filter: (src) => !src.endsWith('.test.mjs') })
    }
  }
  report.ok(
    'toolbox',
    `${toolbox.skills.length} skills, ${toolbox.agents.length} agents, ${countHooks(toolbox.hooks)} hooks → ${installRoot}`,
  )

  const ctx = { toolbox, installRoot, scope, dir, home, env, report }
  for (const name of hostNames) hosts[name].install(ctx)
  return installRoot
}
