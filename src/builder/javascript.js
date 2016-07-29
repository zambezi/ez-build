import { transformFile } from 'babel-core'
import { default as deferred } from 'thenify'
import { debug } from '../util/stdio'
import { default as es2015 } from 'babel-preset-es2015'
import { default as umd } from 'babel-plugin-transform-es2015-modules-umd'

export default function configure(pkg, opts) {
  return async function process(name, file) {
    let result = await deferred(transformFile)(file,
      { moduleIds: true
      , moduleRoot: opts.lib? `${pkg.name}/${opts.lib}` : pkg.name
      , sourceRoot: opts.src
      , presets: [es2015]
      , plugins: [umd]
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