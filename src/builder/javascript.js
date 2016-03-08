import { transformFile } from 'babel-core'
import { debug } from '../util/stdio'
import { default as es2015 } from 'babel-preset-es2015'
import { default as amd } from 'babel-plugin-transform-es2015-modules-amd'

export default function configure(pkg, opts) {
  return (name, file, done) => {
    transformFile(file
    , { moduleIds: true
      , moduleRoot: `${pkg.name}/${opts.lib}`
      , sourceRoot: opts.src
      , presets: [es2015]
      , plugins: [amd]
      , babelrc: true
      , sourceMaps: !!opts.debug
      , sourceFileName: file
      , sourceMapTarget: file
      }
    , (error, result) => {
        if (error) {
          done(error)
        } else {
          let output = { files: { [`${name}.js`]: result.code } }

          if (opts.debug) {
            output.files[`${name}.js`] += `\n//# sourceMappingURL=${name}.js.map`
            output.files[`${name}.js.map`] = JSON.stringify(result.map)
          }

          done(null, output)
        }
      }
    )
  }
}