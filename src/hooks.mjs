// The canonical manifest is `hooks/hooks.json` in the Claude Code / Codex schema. Commands
// reference scripts through this placeholder; the installer points it at the installed copy.
export const ROOT_PLACEHOLDER = '${AI_TOOLS_ROOT}'

// What identifies one of our entries inside a host config that may also hold the user's own.
const OURS = /[\\/]\.ai-tools[\\/]hooks[\\/]/

export function resolveHooks(hooks, installRoot) {
  const root = JSON.stringify(installRoot).slice(1, -1)
  return JSON.parse(JSON.stringify(hooks).replaceAll(ROOT_PLACEHOLDER, root))
}

export function isOurs(group) {
  return (group.hooks ?? []).some((h) => OURS.test(h.command ?? ''))
}

// Drops our previous entries, keeps everything else, appends the current ones.
export function mergeHooks(existing = {}, ours = {}) {
  const merged = {}
  for (const [event, groups] of Object.entries(existing)) {
    const kept = groups.filter((g) => !isOurs(g))
    if (kept.length) merged[event] = kept
  }
  for (const [event, groups] of Object.entries(ours)) {
    merged[event] = [...(merged[event] ?? []), ...groups]
  }
  return merged
}

export function countHooks(hooks) {
  return Object.values(hooks).reduce((n, groups) => n + groups.reduce((m, g) => m + (g.hooks?.length ?? 0), 0), 0)
}

export function scriptName(command) {
  const token = command.split(/\s+/).find((t) => /\.(m?js|c?js|sh|py)$/.test(t))
  return token ? token.split(/[\\/]/).pop().replace(/\.\w+$/, '') : 'hook'
}
