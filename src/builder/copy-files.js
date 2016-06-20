import { slurp } from '../util/file'
import { extname } from 'path'

export default function configure(pkg, opts) {
  return async function process(name, input) {
    let data = await slurp(input)
    return { files: { [`${name}${extname(input)}`]: data } }
  }
}