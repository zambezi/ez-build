import { transformFile } from 'babel-core'
import { default as deferred } from 'thenify'
import { debug } from '../util/stdio'
import { default as es2015 } from 'babel-preset-es2015'
import { default as amd } from 'babel-plugin-transform-es2015-modules-amd'

export default function configure(pkg, opts) {
  return async function process(name, file) {
    let result = await deferred(transformFile)(file,
      { moduleIds: true
      , moduleRoot: `${pkg.name}/${opts.lib}`
      , sourceRoot: opts.src
      , presets: [es2015]
      , plugins: [amd]
      , babelrc: true
      , sourceMaps: !!opts.debug
      , sourceFileName: file
      , sourceMapTarget: file
      }
    )

    let output = { files: { [`${name}.js`]: result.code } }

    if (opts.debug) {
      output.files[`${name}.js`] += `\n//# sourceMappingURL=${name}.js.map`
      output.files[`${name}.js.map`] = JSON.stringify(result.map)
    }

    return output
  }
}