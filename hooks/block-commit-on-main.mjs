// PreToolUse (shell) — refuse `git commit` / `git push` while on main.
import { execSync } from 'node:child_process'

import { deny, readInput } from './lib/hook.mjs'

const input = readInput()
const command = input.tool_input?.command ?? ''

if (/\bgit\s+(commit|push)\b/.test(command)) {
  let branch = ''
  try {
    branch = execSync('git branch --show-current', {
      cwd: input.cwd,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {}

  if (branch === 'main') deny(input, 'No direct commit/push on main — create a branch first (git switch -c …).')
}
