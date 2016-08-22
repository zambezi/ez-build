import program from 'commander'
import { read as readPkg, find as resolvePkg } from '../util/pkg'

export default async function parse(pkg, process) {
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
    , flags: ['add-module-exports:false']
    }

  const ezbuild = await readPkg(require.resolve('../../package.json'))

  const cli = program
    .version(ezbuild.version)
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
    .option('--flags <flags>', `toggle flags [${defaults.flags}]`, concat, [])

  const opts = cli.parse(process.argv)

  opts.include = conclude(['js', 'css'], defaults.include, opts.include)
  opts.exclude = conclude(['js', 'css'], defaults.exclude, opts.exclude)
  opts.flags = flag(keys(defaults.flags), defaults.flags, opts.flags)

  opts.include['copy-files'] = ['**/*']
  opts.exclude['copy-files'] = [...opts.include.js, ...opts.include.css, ...opts.exclude['*']]

  opts.optimize
    = opts.production?  1
    : opts.interactive? 0
    : opts.optimize

  opts.interactive = opts.production? false : opts.interactive 

  return opts
}

const keys = Object.keys

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

function flag(flags, defaults, opts) {
  return Object.assign
    ( [... new Set(defaults)].reduce(parse, {})
    , [... new Set(opts)].reduce(parse, {})
    )

  function parse(flags, val) {
    let [flag, setting] = val.split(':')

    try {
      flags[flag] = JSON.parse(setting)
    } catch (e) {
      flags[flag] = setting
    }

    return flags
  }
}

function setOptimization(level) {
  return Math.max(level | 0, 0)
}

function concat(val, list) {
  return list.concat(val.split(','))
}