import size from 'window-size'
import { relative } from 'path'
import { Writable } from 'stream'
import { createLogger, INFO, FATAL, DEBUG } from 'bunyan'
import strip from 'strip-ansi'

export default function create({ debug = false, format: type = 'normal' }) {
  const device = createLogger(
    { name: 'ez-build'
    , level: debug? 'trace' : 'info'
    , src: !!debug
    , stream: format(type, process.stdout, process.stderr, debug && process.stderr)
    }
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

function format(type, stdout, stderr, stddbg) {
  const write = writers[type.toLowerCase()] || writers.normal

  let stream = new Writable({ write: doWrite })
  stream._write = doWrite

  return stream

  function doWrite(chunk, enc, next) {
    let record

    try {
      record = JSON.parse(chunk)
    } catch(e) {
      return stderr.write(chunk, enc), next()
    }

    const out
      = record.level <= DEBUG ? stddbg
      : record.level <= INFO  ? stdout
      : record.level <= FATAL ? stderr
      : undefined

    if (out) {
      write(out, record)
    }

    next()
  }
}

const writers =
{ json(out, record, enc) {
    out.write(`${JSON.stringify(record)}\n`, 'utf8')
  }
, normal(out, record, enc) {
    let msg = record.msg

    if (record.src) {
      let file = relative(`${__dirname}/../../`, record.src.file)
        , line = record.src.line
        , last = strip(msg).split('\n').slice(-1)[0]
        , src = `${file}:${line}`
        , pre = record.level <= DEBUG? '# ' : ''
        , pad = Math.max(0, size.width - last.length - src.length - pre.length - 2)

      msg = `${pre}${msg} ${' '.repeat(pad)} ${src}`
    }

    out.write(`${msg}\n`, 'utf8')
  }
}