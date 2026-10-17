import assert from 'node:assert/strict'
import { existsSync } from 'node:fs'
import path from 'node:path'
import { test } from 'node:test'

import { ROOT_PLACEHOLDER } from './hooks.mjs'
import { readToolbox } from './toolbox.mjs'

// Guards the content of this repo, so a broken skill or hook is caught before install.
const toolbox = readToolbox()

test('every skill has a SKILL.md whose name matches its folder and has a description', () => {
  for (const skill of toolbox.skills) {
    assert.ok(existsSync(path.join(skill.dir, 'SKILL.md')), `${skill.name}: missing SKILL.md`)
    assert.equal(skill.frontmatter.name, skill.name, `${skill.name}: frontmatter name must match the folder`)
    assert.ok(skill.description, `${skill.name}: missing description`)
  }
})

test('every agent has a name matching its file and a description', () => {
  for (const agent of toolbox.agents) {
    assert.equal(agent.frontmatter.name, path.basename(agent.file, '.md'), `${agent.file}: name must match the file`)
    assert.ok(agent.description, `${agent.name}: missing description`)
    assert.ok(agent.body, `${agent.name}: empty prompt`)
  }
})

test('every hook command goes through the placeholder and names an existing script', () => {
  for (const [event, groups] of Object.entries(toolbox.hooks)) {
    for (const group of groups) {
      for (const hook of group.hooks ?? []) {
        assert.equal(hook.type, 'command', `${event}: only "command" hooks are portable`)
        assert.ok(hook.command.includes(ROOT_PLACEHOLDER), `${event}: command must use ${ROOT_PLACEHOLDER}`)
        const script = hook.command.split(/\s+/).find((t) => t.includes(ROOT_PLACEHOLDER))
        const file = script.replace(ROOT_PLACEHOLDER, toolbox.root)
        assert.ok(existsSync(file), `${event}: ${file} does not exist`)
      }
    }
  }
})
