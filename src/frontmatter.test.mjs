import assert from 'node:assert/strict'
import { test } from 'node:test'

import { parseFrontmatter } from './frontmatter.mjs'

test('splits frontmatter scalars from the body', () => {
  const { data, body } = parseFrontmatter('---\nname: x\ndescription: "Does y: well"\ntools: Read, Bash\n---\n\nBody here\n')
  assert.deepEqual(data, { name: 'x', description: 'Does y: well', tools: 'Read, Bash' })
  assert.equal(body.trim(), 'Body here')
})

test('a file without frontmatter is all body', () => {
  assert.deepEqual(parseFrontmatter('just text'), { data: {}, body: 'just text' })
})
