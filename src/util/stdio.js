import size from 'window-size'
import { relative } from 'path'
import { Writable } from 'stream'
import createLogger from 'pino'
import strip from 'strip-ansi'
import sourceMapSupport from 'source-map-support'

export default function create({ debug = false, format: type = 'normal' }) {
  const device = createLogger(
    { name: 'ez-build'
    , level: debug? 'trace' : 'info'
    }
  , format(type, process.stdout, process.stderr, debug && process.stderr)
  )

  const console = {}

  console.log = device.info.bind(device)
  console.info = device.info.bind(device)
  console.warn = device.warn.bind(device)
  console.error = device.error.bind(device)
  console.debug = device.debug.bind(device)

  return console
}

const location = /^\s+(?:at) (?:[^\s]+ \()?([^:]+):(\d+):(\d+)\)?$/
const { debug: DEBUG, info: INFO, fatal: FATAL } = createLogger.levels.values

function format(type, stdout, stderr, stddbg) {
  type = type.toLowerCase()

  let stream = new Writable({ write: doWrite })
  stream._write = doWrite

  return stream

  function doWrite(chunk, enc, next) {
    let record

    try {
      record = JSON.parse(chunk)
    } catch (e) {
      return stderr.write(chunk, enc), next()
    }

    const out
      = record.level <= DEBUG ? stddbg
      : record.level <= INFO  ? stdout
      : record.level <= FATAL ? stderr
      : undefined

    if (out) {
      if (type === 'json') {
        out.write(chunk, enc)
      } else {
        out.write(`${record.msg}\n`, 'utf8')
      }
    }

    next()
  }
}