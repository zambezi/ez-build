import { readFile } from 'mz/fs'
import { extname } from 'path'

export default function configure(pkg, opts) {
  return async function process(name, input) {
    let data = await readFile(input)
    return { files: { [`${name}${extname(input)}`]: data } }
  }
}