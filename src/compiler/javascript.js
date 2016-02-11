import { transformFile } from 'babel-core'
import { then } from '../util/async'
import { debug } from '../util/stdio'
import { default as es2015 } from 'babel-preset-es2015'
import { default as amd } from 'babel-plugin-transform-es2015-modules-amd'

export default function init(opts, pkg) {
  return (name, file) => {
    let cc = then(transformFile, file,
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

    return cc(({code, map}) => {
      let out =
          { [`${name}.js`]: code
          , [`${name}.js.map`]: JSON.stringify(map)
          }
      
      return out
    })
  }
}