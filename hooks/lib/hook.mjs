// Shared by every hook script. Reads the JSON the host pipes on stdin and answers in the
// dialect that host understands — Claude Code and Codex share one, Mistral Vibe has its own.
import { readFileSync } from 'node:fs'

export function readInput() {
  try {
    return JSON.parse(readFileSync(0, 'utf8'))
  } catch {
    return {}
  }
}

// Vibe names its events in snake_case (`pre_tool`), Claude and Codex in PascalCase (`PreToolUse`).
export function isVibe(input) {
  return /^[a-z_]+$/.test(input.hook_event_name ?? '')
}

// PreToolUse / pre_tool only: refuse the tool call, with a reason the model gets to read.
export function deny(input, reason) {
  const output = isVibe(input)
    ? { decision: 'deny', reason }
    : {
        hookSpecificOutput: {
          hookEventName: input.hook_event_name,
          permissionDecision: 'deny',
          permissionDecisionReason: reason,
        },
      }
  process.stdout.write(JSON.stringify(output))
}
