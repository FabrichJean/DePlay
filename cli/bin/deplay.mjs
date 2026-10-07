#!/usr/bin/env node
import { main } from '../src/cli.mjs'

main(process.argv.slice(2)).catch((error) => {
  console.error(`\n  ✖ ${error.message}\n`)
  process.exit(1)
})
