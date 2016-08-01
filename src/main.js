import program from 'commander'
import { dirname, relative, basename as base, resolve } from 'path'
import { read as readPkg, find as resolvePkg } from './util/pkg'
import { find, slurp, put } from './util/file'
import stdio from './util/stdio'
import { default as jsc } from './builder/javascript'
import { default as cssc } from './builder/css'
import { default as copyFiles } from './builder/copy-files'
import { default as createPipeline } from './pipeline'
import { red, yellow } from 'ansicolors'
import { watch } from 'chokidar'
import rebaseProdCss from './rebase-prod-css'
import { timed } from './util/performance'
import './util/cli'

const keys = Object.keys
const all = Promise.all.bind(Promise)

main()

async function main() {
  const pkgFile = resolvePkg(module, process.cwd())
      , pkgRoot = dirname(pkgFile)

  var pkg = await readPkg(pkgFile)

  pkg.root = pkgRoot
  pkg.resolve = (path) => relative(process.cwd(), resolve(pkgRoot, path))
  pkg.relative = (path) => relative(pkgRoot, resolve(pkgRoot, path))

  pkg.directories || (pkg.directories = {})

  let alwaysExclude = 
    [ `node_modules`
    , `package.json`
    , `.*`
    , `*-min.js`
    , `*-min.js.map`
    , `*-min.css`
    , `*-min.css.map`
    , `*-debug.log`
    , `optimised-modules.json`
    , `dependencies.json`
    ]

  await Promise.all([ '.gitignore', '.npmignore' ].map(async file => {
    try { 
      let ignore = String(await slurp(file)).split('\n').filter(l => !!l)
      if (ignore) {
        alwaysExclude.push(...ignore)
      }
    } catch (e) {
      if (e.code !== 'ENOENT') throw e
    }
  }))

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
    , exclude: [...alwaysExclude]
    , log: 'normal'
    }

  const cli = program
    .version(pkg.version)
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
    { js: createPipeline(pkg, opts, jsc(pkg, opts))
    , css: createPipeline(pkg, opts, cssc(pkg, opts))
    , 'copy-files': createPipeline(pkg, opts, copyFiles(pkg, opts))
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
  
  let output = []
  const build = await timed(all(keys(pipeline).map(async type => {
    let results = pipeline[type](await collect(opts.include[type], opts.exclude[type]))

    for (let result of results) {
      try {
        let { input, messages, files } = await result

        if (messages) {
          [...messages].forEach(message => {
            console.warn(yellow(`\n${type} – ${input}: ${message}`))
          })
        }

        console.log(`${type} – ${input} -> ${files}`)
        output = [...output, ...files]
      } catch (error) {
        console.error(`\n${type} – ${red(error.message)}\n${error.codeFrame || error.stack}\n`)
      }
    }
  })))

  console.debug(`Build took ${build.duration.ms} ms`)

  if (opts.interactive) {
    console.info('Starting interactive mode...')
    keys(pipeline).forEach(type => {
      console.debug(`Watching ${type} pipeline:`)
      console.debug(`- included: ${opts.include[type]}`)
      console.debug(`- excluded: ${opts.exclude[type]}`)
      interactive(opts.include[type], opts.exclude[type])
        .on('add', file => pipeline[type](file))
        .on('change', file => pipeline[type](file))
    })
  } else if (opts.optimize) {
    console.debug('Writing optimised-modules.json')
    const extension = /^([^\.]+).*$/
    const winslash = /\\/g

    await put(pkg.resolve('optimised-modules.json'), JSON.stringify(
      new Set(output.map(file => {
        const name = file.replace(extension, '$1').replace(winslash, '/')
        return `${pkg.name}/${name}`
      }))
      , null, 2
    ))


    const cssOutput = output.filter(file => /\.css$/.test(file))
    if (cssOutput.length) {
      console.debug(`Writing ${pkg.name}-min.css`)
      await put(pkg.resolve(`${pkg.name}-min.css`),
        cssOutput
          .map(file => rebaseProdCss(pkg, opts, file))
          .join('\n')
      )
    }
    
    const jsOutput = output.filter(file => /\.js$/.test(file))
    if (jsOutput.length) {
      console.debug(`Writing ${pkg.name}-min.js`)
      await put(pkg.resolve(`${pkg.name}-min.js`),
        (await Promise.all(
          jsOutput.map(async file => await slurp(file, 'utf8'))
        )).join('\n')
      )
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
}

function setOptimization(level) {
  return Math.max(level | 0, 0)
}

function concat(val, list) {
  return list.concat(val.split(','))
}

function conclude(types, defaults, opts) {
  return Object.assign
    ( [... new Set(defaults)].reduce(parse, {})
    , [... new Set(opts)].reduce(parse, {})
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