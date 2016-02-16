import postcss from 'postcss'
import cssimport from 'postcss-import'
import cssnext from 'postcss-cssnext'
import { readFile } from 'fs'
import { relative } from 'path'

export default function configure(pkg, opts) {
  const cc = postcss([cssimport, cssnext])
      , map = opts.debug? { inline: false } : false

  return (name, file, done) => {
    readFile(file, (error, data) => {
      const to = `${opts.lib}/${relative(opts.src, file)}`
      cc.process(data, { from: file, to, map })
        .then(result => {
          let output =
              { messages: result.messages
              , files: { [`${name}.css`]: result.css }
              }
          
          if (opts.debug) {
            output.files[`${name}.css.map`] = JSON.stringify(result.map)
          }

          done(null, output)
        })
        .catch(done)
    })
  }
}