import { read as readPkg } from './util/pkg'
import { find, slurp, put } from './util/file'
import stdio from './util/stdio'
import { default as jsc } from './builder/javascript'
import { default as cssc } from './builder/css'
import { default as copyFiles } from './builder/copy-files'
import { default as createPipeline } from './pipeline'
import { default as jso } from './postbuild/javascript'
import { default as csso } from './postbuild/css'
import { red, yellow } from 'ansicolors'
import { watch } from 'chokidar'
import { timed } from './util/performance'
import './util/cli'
import { default as parseOpts } from './cli/opts'

const keys = Object.keys
const all = Promise.all.bind(Promise)

main()

async function main() {
  const pkg = await readPkg(process.cwd())
  const opts = await parseOpts(pkg, process.argv)
  const console = stdio({ debug: !!process.env.DEBUG, format: opts.log })

  console.debug('Options:')
  keys(opts).forEach(name => console.debug(`- ${name}: ${JSON.stringify(opts[name])}`))

  const pipeline =
    { js: createPipeline(pkg, opts, jsc(pkg, opts))
    , css: createPipeline(pkg, opts, cssc(pkg, opts))
    }

  if (opts.copy) {
    pipeline['copy-files'] = createPipeline(pkg, opts, copyFiles(pkg, opts))
  }

  const build = await timed(
    keys(pipeline).reduce(
      async (result, type) => {
        result = await result
        let input = await collect(opts.include[type], opts.exclude[type])
        result[type] = await execute(type, pipeline[type], ...input)
        result[type].errors = result[type].filter(result => result.error)

        return result
      }
    , {})
  )

  console.debug(`Build took ${build.duration.ms} ms`)

  if (opts.interactive) {
    keys(pipeline).forEach(type => {
      console.debug(`Watching ${type} pipeline:`)
      console.debug(`- included: ${opts.include[type]}`)
      console.debug(`- excluded: ${opts.exclude[type]}`)
      interactive(opts.include[type], opts.exclude[type])
        .on('add', async file => await execute(type, pipeline[type], file))
        .on('change', async file => await execute(type, pipeline[type], file))
    })
    console.info('Watching source files for changes...')
  }

  if (keys(build.result).some(type => build.result[type].errors.length)) {
    console.info('\nBuild failed to due unrecoverable errors.')
    process.exit(1)
  }

  if (opts.optimize) {
    console.debug('Writing optimised-modules.json')
    const extension = /^([^\.]+).*$/
    const winslash = /\\/g

    await put(pkg.resolve('optimised-modules.json'), JSON.stringify(
      new Set(
        keys(build.result).reduce((files, type) => {
          let pipe = build.result[type]
          return pipe.reduce((files, result) => {
            if (result.files) {
              return [...files, ...result.files.map(file => {
                const name = file.replace(extension, '$1').replace(winslash, '/')
                return `${pkg.name}/${name}`
              })]
            } else {
              return files
            }
          }, files)
        }, [])
      )
      , null, 2
    ))

    if (build.result.css.length) {
      console.debug(`Writing ${opts.out}.css`)
      let filename = pkg.resolve(`${opts.out}.css`)
      let contents = await csso(pkg, opts)(build.result.css)
      await put(filename, contents)
    }

    if (build.result.js.length) {
      console.debug(`Writing ${opts.out}.js`)
      let filename = pkg.resolve(`${opts.out}.js`)
      let contents = await jso(pkg, opts)(build.result.js)
      await put(filename, contents)
    }
  }

  async function collect(include, exclude) {
    let collection = []

    for (let pattern of include) {
      let files = await find(`${opts.src}/${pattern}`, { nodir: true, ignore: exclude, cwd: pkg.root })
      collection = [...collection, ...files]
    }

    return collection
  }

  function interactive(include, exclude) {
    let watcher = watch(include.reduce((files, pattern) => {
      return files.concat(`${opts.src}/${pattern}`)
    }, []), { ignored: exclude, cwd: pkg.root, ignoreInitial: true })

    return watcher
  }

  async function execute(type, pipeline, ...input) {
    let result = await all(pipeline(...input))
    await status(type, ...result)
    return result
  }

  async function status(type, ...results) {
    for (let result of results) {
      let { input, messages, files, error } = await result

      if (messages) {
        [...messages].forEach(message => {
          console.warn(yellow(`\n${type} – ${input}: ${message}`))
        })
      }

      if (error) {
        console.error(`\n${type} – ${red(error.message)}\n${error.codeFrame || error.stack}\n`)
      } else {
        console.log(`${type} – ${input} -> ${files}`)
      }
    }
  }
}