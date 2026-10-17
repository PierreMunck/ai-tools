import os from 'node:os'
import path from 'node:path'
import { parseArgs } from 'node:util'

import { hosts } from './hosts/index.mjs'
import { install } from './install.mjs'
import { createReport } from './report.mjs'
import { readToolbox } from './toolbox.mjs'

const HELP = `ai-tools — install this toolbox into your AI coding assistants

Usage
  ai-tools install [--host <names>] [--scope user|project] [--dir <path>]
  ai-tools list

Options
  --host    comma-separated: claude, codex, vibe — or "all"
            (default: every host whose config directory exists)
  --scope   user: ~/.claude, ~/.codex, ~/.vibe, ~/.agents   (default)
            project: .claude/, .codex/, .vibe/, .agents/ under --dir
  --dir     project directory for --scope project (default: cwd)
  -h, --help

Running install again is the way to update: it is idempotent.
`

export async function main(
  argv,
  { home = os.homedir(), cwd = process.cwd(), env = process.env, out = process.stdout } = {},
) {
  let values
  let positionals
  try {
    ;({ values, positionals } = parseArgs({
      args: argv,
      allowPositionals: true,
      options: {
        host: { type: 'string' },
        scope: { type: 'string', default: 'user' },
        dir: { type: 'string' },
        help: { type: 'boolean', short: 'h' },
      },
    }))
  } catch (error) {
    out.write(`${error.message}\n\n${HELP}`)
    return 1
  }

  const [command] = positionals
  if (values.help || !command) {
    out.write(HELP)
    return 0
  }

  const toolbox = readToolbox()

  if (command === 'list') {
    out.write(describe(toolbox))
    return 0
  }

  if (command === 'install') {
    const report = createReport(out, home)
    if (!['user', 'project'].includes(values.scope)) {
      report.fail('scope', `expected "user" or "project", got "${values.scope}"`)
      return 1
    }
    const hostNames = pickHosts(values.host, { home, env }, report)
    if (!hostNames) return 1

    install({
      toolbox,
      hostNames,
      scope: values.scope,
      dir: path.resolve(cwd, values.dir ?? '.'),
      home,
      env,
      report,
    })
    return report.failed ? 1 : 0
  }

  out.write(`unknown command "${command}"\n\n${HELP}`)
  return 1
}

function pickHosts(flag, ctx, report) {
  if (flag === 'all') return Object.keys(hosts)
  if (flag) {
    const names = flag.split(',').map((s) => s.trim())
    const unknown = names.filter((n) => !hosts[n])
    if (unknown.length) {
      report.fail('host', `unknown host ${unknown.join(', ')} — pick from ${Object.keys(hosts).join(', ')}`)
      return null
    }
    return names
  }
  const detected = Object.values(hosts)
    .filter((h) => h.detect(ctx))
    .map((h) => h.name)
  if (!detected.length) {
    report.fail('host', 'no AI tool config found in your home — pass --host claude,codex,vibe or --host all')
    return null
  }
  report.info('host', `detected ${detected.join(', ')}`)
  return detected
}

function describe({ skills, agents, hooks }) {
  const lines = []
  lines.push(`Skills (${skills.length})`)
  for (const s of skills) lines.push(`  ${s.name.padEnd(24)} ${s.description}`)
  lines.push('', `Agents (${agents.length})`)
  for (const a of agents) lines.push(`  ${a.name.padEnd(24)} ${a.description}`)
  const entries = Object.entries(hooks).flatMap(([event, groups]) =>
    groups.flatMap((g) => (g.hooks ?? []).map((h) => ({ event, matcher: g.matcher, command: h.command }))),
  )
  lines.push('', `Hooks (${entries.length})`)
  for (const h of entries) {
    lines.push(`  ${h.event.padEnd(16)} ${(h.matcher ?? '*').padEnd(12)} ${h.command}`)
  }
  return `${lines.join('\n')}\n`
}
