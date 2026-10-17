import { claude } from './claude.mjs'
import { codex } from './codex.mjs'
import { vibe } from './vibe.mjs'

// Each host adapter: `name`, `detect({ home, env })`, and
// `install({ toolbox, installRoot, scope, dir, home, env, report })`.
export const hosts = Object.fromEntries([claude, codex, vibe].map((h) => [h.name, h]))
