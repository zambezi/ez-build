import { transformFile } from 'babel-core'
import { default as deferred } from 'thenify'
import { default as plugin_compat } from 'babel-plugin-add-module-exports'
import { default as plugin_umd } from '@zambezi/babel-plugin-transform-es2015-modules-umd'
import { default as preset_env } from 'babel-preset-env'
import { default as preset_react } from 'babel-preset-react'
import { default as preset_stage_0 } from 'babel-preset-stage-0'
import { default as preset_stage_1 } from 'babel-preset-stage-1'
import { default as preset_stage_2 } from 'babel-preset-stage-2'
import { default as preset_stage_3 } from 'babel-preset-stage-3'

const assign = Object.assign

export default function configure(pkg, opts) {
  let presets = []
    , plugins = []

  let { modules
      , ['add-module-exports']: addModuleExports
      , react
      , ['es-stage']: stage
      } = opts.flags

  if (modules === 'ecmascript') {
    modules = false
    addModuleExports = false
  } else {
    if (addModuleExports === true) {
      plugins.push(plugin_compat)
    }

    if (modules === 'umd') {
      modules = false
      plugins.push([plugin_umd,
        { exactGlobals: true
        , resolveImports: true
        }
      ])
    }
  }

  let targets = {}

  opts.targetNode && (targets.node = opts.targetNode)
  opts.targetBrowsers && (targets.browsers = opts.targetBrowsers)

  presets.push(
    preset_env(null,
      { debug: !!global.process.env.DEBUG
      , modules
      , targets
      , exclude: ['transform-es2015-modules-umd']
      , useBuiltIns: true
      }
    )
  )

  if (react === true) {
    presets.push(preset_react)
  }

  switch (stage) {
    case 0: presets.push(preset_stage_0); break
    case 1: presets.push(preset_stage_1); break
    case 2: presets.push(preset_stage_2); break
    case 3: presets.push(preset_stage_3); break
    default: break;
  }

  const config = process.config =
    { moduleIds: true
    , moduleRoot: opts.lib? `${pkg.name}/${opts.lib}` : pkg.name
    , sourceRoot: opts.src
    , presets: presets
    , plugins: plugins
    , babelrc: opts.babelrc // Will be false before v1.0.0
    , sourceMaps: !!opts.debug
    }

  return process

  async function process(name, file) {
    const result = await deferred(transformFile)(file,
      assign({}, config,
        { sourceFileName: file
        , sourceMapTarget: file
        }
      )
    )

    const output = { files: { [`${name}.js`]: result.code } }

    if (opts.debug) {
      output.files[`${name}.js`] += `\n//# sourceMappingURL=${name}.js.map`
      output.files[`${name}.js.map`] = JSON.stringify(result.map)
    }

    return output
  }
}