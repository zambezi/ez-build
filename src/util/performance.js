import { val } from 'funkis'

export async function timed(proc) {
  const start = process.hrtime()
  const result = await Promise.resolve(val(proc))
  const duration = process.hrtime(start)

  duration.ns = duration[0] * 1e9 + duration[1]
  duration.ms = duration.ns / 1e6
  duration.s  = duration.ns / 1e9

  return { result, duration }
}