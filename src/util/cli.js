import stdio from './stdio'
import { resolve } from 'path'
import { inspect } from 'util'
import { writeFileSync, unlinkSync } from 'fs'

const sysio = stdio({ debug: !!process.env.DEBUG, format: 'normal' })

const bugs = new Map()
process.on('unhandledRejection', (reason, p) => {
  bugs.set(p, reason)
})
process.on('rejectionHandled', (p) => {
  bugs.delete(p)
})

process.on('exit', code => {
  if (bugs.size) {
    sysio.error(`\n---\n\nYou've found a bug! :o(\n`)
    sysio.error(`Please include the following file with any support request:\n`)

    const log = resolve('./ez-build-debug.log')
    sysio.error(`  ${log}\n\n---`)

    let reasons = []

    reasons.push(`Unhandled rejections: ${bugs.size}\n`)

    for (let [_, reason] of bugs) {
      reasons.push(`Rejection #${reasons.length}:\n${inspect(reason)}\n`)
    }

    writeFileSync(log, reasons.join('\n'))
    process.exit(1)
  } else {
    try { unlinkSync(log) }
    catch (e) { /* Let's not care about errors */ }
  }
})