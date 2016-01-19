import program from 'commander'
import readPkg from 'read-package-json'
import { sync as find } from 'glob'
import { find as resolvePkg } from 'pkginfo'
import { dirname, relative, basename, resolve, normalize, delimiter } from 'path'
import { execSync as exec } from 'child_process'
import { optimize } from 'requirejs'
import { writeFileSync as put } from 'fs'

const pkgFile = resolvePkg(module, process.cwd())
    , pkgRoot = dirname(pkgFile)
    , pkgPath = relative.bind(null, pkgRoot)

readPkg(pkgFile, (err, pkg) => {
  if (err) {
    console.error(err.message)
    process.exit(1)
  }

  pkg.directories || (pkg.directories = {})

  const defaults =
    { out: pkgPath(pkg.name + '-min.js')
    , lib: pkgPath(pkg.directories.lib || 'lib')
    , src: pkgPath(pkg.directories.src || 'src')
    , include: ['**/*.js']
    , exclude: ['node_modules/**/*']
    , optimize: 0
    , debug: true
    , presets: ['es2015']
    , plugins: ['transform-es2015-modules-amd']
    , interactive: false
    , production: false
    }

  const cli = program
    .version(require('../package.json').version)
    .option('-i, --src <dir>', `the root directory from which all sources are relative [${defaults.src}]`, pkgPath, defaults.src)
    .option('-o, --out <file>', `write optimized output to the specified file [${defaults.out}]`, pkgPath, defaults.out)
    .option('-L, --lib <dir>', `write unoptimized files to the specified directory [${defaults.lib}]`, pkgPath, defaults.lib)
    .option('-I, --include <path>', `include the specified path or glob (relative to source root) [${defaults.include}]`, add(defaults.include), defaults.include)
    .option('-X, --exclude <path>', 'exclude the specified path or glob (relative to source root)', add(defaults.exclude), defaults.exclude)
    .option('-O, --optimize <level>', `optimization level (0 = none) [${defaults.optimize}]`, setOptimization, defaults.optimize)
    .option('--presets <list>', `comma separated list of babel presets; prepend + to add to defaults [${defaults.presets}]`, set(defaults.presets), defaults.presets)
    .option('--plugins <list>', `somma separated list of babel plugins; prepend + to add to defaults [${defaults.plugins}]`, set(defaults.plugins), defaults.plugins)
    .option('--no-debug', `don't generate source maps`, Boolean, !defaults.debug)
    .option('--interactive', `watch for and recompile on changes (implies -O 0)`)
    .option('--production', `enable production options (implies -O 1)`)

  const opts = cli.parse(process.argv)

  const flags =
    [ '--module-ids'
    , `--module-root=${pkg.name}/${opts.lib}`
    , `--source-root=${opts.src}`
    , `--presets=${opts.presets}`
    , `--plugins=${opts.plugins}`
    ]

  if (opts.debug) {
    flags.push('--source-maps')
  }

  if (opts.copy) {
    flags.push('--copy-files')
  }

  if (opts.include.length) {
    flags.push(`--only=${opts.include}`)
  }

  if (opts.exclude.length) {
    flags.push(`--ignore=${opts.exclude}`)
  }

  if (opts.production || process.env.NODE_ENV === 'production') {
    opts.optimize = 1

    const modules = opts.include.reduce((list, pattern) => {
      return list.concat(
        find(`${opts.src}/${pattern}`, { ignore: opts.exclude }).map(f => {
          const name = basename(relative(opts.src, f), '.js')
          return `${pkg.name}/${opts.lib}/${name}`
        })
      )
    }, [])

    const optimizedModules = resolve(pkgRoot, 'optimised-modules.json')
    put(optimizedModules, JSON.stringify(modules, null, 2), 'utf8')

    if (process.env.DEBUG) {
      log('Modules:')
      modules.forEach(m => log(`- ${m}`))
    }
  } else if (opts.interactive) {
    opts.optimize = 0
    flags.push('--watch')
  }

  if (opts.optimize === 0) {
    flags.push(`--out-dir=${opts.lib}`)
  } else {
    flags.push(`--out-file=${opts.out}`)
  }

  if (process.env.DEBUG) {
    log('Compiler options:')
    Object.keys(defaults).forEach(k => log(`- ${k}: ${opts[k]}`))
  }

  const CC  = `babel ${opts.src} ${flags.join(' ')}`
      , PATH =
        [ normalize('node_modules/.bin')
        , process.env.PATH
        ].join(delimiter)

  if (process.env.DEBUG) {
    log('CC:', CC)
    log('PATH:', PATH)
  }

  exec(CC,
    { cwd: pkgRoot
    , stdio: 'inherit'
    , env: { PATH }
    }
  )
})

function setOptimization(level) {
  return Math.max(level | 0, 0)
}

function log(...args) {
  console.error.call(console, '#', ...args)
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
    Object.keys(input).forEach(k => map[k] = input[k])
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

function add(list) {
  return val => list.concat(val.split(','))
}

function set(list) {
  return val => {
    if (val.charAt(0) === '+') {
      return add(list)(val.slice(1))
    } else {
      return val.split(',')
    }
  }
}
