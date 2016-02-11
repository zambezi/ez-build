import program from 'commander'
import readPkg from 'read-package-json'
import { sync as find } from 'glob'
import { find as resolvePkg } from 'pkginfo'
import { dirname, relative, basename as base, resolve, normalize, delimiter, extname as ext, join } from 'path'
import { execSync as exec } from 'child_process'
import { optimize } from 'requirejs'
import { writeFileSync as put } from 'fs'
import mkdirp from 'mkdirp'

import stdio from './util/stdio'

import { default as jsc } from './compiler/javascript'
import { default as cssc } from './compiler/css'

const keys = Object.keys

const pkgFile = resolvePkg(module, process.cwd())
    , pkgRoot = dirname(pkgFile)
    , pkgResolve = (path) => relative(process.cwd(), resolve(pkgRoot, path))
    , pkgRelative = (path) => relative(pkgRoot, resolve(pkgRoot, path))

readPkg(pkgFile, (err, pkg) => {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }

  pkg.directories || (pkg.directories = {})

  const defaults =
    { out: pkgRelative(`${pkg.name}-min`)
    , lib: pkgRelative(pkg.directories.lib || 'lib')
    , src: pkgRelative(pkg.directories.src || 'src')
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
    .option('-i, --src <dir>', `the root directory from which all sources are relative [${defaults.src}]`, pkgRelative, defaults.src)
    .option('-o, --out <prefix>', `write optimized output to files with the specified prefix [${defaults.out}]`, pkgRelative, defaults.out)
    .option('-L, --lib <dir>', `write unoptimized files to the specified directory [${defaults.lib}]`, pkgRelative, defaults.lib)
    .option('-I, --include [js|css:]<path>', `include a path or glob (relative to source root) [${defaults.include}]`, concat, defaults.include)
    .option('-X, --exclude [js|css:]<path>', `exclude a path or glob (relative to source root) [${defaults.exclude}]`, concat, defaults.exclude)
    .option('-O, --optimize <level>', `optimization level (0 = none) [${defaults.optimize}]`, setOptimization, defaults.optimize)
    .option('--no-copy', `disable copying of non-code files to ${defaults.lib}`, Boolean, !defaults.copy)
    .option('--no-debug', 'disable source map generation', Boolean, !defaults.debug)
    .option('--log <normal|json>', `log output format [${defaults.log}]`, /^(json|normal)$/i, defaults.log)
    .option('--interactive', `watch for and recompile on changes (implies -O 0)`)
    .option('--production', `enable production options (implies -O 1)`)

  const opts = cli.parse(process.argv)
  const console = stdio({ debug: !!process.env.DEBUG, format: opts.log })

  opts.include = opts.include.reduce(conclude('js', 'css'), {})
  opts.exclude = opts.exclude.reduce(conclude('js', 'css'), {})

  console.debug('Options:')
  keys(defaults).forEach(name => console.debug(`- ${name}: ${JSON.stringify(opts[name])}`))

  const pipeline =
        [ { name: 'js', cc: jsc(opts, pkg), files: collect(opts.include.js, opts.exclude.js) }
        , { name: 'css', cc: cssc(opts, pkg), files: collect(opts.include.css, opts.exclude.css) }
        ]

  console.debug('Pipeline:')
  pipeline.map(({name, files}) => console.debug(`- ${name}: ${files}`))

  pipeline.map(({name: pipe, cc, files}) => {
    console.debug(`building ${pipe}...`)
    const startTime = process.hrtime()

    let builds = files.map(file => build(console, opts, cc, file))

    Promise.all(builds)
      .then(time, time)

    function time(result) {
      const duration = process.hrtime(startTime)
      console.debug(`${pipe} finished in ${((duration[0] * 1e9 + duration[1]) / 1e9).toFixed(3)}s`)
      return result
    }
  })

  // if (opts.optimize > 0) {
  //   const modules = opts.include.reduce((list, pattern) => {
  //     return list.concat(
  //       find(`${opts.src}/${pattern}`, { ignore: opts.exclude }).map(f => {
  //         const relf = relative(opts.src, f)
  //             , name = base(relf, ext(relf))
  //         return `${pkg.name}/${opts.lib}/${name}`
  //       })
  //     )
  //   }, [])

  //   const optimizedModules = resolve(pkgRoot, 'optimised-modules.json')
  //   put(optimizedModules, JSON.stringify(modules, null, 2), 'utf8')

  //   console.debug('Modules:')
  //   modules.forEach(m => console.debug(`- ${m}`))

  //   jsc(...flags, `--out-file=${opts.out}`)
  // }

  function collect(include, exclude) {
    let collection = include.reduce((files, pattern) => {
      return files.concat(
        find(pattern, { ignore: exclude, cwd: pkgResolve(opts.src) })
          .map(file => `${pkgResolve(opts.src)}/${file}`)
      )
    }, [])

    return collection
  }
})

function build(console, opts, cc, file) {
  let name = base(file, ext(file))
  let build = cc(name, file)

  return build.then(obj => {
    keys(obj).map(name => {
      let path = join(pkgResolve(opts.lib), dirname(relative(pkgResolve(opts.src), resolve(file))))
      let out = join(path, name)

      try {
        mkdirp.sync(path)
        put(out, obj[name])
        console.log({ in: file, out: out }, `${file} -> ${out}`)
      } catch (e) {
        console.error(e)
      }
    })
  }).catch(err => {
    console.error(err)
    console.error(err.codeFrame)
  })
}

function compile(root, src, flags) {
  const cmd = `babel ${src} ${flags.join(' ')}`

  console.debug('JSC:', cmd)
  console.debug('PATH:', JSC_PATH)

  exec(cmd,
    { cwd: pkgRoot
    , stdio: 'inherit'
    , env: { PATH: JSC_PATH }
    }
  )
}

const JSC_PATH =
      [ normalize('node_modules/.bin')
      , process.env.PATH
      ].join(delimiter)

function setOptimization(level) {
  return Math.max(level | 0, 0)
}

function setFlag(map, input) {
  if (typeof input === 'string') {
    const [k, v]  = input.split('=')
        , aliased = v? v.split(',').map(aliasFlag) : true

    if (k.slice(-1) === '+') {
      map[k] = [].concat(map[k], aliased).filter(v => v !== undefined)
    } else {
      map[k] = aliased
    }
  } else {
    keys(input).forEach(k => map[k] = input[k])
  }

  return map
}

function aliasFlag(val) {
  return aliases[val] || val
}

const aliases =
  { true: true
  , false: false
  , undefined: true
  }

function concat(val, list) {
  return list.concat(val.split(','))
}

function conclude(... all) {
  return (pipe, val) => {
    let [lines, pattern] = val.split(':')

    if (pattern) {
      lines = [lines]
    } else {
      pattern = lines
      lines = all
    }

    lines.forEach(line => {
      pipe[line] = (pipe[line] || []).concat(pattern)
    })

    return pipe
  }
}