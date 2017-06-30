import postcss from 'postcss'
import cssimport from 'postcss-import'
import cssnext from 'postcss-cssnext'
import cssurl from 'postcss-url'
import { slurp } from '../util/file'
import { relative, isAbsolute } from 'path'

export default function configure(pkg, opts) {
  const cc = postcss([cssimport, cssurl({ url: fixRelativeUrls }), cssnext])
      , map = opts.debug? { inline: false } : false

  return async function process(name, file) {
    let data = await slurp(file)
    const to = `${opts.lib}/${relative(opts.src, file)}`
    let result = await cc.process(data, { from: file, to, map })
    let output =
        { messages: result.messages.map(m => `${m.text} (${m.line}:${m.column})`)
        , files: { [`${name}.css`]: result.css }
        }

    if (opts.debug) {
      output.files[`${name}.css.map`] = JSON.stringify(result.map)
    }

    return output
  }

  function fixRelativeUrls (asset, dir, options, decl, warn, result) {
    const { url, search, hash, pathname, relativePath } = asset

    // Urls like "data:", "http:", or "https" do not have a pathname according to postcss-url
    if (!pathname || isAbsolute(pathname)) {
      return url
    }

    const resolvedPath = relativePath.replace(/\\/g, '/')

    return `${resolvedPath}${search}${hash}`
  }
}
