// Just enough TOML to emit what Codex and Vibe read. Nothing is parsed back: generated
// files are rewritten whole, and the Vibe hooks file is edited through a marked block.

export function tomlString(value) {
  return JSON.stringify(String(value))
}

export function tomlMultiline(value) {
  const escaped = String(value).replaceAll('\\', '\\\\').replaceAll('"""', '\\"""')
  return `"""\n${escaped}\n"""`
}

export function tomlTable(pairs) {
  return `${Object.entries(pairs)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k} = ${typeof v === 'number' ? v : v.startsWith('"""') ? v : tomlString(v)}`)
    .join('\n')}\n`
}

const BEGIN = '# >>> ai-tools (generated — rerun `ai-tools install` to refresh)'
const END = '# <<< ai-tools'

// Replaces our block if present, otherwise appends it. The rest of the file is untouched.
export function replaceBlock(text, block) {
  const pattern = /# >>> ai-tools[^\n]*\n[\s\S]*?# <<< ai-tools\n?/
  const wrapped = `${BEGIN}\n${block}${END}\n`
  if (pattern.test(text)) return text.replace(pattern, wrapped)
  const head = text.trimEnd()
  return head ? `${head}\n\n${wrapped}` : wrapped
}
