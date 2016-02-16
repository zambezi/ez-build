import { basename, extname, join, dirname, relative, resolve } from 'path'
import { default as put } from 'output-file-sync'
import { parallel } from 'async'

const keys = Object.keys

export default function createPipeline(pkg, opts, build, progress) {
  const
    { onBuild = noop
    , onError = noop
    } = progress

  return (files, callback) => {
    parallel(
      [].concat(files).map(file => cont => {
        const name = basename(file, extname(file))

        build(name, file, (error, output) => {
          let result = { input: file }
          if (error) {
            result.error = error
            console.log(onError, result)
          } else {
            result.messages = output.messages
            result.files = keys(output.files).map(name => {
              let path = join(pkg.resolve(opts.lib), dirname(relative(pkg.resolve(opts.src), resolve(file))))
              let outfile = join(path, name)

              put(outfile, output.files[name])
              return outfile
            })
            onBuild(result)
          }

          cont(null, result)
        })
      })
    , callback
    )
  }
}

function noop() {}