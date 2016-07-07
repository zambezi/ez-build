import postcss from 'postcss'
import cssimport from 'postcss-import'
import cssnext from 'postcss-cssnext'
import { slurp } from '../util/file'
import { relative } from 'path'

export default function configure(pkg, opts) {
  const cc = postcss([cssimport, cssnext])
      , map = opts.debug? { inline: false } : false

  return async function process(name, file) {
    let data = await slurp(file)
    const to = `${opts.lib}/${relative(opts.src, file)}`
    let result = await cc.process(data, { from: file, to, map })
    let output =
        { messages: result.messages
        , files: { [`${name}.css`]: result.css }
        }

    if (opts.debug) {
      output.files[`${name}.css.map`] = JSON.stringify(result.map)
    }

    return output
  }
}