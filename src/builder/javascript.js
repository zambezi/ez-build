import { transformFile } from 'babel-core'
import { default as deferred } from 'thenify'
import { default as compat } from 'babel-plugin-add-module-exports'
import { default as ecmascript } from 'babel-preset-latest'
import { default as umd } from 'babel-plugin-transform-es2015-modules-umd'
import { dirname, resolve, relative, extname } from 'path'

const babelrc = process.env.NODE_ENV !== 'test'

export default function configure(pkg, opts) {
  return async function process(name, file) {
    let presets = []
      , plugins = []

    let { es2017
        , modules
        , ['add-module-exports']: addModuleExports
        } = opts.flags

    if (modules === 'ecmascript') {
      modules = false
      addModuleExports = false
    } else if (modules === 'umd') {
      modules = false
      plugins.push([umd, { exactGlobals: true }])
    }

    presets.push(
      ecmascript(null,
        { es2015: { modules }
        , es2016: true
        , es2017: es2017 === true
        }
      )
    )

    if (addModuleExports === true) {
      plugins.push(compat)
    }

    const moduleRoot = opts.lib? `${pkg.name}/${opts.lib}` : pkg.name

    let result = await deferred(transformFile)(file,
      { moduleIds: true
      , moduleRoot
      , sourceRoot: opts.src
      , presets: presets
      , plugins: plugins
      , babelrc: babelrc
      , sourceMaps: !!opts.debug
      , sourceFileName: file
      , sourceMapTarget: file
      , resolveModuleSource: qualifyImports(opts.src, moduleRoot)
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

function qualifyImports(src, moduleRoot) {
  return (dependency, parent) => {
    if (dependency.startsWith('./') || dependency.startsWith('../')) {
      const path = relative(src, resolve(dirname(parent), dependency)).replace(/\\/g, '/')
      const qualified = `${moduleRoot}/${path}`
      return `${moduleRoot}/${path.replace(/\\/g, '/')}`
    } else {
      return dependency
    }
  }
}
