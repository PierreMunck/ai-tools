import assert from 'node:assert/strict'
import { test } from 'node:test'

import { vibeHooksBlock } from './hosts/vibe.mjs'
import { replaceBlock, tomlMultiline, tomlTable } from './toml.mjs'

test('tomlTable quotes strings, leaves numbers and multiline blocks alone', () => {
  const out = tomlTable({ name: 'a "b"', timeout: 5, skip: undefined, body: tomlMultiline('x\\y """z') })
  assert.equal(out, 'name = "a \\"b\\""\ntimeout = 5\nbody = """\nx\\\\y \\"""z\n"""\n')
})

test('vibeHooksBlock maps events, converts the matcher and skips unknown events', () => {
  const warnings = []
  const { block, count } = vibeHooksBlock(
    {
      PreToolUse: [{ matcher: 'Bash', hooks: [{ type: 'command', command: 'node /r/hooks/a.mjs', timeout: 30 }] }],
      Stop: [{ hooks: [{ type: 'command', command: 'node /r/hooks/a.mjs' }] }],
      SessionStart: [{ hooks: [{ type: 'command', command: 'node /r/hooks/b.mjs' }] }],
    },
    { warn: (_, m) => warnings.push(m) },
  )
  assert.equal(count, 2)
  assert.match(block, /\[\[hooks\]\]\nname = "ai-tools:pre_tool:a"\ntype = "pre_tool"\nmatch = "re:\^\(Bash\)\$"\ncommand = "node \/r\/hooks\/a.mjs"\ntimeout = 30\n/)
  assert.match(block, /name = "ai-tools:post_agent:a"\ntype = "post_agent"\ncommand/)
  assert.deepEqual(warnings, ['no equivalent of SessionStart — skipped'])
})

test('replaceBlock appends once, then rewrites in place', () => {
  const first = replaceBlock('[[hooks]]\nname = "mine"\n', 'A\n')
  assert.match(first, /^\[\[hooks\]\]\nname = "mine"\n\n# >>> ai-tools[^\n]*\nA\n# <<< ai-tools\n$/)
  const second = replaceBlock(`${first}\n# trailing user note\n`, 'B\n')
  assert.doesNotMatch(second, /\nA\n/)
  assert.match(second, /\nB\n# <<< ai-tools\n\n# trailing user note\n$/)
})
