import { is } from 'funkis'

export async function timed(fn) {
  if (!is(Function, fn)) {
    fn = Promise.resolve.bind(Promise, fn)
  }

  const start = process.hrtime()
  const result = await(fn())
  const duration = process.hrtime(start)
  const ms = (duration[0] * 1e9 + duration[1]) / 1e6

  return { result, duration:
    { ms }
  }
}