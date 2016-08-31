import { transformFile } from 'babel-core'
import { default as deferred } from 'thenify'
import { default as compat } from 'babel-plugin-add-module-exports'
import { default as ecmascript } from 'babel-preset-latest'
import { default as umd } from 'babel-plugin-transform-es2015-modules-umd'

const babelrc = process.env.NODE_ENV !== 'test'

export default function configure(pkg, opts) {
  return async function process(name, file) {
    const { es2017
          , modules
          , ['add-module-exports']: addModuleExports
          } = opts.flags

    let presets = [
          ecmascript(null,
            { es2015: { modules }
            , es2016: true
            , es2017: es2017 === true
            }
          )
        ]
      , plugins = []

    if (addModuleExports === true) {
      plugins = [compat]
    }

    let result = await deferred(transformFile)(file,
      { moduleIds: true
      , moduleRoot: opts.lib? `${pkg.name}/${opts.lib}` : pkg.name
      , sourceRoot: opts.src
      , presets: presets
      , plugins: plugins
      , babelrc: babelrc
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
