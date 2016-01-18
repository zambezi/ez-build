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
    , jsc: 'babel'
    , jscFlag:
      { presets: ['es2015']
      , plugins: ['transform-es2015-modules-amd']
      }
    , include: ['**/*.js']
    , exclude: []
    , optimize: 0
    }

  const cli = program
    .version(require('../package.json').version)
    .option('-i, --src <dir>', `the root directory from which all sources are relative [${defaults.src}]`, pkgPath, defaults.src)
    .option('-o, --out <file>', `write optimized output to the specified file [${defaults.out}]`, pkgPath, defaults.out)
    .option('-L, --lib <dir>', `write unoptimized files to the specified directory [${defaults.lib}]`, pkgPath, defaults.lib)
    .option('-O, --optimize <level>', `specifies optimization level (0|1) [${defaults.optimize}]`, setOptimization, defaults.optimize)
    .option('-I, --include <path>', `include the specified path or glob (relative to source root) [${defaults.include}]`, addPath.bind(null, defaults.include), defaults.include)
    .option('-X, --exclude <path>', 'exclude the specified path or glob (relative to source root)', addPath.bind(null, defaults.exclude), defaults.exclude)
    .option('--jsc <compiler>', `specifies the JS compiler command to be invoked [${defaults.jsc}]`, String, defaults.jsc)
    .option('--jsc-flag <flag>=<value>', `specifies compiler flags; use += for additive behavior [${formatCCArgs(defaults.jscFlag)}]`, setFlag.bind(null, defaults.jscFlag), defaults.jscFlag)

  const opts = cli.parse(process.argv)

  setFlag(opts.jscFlag,
    { 'source-maps' : true
    , 'module-ids'  : true
    , 'module-root' : `${pkg.name}/${opts.lib}`
    , 'source-root' : opts.src
    }
  )

  opts.include.length > 0 && setFlag(opts.jscFlag, { only: opts.include })
  opts.exclude.length > 0 && setFlag(opts.jscFlag, { ignore: opts.exclude})

  const jscArgs = Object.keys(opts.jscFlag).map(name => {
    let pre = /^-|--/.test(name)? '' : '--'
      , val = `=${opts.jscFlag[name]}`

    if (typeof opts.jscFlag[name] === 'boolean') {
      opts.jscFlag[name]? (val = '') : (pre = `${pre}no-`)
    }

    return `${pre}${name}${val}`
  })

  const cmd  = `${opts.jsc} ${opts.src} ${getTarget(opts)} ${formatCCArgs(opts.jscFlag)}`
      , PATH = `${normalize('node_modules/.bin')}${delimiter}${process.env.PATH}`

  log(cmd)

  log()

  exec(cmd,
    { cwd: pkgRoot
    , stdio: 'inherit'
    , env: { PATH }
    }
  )

  if (opts.optimize > 0) {
    const modules = opts.include.reduce((list, pattern) => {
      return list.concat(
        find(`${opts.src}/${pattern}`).map(f => {
          const name = basename(relative(opts.src, f), '.js')
          log(name)
          return `${pkg.name}/${opts.lib}/${name}`
        })
      )
    }, [])

    const optimizedModules = resolve(pkgRoot, 'optimised-modules.json')
    put(optimizedModules, JSON.stringify(modules, null, 2), 'utf8')
  }
})

function setOptimization(level) {
  return Math.max(level | 0, 0)
}

function formatCCArgs(flag) {
  return Object.keys(flag).map(name => {
    let pre = /^-|--/.test(name)? '' : '--'
      , val = `=${flag[name]}`

    if (typeof flag[name] === 'boolean') {
      flag[name]? (val = '') : (pre = `${pre}no-`)
    }

    return `${pre}${name}${val}`
  }).join(' ')
}

function log(...args) {
  if (process.env.DEBUG) {
    console.error.call(console, '#', ...args)
  }
}

function getTarget(opts) {
  const levels = 
    [ `--out-dir ${opts.lib}`
    , `--out-file ${opts.out}`
    ]

  return levels[opts.optimize] || levels[0]
}

function setFlag(map, input) {
  if (typeof input === 'string') {
    const [k, v]  = input.split('=')
        , aliased = v.split(',').aliasFlag

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

function addPath(paths, val) {
  return [val].concat(paths)
}
