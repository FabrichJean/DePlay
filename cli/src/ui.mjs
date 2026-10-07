import { createInterface } from 'node:readline/promises'

const useColor = process.stdout.isTTY && !process.env.NO_COLOR
const paint = (code) => (text) => (useColor ? `\x1b[${code}m${text}\x1b[0m` : String(text))

export const c = {
  bold: paint('1'),
  dim: paint('2'),
  red: paint('31'),
  green: paint('32'),
  yellow: paint('33'),
  blue: paint('34'),
  cyan: paint('36'),
}

export const log = (text = '') => console.log(text ? `  ${text}` : '')
export const ok = (text) => log(`${c.green('✔')} ${text}`)
export const warn = (text) => log(`${c.yellow('!')} ${text}`)
export const step = (text) => log(`${c.blue('›')} ${text}`)

export const interactive = Boolean(process.stdin.isTTY && process.stdout.isTTY)

export async function ask(question, fallback = '') {
  const rl = createInterface({ input: process.stdin, output: process.stdout })
  try {
    const hint = fallback ? c.dim(` (${fallback})`) : ''
    const answer = (await rl.question(`  ${c.cyan('?')} ${question}${hint} `)).trim()
    return answer || fallback
  } finally {
    rl.close()
  }
}

export async function confirm(question, fallback = true) {
  const answer = (await ask(`${question} ${c.dim(fallback ? '[Y/n]' : '[y/N]')}`)).toLowerCase()
  if (!answer) return fallback
  return answer.startsWith('y') || answer.startsWith('o')
}

export function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
