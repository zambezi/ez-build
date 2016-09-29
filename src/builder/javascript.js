import { transformFile } from 'babel-core'
import { default as deferred } from 'thenify'
import { default as plugin_compat } from 'babel-plugin-add-module-exports'
import { default as preset_ecmascript } from 'babel-preset-latest'
import { default as preset_react } from 'babel-preset-react'

export default function configure(pkg, opts) {
  return async function process(name, file) {
    let { es2017
        , modules
        , ['add-module-exports']: addModuleExports
        , react
        } = opts.flags

    if (modules === 'ecmascript') {
      modules = false
      addModuleExports = false
    }

    let presets = [
          preset_ecmascript(null,
            { es2015: { modules }
            , es2016: true
            , es2017: es2017 === true
            }
          )
        ]
      , plugins = []

    if (addModuleExports === true) {
      plugins.push(plugin_compat)
    }

    if (react === true) {
      presets.push(preset_react)
    }

    let result = await deferred(transformFile)(file,
      { moduleIds: true
      , moduleRoot: opts.lib? `${pkg.name}/${opts.lib}` : pkg.name
      , sourceRoot: opts.src
      , presets: presets
      , plugins: plugins
      , babelrc: false
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
