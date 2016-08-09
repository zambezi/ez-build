import { basename, extname, join, dirname, relative, resolve } from 'path'
import { put } from './util/file'

const keys = Object.keys

export default function createPipeline(pkg, opts, build) {
  return function pipeline(... files) {
    return files.map(async file => {
      const name = basename(file, extname(file))

      let result = { input: file }
        , output
      
      try {
        output = await build(name, file)
      } catch(error) {
        result.error = error
        return result
      }

      result.messages = output.messages
      result.files = keys(output.files).map(name => {
        let path = join(pkg.resolve(opts.lib), dirname(relative(pkg.resolve(opts.src), resolve(file))))
        let outfile = join(path, name)
        return outfile
      })

      try {
        await Promise.all(keys(output.files).map((name, i) => {
          let outfile = result.files[i]
          return put(outfile, output.files[name])
        }))
      } catch (error) {
        result.error = error
      }

      return result
    })
  }
}