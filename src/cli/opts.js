import { Command as CLI } from 'commander'
import { slurp } from '../util/file'
import readPkg from 'pkginfo'

export default async function parse(pkg, argv) {
  const alwaysExclude =
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

  const defaults =
    { out: pkg.relative(`${pkg.name.split('/').pop()}-min`)
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
    , flags: ['modules:umd']
    }

  const cli = new CLI()
    .version(readPkg(module).version)
    .option('-i, --src <dir>', `the root directory from which all sources are relative [${defaults.src}]`, pkg.relative, defaults.src)
    .option('-o, --out <prefix>', `write optimized output to files with the specified prefix [${defaults.out}]`, pkg.relative, defaults.out)
    .option('-L, --lib <dir>', `write unoptimized files to the specified directory [${defaults.lib}]`, pkg.relative, defaults.lib)
    .option('-I, --include [js|css:]<path>', `include a path or glob (relative to source root) [${defaults.include}]`, concatGlobs, [])
    .option('-X, --exclude [js|css:]<path>', `exclude a path or glob (relative to source root) [${defaults.exclude}]`, concatGlobs, [])
    .option('-O, --optimize <level>', `optimization level (0 = none) [${defaults.optimize}]`, setOptimization, defaults.optimize)
    .option('--no-copy', `disable copying of non-code files to ${defaults.lib}`, Boolean, !defaults.copy)
    .option('--no-debug', 'disable source map generation', Boolean, !defaults.debug)
    .option('--log <normal|json>', `log output format [${defaults.log}]`, /^(json|normal)$/i, defaults.log)
    .option('--interactive', `watch for and recompile on changes (implies -O 0)`)
    .option('--production', `enable production options (implies -O 1)`)
    .option('--flags <flags>', `toggle flags [${defaults.flags}]`, concatFlags, [])
    .option('@<path>', 'read options from the file at <path> (relative to cwd)')

  const opts = cli.parse(await explode(argv))

  Object.keys(opts).forEach(key => {
    if (key in defaults === false) {
      delete opts[key]
    }
  })

  opts.include = conclude(['js', 'css'], defaults.include, opts.include)
  opts.exclude = conclude(['js', 'css'], defaults.exclude, opts.exclude)
  opts.flags = flag(defaults.flags, opts.flags)

  if (!validModules.has(opts.flags.modules)) {
    opts.flags.modules = 'umd'
  }

  opts.include['copy-files'] = ['**/*']
  opts.exclude['copy-files'] = [...opts.include.js, ...opts.include.css, ...opts.exclude['*']]

  if (process.env.NODE_ENV === 'production' && !opts.interactive) {
    opts.production = true
  }

  opts.optimize
    = opts.production?  1
    : opts.interactive? 0
    : opts.optimize

  opts.interactive = opts.production? false : opts.interactive

  return opts
}

const keys = Object.keys

const validModules = new Set(['umd','amd','commonjs','systemjs','ecmascript'])

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

function flag(defaults, opts) {
  return Object.assign
    ( [... new Set(defaults)].reduce(parse, {})
    , [... new Set(opts)].reduce(parse, {})
    )

  function parse(flags, val) {
    let [flag, setting] = val.split(':')

    if (setting) {
      try {
        flags[flag] = JSON.parse(setting)
      } catch (e) {
        flags[flag] = setting
      }
    } else {
      flags[flag] = true
    }

    return flags
  }
}

function setOptimization(level) {
  return Math.max(level | 0, 0)
}

function concatGlobs(val, list) {
  let prep = val.replace(/,([^,:]+:)/g, "\0$1")
  return list.concat(prep.split('\0'))
}

function concatFlags(val, list) {
  return list.concat(val.split(','))
}

async function explode(argv) {
  let exploded = []

  for (let arg of argv) {
    if (arg.startsWith('@')) {
      let file = arg.slice(1)

      try {
        let fileopts = (await slurp(file, 'utf8')).split(/\s/)
        exploded = exploded.concat(await explode(fileopts))
      } catch (e) {
        console.error(e.message)
        process.exit(1)
      }
    } else if (arg) {
      exploded.push(arg)
    }
  }

  return exploded
}