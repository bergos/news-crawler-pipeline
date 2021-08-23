#!/usr/bin/env node

import { exec } from 'child_process'
import { readFile } from 'fs/promises'
import snakeCase from 'lodash/snakeCase.js'

function waitForProc (proc) {
  return new Promise((resolve, reject) => {
    proc.once('close', () => resolve())
    proc.once('error', err => reject(err))
  })
}

async function main () {
  const configs = process.argv.slice(2).filter(a => !a.startsWith('-'))
  const args = process.argv.slice(2).filter(a => a.startsWith('-'))

  for (const config of configs) {
    console.log(`process config: ${config}`)

    const content = JSON.parse((await readFile(config)).toString())
    const vars = Object.entries(content).map(([key, value]) => [snakeCase(key).toUpperCase(), value])
    const varArgs = vars.map(([key, value]) => `"--variable=${key}=${value}"`)
    const baseCommand = 'npx barnard59 run pipelines/feeds.ttl'

    const command = `${baseCommand} ${args.join(' ')} ${varArgs.join(' ')}`

    console.log(command)

    const proc = exec(command)

    proc.stdout.pipe(process.stdout)
    proc.stderr.pipe(process.stderr)

    await waitForProc(proc)
  }
}

main()
