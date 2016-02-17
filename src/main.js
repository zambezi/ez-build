import program from 'commander'
import readPkg from 'read-package-json'
import { sync as find } from 'glob'
import { find as resolvePkg } from 'pkginfo'
import { dirname, relative, basename as base, resolve, normalize, delimiter, extname as ext, join } from 'path'
import { execSync as exec } from 'child_process'
import { optimize } from 'requirejs'
import { default as put } from 'output-file-sync'
import { readFileSync as slurp } from 'fs'
import stdio from './util/stdio'
import { parallel, apply } from 'async'
import { default as jsc } from './builder/javascript'
import { default as cssc } from './builder/css'
import { default as copyFiles } from './builder/copy-files'
import { default as createPipeline } from './pipeline'
import { red, yellow } from 'ansicolors'
import { watch } from 'chokidar'

const keys = Object.keys

const pkgFile = resolvePkg(module, process.cwd())
    , pkgRoot = dirname(pkgFile)

readPkg(pkgFile, (err, pkg) => {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }

  pkg.root = pkgRoot
  pkg.resolve = (path) => relative(process.cwd(), resolve(pkgRoot, path))
  pkg.relative = (path) => relative(pkgRoot, resolve(pkgRoot, path))

  pkg.directories || (pkg.directories = {})

  const defaults =
    { out: pkg.relative(`${pkg.name}-min`)
    , lib: pkg.relative(pkg.directories.lib || 'lib')
    , src: pkg.relative(pkg.directories.src || 'src')
    , optimize: 0
    , copy: true
    , debug: true
    , interactive: false
    , production: false
    , include: ['js:**/*.js', 'css:**/*.css']
    , exclude: ['../node_modules/**/*']
    , log: 'normal'
    }

  const cli = program
    .version(require('../package.json').version)
    .option('-i, --src <dir>', `the root directory from which all sources are relative [${defaults.src}]`, pkg.relative, defaults.src)
    .option('-o, --out <prefix>', `write optimized output to files with the specified prefix [${defaults.out}]`, pkg.relative, defaults.out)
    .option('-L, --lib <dir>', `write unoptimized files to the specified directory [${defaults.lib}]`, pkg.relative, defaults.lib)
    .option('-I, --include [js|css:]<path>', `include a path or glob (relative to source root) [${defaults.include}]`, concat, [])
    .option('-X, --exclude [js|css:]<path>', `exclude a path or glob (relative to source root) [${defaults.exclude}]`, concat, [])
    .option('-O, --optimize <level>', `optimization level (0 = none) [${defaults.optimize}]`, setOptimization, defaults.optimize)
    .option('--no-copy', `disable copying of non-code files to ${defaults.lib}`, Boolean, !defaults.copy)
    .option('--no-debug', 'disable source map generation', Boolean, !defaults.debug)
    .option('--log <normal|json>', `log output format [${defaults.log}]`, /^(json|normal)$/i, defaults.log)
    .option('--interactive', `watch for and recompile on changes (implies -O 0)`)
    .option('--production', `enable production options (implies -O 1)`)

  const opts = cli.parse(process.argv)
  const console = stdio({ debug: !!process.env.DEBUG, format: opts.log })

  const pipeline =
    { js: createPipeline(pkg, opts, jsc(pkg, opts), logPipe('js'))
    , css: createPipeline(pkg, opts, cssc(pkg, opts), logPipe('css'))
    , 'copy-files': createPipeline(pkg, opts, copyFiles(pkg, opts), logPipe('copy files'))
    }

  opts.include = conclude(keys(pipeline), defaults.include, opts.include)
  opts.exclude = conclude(keys(pipeline), defaults.exclude, opts.exclude)

  opts.include['copy-files'] = ['**/*']
  opts.exclude['copy-files'] = [...opts.include.js, ...opts.include.css, ...opts.exclude['*']]

  opts.optimize
    = opts.production?  1
    : opts.interactive? 0
    : opts.optimize

  opts.interactive = opts.production? false : opts.interactive

  console.debug('Options:')
  keys(defaults).forEach(name => console.debug(`- ${name}: ${JSON.stringify(opts[name])}`))

  parallel(
    keys(pipeline).map(type => apply(pipeline[type], collect(opts.include[type], opts.exclude[type])))
    , (error, results) => {
      if (opts.interactive) {
        console.info('Starting interactive mode...')
        keys(pipeline).forEach(type => {
          console.debug(`Watching ${type} pipeline:`)
          console.debug(`- included: ${opts.include[type]}`)
          console.debug(`- excluded: ${opts.exclude[type]}`)
          interactive(opts.include[type], opts.exclude[type])
            .on('add', pipeline[type])
            .on('change', pipeline[type])
        })
      } else if (opts.optimize) {
        console.debug('Writing optimised-modules.json')
        put(pkg.resolve('optimised-modules.json'),
          JSON.stringify(
            find(`${opts.lib}/**/*.js`).map(file => {
              const name = base(relative(opts.lib, file), ext(file))
              return `${pkg.name}/${opts.lib}/${name}`
            })
          , null, 2)
        )

        console.debug(`Writing ${pkg.name}-min.css`)
        put(pkg.resolve(`${pkg.name}-min.css`),
          find(`${opts.lib}/**/*.css`)
            .map(file => slurp(file, 'utf8'))
            .join('\n')
        )

        console.debug(`Writing ${pkg.name}-min.js`)
        put(pkg.resolve(`${pkg.name}-min.js`),
          find(`${opts.lib}/**/*.js`)
            .map(file => slurp(file, 'utf8'))
            .join('\n')
        )
      }
    }
  )

  function collect(include, exclude) {
    let collection = include.reduce((files, pattern) => {
      return files.concat(
        find(`${opts.src}/${pattern}`, { nodir: true, ignore: exclude, cwd: pkg.root })
      )
    }, [])

    return collection
  }

  function interactive(include, exclude) {
    let watcher = watch(include.reduce((files, pattern) => {
      return files.concat(`${opts.src}/${pattern}`)
    }, []), { ignored: exclude, cwd: pkg.root, ignoreInitial: true })

    return watcher
  }

  function logPipe(pipeline) {
    return {
      onBuild({ input, messages, files }) {
        if (messages) {
          [].concat(messages).forEach(message => {
            console.warn({ pipeline, message }, yellow(`\n${pipeline} – ${input}: ${message}`))
          })
        }
        console.log({ pipeline, input, files }, `${pipeline} – ${input} -> ${files}`)
      },

      onError({ input, error }) {
        console.error({ pipeline, error }, `\n${pipeline} – ${red(error.message)}\n${error.codeFrame}\n`)
      }
    }
  }
})

function setOptimization(level) {
  return Math.max(level | 0, 0)
}

function concat(val, list) {
  return list.concat(val.split(','))
}

function conclude(types, defaults, opts) {
  return Object.assign
    ( defaults.reduce(parse, {})
    , opts.reduce(parse, {})
    )

  function parse(pipe, val) {
    let [lines, pattern] = val.split(':')

    if (pattern) {
      lines = [lines]
    } else {
      pattern = lines
      lines = ['*', ...types]
    }

    lines.forEach(line => {
      pipe[line] = (pipe[line] || []).concat(pattern)
    })

    return pipe
  }
}