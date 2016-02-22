import postcss from 'postcss'
import cssimport from 'postcss-import'
import cssnext from 'postcss-cssnext'
import { readFileSync } from 'fs'
import { relative } from 'path'
import rebaser from 'postcss-assets-rebase'

export default function rebase(filename) {

  console.log(filename)

  return postcss([cssimport, cssnext])
      .use(rebaser({
        assetsPath: "./lib",
        relative: false
      }))
      .process(readFileSync(filename, 'utf8'), { from: 'src/' + filename, to: filename })
}