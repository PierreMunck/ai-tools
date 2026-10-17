import assert from 'node:assert/strict'
import { test } from 'node:test'

import { mergeHooks, resolveHooks, scriptName } from './hooks.mjs'

const ours = {
  PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node /home/me/.ai-tools/hooks/a.mjs' }] }],
}

test('resolveHooks points the placeholder at the install root', () => {
  const resolved = resolveHooks(
    { Stop: [{ hooks: [{ type: 'command', command: 'node ${AI_TOOLS_ROOT}/hooks/a.mjs' }] }] },
    '/home/me/.ai-tools',
  )
  assert.equal(resolved.Stop[0].hooks[0].command, 'node /home/me/.ai-tools/hooks/a.mjs')
})

test('mergeHooks replaces our old entries and keeps the user’s', () => {
  const existing = {
    PreToolUse: [
      { matcher: 'Edit', hooks: [{ type: 'command', command: 'my-own-hook' }] },
      { matcher: 'Bash', hooks: [{ type: 'command', command: 'node /home/me/.ai-tools/hooks/old.mjs' }] },
    ],
    Stop: [{ hooks: [{ type: 'command', command: 'node /home/me/.ai-tools/hooks/gone.mjs' }] }],
  }
  const merged = mergeHooks(existing, ours)
  assert.deepEqual(merged, {
    PreToolUse: [existing.PreToolUse[0], ours.PreToolUse[0]],
  })
})

test('mergeHooks is idempotent', () => {
  assert.deepEqual(mergeHooks(mergeHooks({}, ours), ours), ours)
})

test('scriptName takes the script’s basename', () => {
  assert.equal(scriptName('node /x/.ai-tools/hooks/block-commit-on-main.mjs'), 'block-commit-on-main')
  assert.equal(scriptName('bash /x/hooks/check.sh --fast'), 'check')
  assert.equal(scriptName('echo hi'), 'hook')
})
