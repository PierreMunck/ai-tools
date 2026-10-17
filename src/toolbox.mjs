import { existsSync, readdirSync, readFileSync } from 'node:fs'
import path from 'node:path'

import { parseFrontmatter } from './frontmatter.mjs'

// This repo: `skills/`, `agents/` and `hooks/` next to `src/`.
export const packageRoot = path.resolve(import.meta.dirname, '..')

export function readToolbox(root = packageRoot) {
  return { root, skills: readSkills(root), agents: readAgents(root), hooks: readHooks(root) }
}

function readSkills(root) {
  const dir = path.join(root, 'skills')
  return entries(dir)
    .filter((e) => e.isDirectory())
    .map(({ name }) => {
      const file = path.join(dir, name, 'SKILL.md')
      const { data } = existsSync(file) ? parseFrontmatter(readFileSync(file, 'utf8')) : { data: {} }
      return { name, dir: path.join(dir, name), description: data.description ?? '', frontmatter: data }
    })
}

function readAgents(root) {
  const dir = path.join(root, 'agents')
  return entries(dir)
    .filter((e) => e.isFile() && e.name.endsWith('.md'))
    .map(({ name: file }) => {
      const { data, body } = parseFrontmatter(readFileSync(path.join(dir, file), 'utf8'))
      return {
        name: data.name ?? file.slice(0, -3),
        file: path.join(dir, file),
        description: data.description ?? '',
        body: body.trim(),
        frontmatter: data,
      }
    })
}

function readHooks(root) {
  const file = path.join(root, 'hooks', 'hooks.json')
  if (!existsSync(file)) return {}
  return JSON.parse(readFileSync(file, 'utf8')).hooks ?? {}
}

function entries(dir) {
  return existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)) : []
}
