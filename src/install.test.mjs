import assert from 'node:assert/strict'
import { existsSync, lstatSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'

import { main } from './cli.mjs'
import { readToolbox } from './toolbox.mjs'

const toolbox = readToolbox()
const sink = () => {
  const lines = []
  return { write: (s) => lines.push(s), lines }
}

function run(argv, home) {
  const out = sink()
  const code = main(argv, { home, cwd: home, env: {}, out })
  return { code, output: out.lines.join('') }
}

test('install --host all --scope user wires every host and is idempotent', async () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'ai-tools-'))
  const skill = toolbox.skills[0].name
  const agent = toolbox.agents[0].name

  const first = run(['install', '--host', 'all'], home)
  assert.equal(await first.code, 0, first.output)

  // Skills are symlinks into the installed copy, for every host.
  for (const dir of ['.claude/skills', '.agents/skills', '.vibe/skills']) {
    const link = path.join(home, dir, skill)
    assert.ok(lstatSync(link).isSymbolicLink(), `${dir}/${skill} should be a symlink`)
    assert.ok(existsSync(path.join(link, 'SKILL.md')), `${dir}/${skill} should resolve`)
  }

  // Agents: Claude links the markdown, Codex and Vibe get generated TOML.
  assert.ok(lstatSync(path.join(home, '.claude/agents', `${agent}.md`)).isSymbolicLink())
  assert.match(readFileSync(path.join(home, '.codex/agents', `${agent}.toml`), 'utf8'), /developer_instructions = """/)
  assert.match(readFileSync(path.join(home, '.vibe/agents', `${agent}.toml`), 'utf8'), /agent_type = "subagent"/)
  assert.ok(existsSync(path.join(home, '.vibe/prompts', `ai-tools-${agent}.md`)))

  // Hooks: merged JSON for Claude and Codex, a marked TOML block for Vibe.
  const claude = JSON.parse(readFileSync(path.join(home, '.claude/settings.json'), 'utf8'))
  assert.equal(claude.hooks.PreToolUse[0].hooks[0].command, `node ${home}/.ai-tools/hooks/block-commit-on-main.mjs`)
  const codex = JSON.parse(readFileSync(path.join(home, '.codex/hooks.json'), 'utf8'))
  assert.deepEqual(codex.hooks, claude.hooks)
  assert.match(readFileSync(path.join(home, '.vibe/hooks.toml'), 'utf8'), /type = "pre_tool"/)

  const second = run(['install', '--host', 'all'], home)
  assert.equal(await second.code, 0, second.output)
  assert.match(second.output, /skills: 1 kept/)
  assert.doesNotMatch(second.output, /linked/)
  assert.deepEqual(JSON.parse(readFileSync(path.join(home, '.claude/settings.json'), 'utf8')), claude)
})

test('install leaves the user’s own files alone', async () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'ai-tools-'))
  const skill = toolbox.skills[0].name
  writeFileSync(path.join(home, 'mine.toml'), '')
  const { mkdirSync } = await import('node:fs')
  mkdirSync(path.join(home, '.claude/skills', skill), { recursive: true })
  writeFileSync(path.join(home, '.claude/settings.json'), JSON.stringify({ permissions: { allow: ['Bash(ls)'] } }))

  const { code, output } = run(['install', '--host', 'claude'], home)
  assert.equal(await code, 0, output)
  assert.match(output, /is not ours — left alone/)
  assert.ok(!lstatSync(path.join(home, '.claude/skills', skill)).isSymbolicLink())
  const settings = JSON.parse(readFileSync(path.join(home, '.claude/settings.json'), 'utf8'))
  assert.deepEqual(settings.permissions, { allow: ['Bash(ls)'] })
  assert.ok(settings.hooks.PreToolUse)
})

test('install --scope project writes under the project directory', async () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'ai-tools-'))
  const { code, output } = run(['install', '--host', 'codex,vibe', '--scope', 'project', '--dir', 'repo'], home)
  assert.equal(await code, 0, output)
  assert.ok(existsSync(path.join(home, 'repo/.ai-tools/hooks/hooks.json')))
  assert.ok(lstatSync(path.join(home, 'repo/.agents/skills', toolbox.skills[0].name)).isSymbolicLink())
  assert.ok(existsSync(path.join(home, 'repo/.codex/hooks.json')))
  assert.ok(existsSync(path.join(home, 'repo/.vibe/hooks.toml')))
  assert.ok(!existsSync(path.join(home, '.ai-tools')))
})

test('install fails cleanly on an unknown host or when nothing is detected', async () => {
  const home = mkdtempSync(path.join(os.tmpdir(), 'ai-tools-'))
  const unknown = run(['install', '--host', 'cursor'], home)
  assert.equal(await unknown.code, 1)
  assert.match(unknown.output, /unknown host cursor/)
  const none = run(['install'], home)
  assert.equal(await none.code, 1)
  assert.match(none.output, /no AI tool config found/)
})

test('list prints the toolbox', async () => {
  const { code, output } = run(['list'], os.tmpdir())
  assert.equal(await code, 0)
  assert.match(output, new RegExp(`Skills \\(${toolbox.skills.length}\\)`))
  assert.match(output, /PreToolUse/)
})
