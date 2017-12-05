import postcss from 'postcss'
import { readFileSync as slurp } from 'fs'
import { resolve, isAbsolute } from 'path'
import rebaseUrl from 'postcss-url'

export default function rebase(pkg, filename) {
  return postcss([
      rebaseUrl({
        url: (asset, dir, options, decl, warn, result) => {
          const { url, pathname, search, hash } = asset

          // Urls like "data:", "http:", or "https" do not have a pathname according to postcss-url
          if (!pathname || isAbsolute(pathname)) {
            return url
          }

          const resolvedPath = pkg.relative(resolve(dir.file, pathname)).replace(/\\/g, '/')
          return `${resolvedPath}${search}${hash}`
        }
      })
    ]).process(slurp(filename, 'utf8'), { from: filename }).css
}
