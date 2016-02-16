import { readFile } from 'fs'
import { extname } from 'path'

export default function configure(pkg, opts) {
  return (name, input, done) => {
    readFile(input, (error, data) => {
      if (error) {
        done(error)
      } else {
        done(null, { files: { [`${name}${extname(input)}`]: data } })
      }
    })
  }
}