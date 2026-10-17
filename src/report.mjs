import { styleText } from 'node:util'

// One line per step, ai-cli style: a step that was already done is a normal outcome,
// only `fail` makes the run exit non-zero.
export function createReport(out = process.stdout, home = '') {
  let failed = false
  const line = (symbol, color, step, message) => {
    out.write(`${styleText(color, symbol)} ${step.padEnd(8)} ${shorten(message, home)}\n`)
  }
  return {
    ok: (step, message) => line('✔', 'green', step, message),
    info: (step, message) => line('•', 'dim', step, message),
    warn: (step, message) => line('!', 'yellow', step, message),
    fail: (step, message) => {
      failed = true
      line('✖', 'red', step, message)
    },
    get failed() {
      return failed
    },
  }
}

function shorten(message, home) {
  return home ? message.replaceAll(home, '~') : message
}
