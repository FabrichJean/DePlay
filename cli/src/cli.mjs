import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { ApiError, createClient } from './api.mjs'
import { DEFAULT_API, clearConfig, loadConfig, saveConfig } from './config.mjs'
import { deploy } from './deploy.mjs'
import { ask, c, formatBytes, interactive, log, ok } from './ui.mjs'

const HELP = `
  ${c.bold('deplay')} — deploy a local website to Deplay

  ${c.bold('Usage')}
    deplay login --token <token>   Save a token created in Settings → CLI tokens
    deplay deploy [folder]         Deploy a folder (default: current folder)
    deplay whoami                  Show the account linked to the token
    deplay logout                  Forget the saved token

  ${c.bold('Deploy options')}
    --name <name>             Project name (first deploy only)
    --preset <preset>         nuxt | next | vite | static (detected from package.json)
    --build-command <cmd>     Override the build command
    --install-command <cmd>   Override the install command
    --output-dir <dir>        Override the output folder
    --new                     Ignore .deplay/ and create a new project
    --no-wait                 Don't follow the build
    -y, --yes                 No questions, use detected values

  ${c.bold('Global options')}
    --api <url>               Deplay URL (default ${DEFAULT_API})
    -h, --help · -v, --version

  ${c.dim('Environment: DEPLAY_TOKEN and DEPLAY_API_URL override the saved config (for CI).')}
  ${c.dim('Exclusions: node_modules, .git and .env files are never sent; add more in .deplayignore.')}
`

const OPTIONS = {
  token: { type: 'string' },
  api: { type: 'string' },
  name: { type: 'string' },
  preset: { type: 'string' },
  'build-command': { type: 'string' },
  'install-command': { type: 'string' },
  'output-dir': { type: 'string' },
  new: { type: 'boolean' },
  'no-wait': { type: 'boolean' },
  yes: { type: 'boolean', short: 'y' },
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
}

export async function main(argv) {
  let parsed
  try {
    parsed = parseArgs({ args: argv, options: OPTIONS, allowPositionals: true })
  } catch (error) {
    throw new Error(`${error.message}\n    Run \`deplay --help\` for usage.`)
  }
  const { values: flags, positionals } = parsed
  const [command, ...rest] = positionals

  if (flags.version) {
    const pkg = JSON.parse(await readFile(new URL('../package.json', import.meta.url), 'utf8'))
    console.log(pkg.version)
    return
  }
  if (flags.help || !command || command === 'help') {
    console.log(HELP)
    return
  }

  const config = await loadConfig()
  if (flags.api) config.api = flags.api.replace(/\/+$/, '')

  switch (command) {
    case 'login':
      return login(flags, config)
    case 'logout':
      await clearConfig()
      log()
      ok('Logged out. The token still exists on Deplay: revoke it in Settings → CLI tokens.')
      log()
      return
    case 'whoami':
      return whoami(config)
    case 'deploy':
      return deploy(rest[0], flags, config)
    default:
      throw new Error(`Unknown command "${command}". Run \`deplay --help\`.`)
  }
}

async function login(flags, config) {
  let token = flags.token
  if (!token && interactive) token = await ask('Paste your token (Settings → CLI tokens):')
  if (!token) throw new Error('Missing token. Usage: deplay login --token <token>')
  if (!token.startsWith('dpl_')) throw new Error('This does not look like a Deplay token (it should start with dpl_).')

  const me = await check({ ...config, token })
  const path = await saveConfig({ token, api: config.api })
  log()
  ok(`Logged in to ${c.bold(config.api)} with token ${c.bold(me.token ?? '')}`)
  log(c.dim(`Saved in ${path}`))
  log()
}

async function whoami(config) {
  if (!config.token) throw new Error('Not logged in. Run `deplay login --token <token>`.')
  const me = await check(config)
  log()
  log(`${c.dim('Server')}    ${config.api}`)
  log(`${c.dim('Token')}     ${me.token ?? c.dim('(environment)')}`)
  log(`${c.dim('Projects')}  ${me.projects}`)
  log(`${c.dim('Storage')}   ${formatBytes(me.storage.used)} / ${formatBytes(me.storage.quota)}`)
  log()
}

async function check(config) {
  try {
    return await createClient(config).whoami()
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      throw new Error('Token rejected: it is invalid or has been revoked.')
    }
    throw error
  }
}
