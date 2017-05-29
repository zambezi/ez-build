import test from 'tape-async'
import { is } from 'funkis'
import { loadUnit, readFixture, argv } from '../test-util.js'
import deepEqual from 'deep-equal'
import
  { power as combinations
  , cartesianProduct as matrixCombinations
  } from 'js-combinatorics'

test('Options', async t => {
  t.plan(65)

  const barePkg = await readFixture('bare-project')
      , typicalPkg = await readFixture('typical-project')
      , { default: parseOpts
        , validFlags
        , defaultFlags
        } = await loadUnit('cli/opts')

  const defaults = await parseOpts(barePkg, argv())
  let opts

  t.comment('Options > Defaults')
  t.equal(defaults.src, 'src', '-i,--src defaults to src')
  t.equal(defaults.lib, 'lib', '-L,--lib defaults to lib')
  t.equal(defaults.out, 'bare-project-min', '-o,--out defaults to bare-project-min')

  t.comment('Options > Defaults: -I,--include')
  t.deepEqual(defaults.include['copy-files'], [ '**/*' ], 'copy-files include defaults to **/*')
  t.deepEqual(defaults.include['css'], [ '**/*.css' ], 'css include defaults to **/*.css')
  t.deepEqual(defaults.include['js'], [ '**/*.js' ], 'js include defaults to ')

  t.comment('Options > Defaults: -X,--exclude')
  t.deepEqual(defaults.exclude['*'], [ 'node_modules', 'package.json', '.*', '*-min.js', '*-min.js.map', '*-min.css', '*-min.css.map', '*-debug.log', 'optimised-modules.json', 'dependencies.json' ], '* defaults to node_modules,package.json,.*,*-min.js,*-min.js.map,*-min.css,*-min.css.map,*-debug.log,optimised-modules.json,dependencies.json')
  t.deepEqual(defaults.exclude['copy-files'], [ '**/*.js', '**/*.css', 'node_modules', 'package.json', '.*', '*-min.js', '*-min.js.map', '*-min.css', '*-min.css.map', '*-debug.log', 'optimised-modules.json', 'dependencies.json' ], 'copy-files defaults to **/*.js,**/*.css,node_modules,package.json,.*,*-min.js,*-min.js.map,*-min.css,*-min.css.map,*-debug.log,optimised-modules.json,dependencies.json')
  t.deepEqual(defaults.exclude['css'], [ 'node_modules', 'package.json', '.*', '*-min.js', '*-min.js.map', '*-min.css', '*-min.css.map', '*-debug.log', 'optimised-modules.json', 'dependencies.json' ], 'copy-files defaults to node_modules,package.json,.*,*-min.js,*-min.js.map,*-min.css,*-min.css.map,*-debug.log,optimised-modules.json,dependencies.json')
  t.deepEqual(defaults.exclude['js'], [ 'node_modules', 'package.json', '.*', '*-min.js', '*-min.js.map', '*-min.css', '*-min.css.map', '*-debug.log', 'optimised-modules.json', 'dependencies.json' ], 'copy-files defaults to node_modules,package.json,.*,*-min.js,*-min.js.map,*-min.css,*-min.css.map,*-debug.log,optimised-modules.json,dependencies.json')

  t.equal(defaults.optimize, 0, '-O,--optimize defaults to 0')
  t.equal(defaults.copy, true, '--no-copy defaults to false')
  t.equal(defaults.debug, true, '--no-debug defaults to false')
  t.equal(defaults.log, 'normal', '--log defaults to normal')
  t.deepEqual(defaults.targetBrowsers, ["last 3 versions"], '--target-browsers defaults to "last 3 versions"')
  t.equal(defaults.targetNode, false, '--target-node defaults to false')
  t.deepEqual(defaults.flags, defaultFlags, `--flags defaults to ${defaultFlags}`)

  t.comment('Options > Setting valid flags')
  await Promise.all(
    generateCombinations(validFlags).map(async ({ input, expected }) => {
      let actual = await parseOpts(barePkg, argv('--flags', `${input}`))
      expected = Object.assign({}, defaultFlags, expected)

      if (!deepEqual(actual.flags, expected)) {
        t.deepEqual(actual.flags, expected, `--flags ${input}`)
      }
    })
  )

  t.comment('Options > Setting invalid flags')
  const randomString = () => Math.random().toString(16)
  await Promise.all(
    generateCombinations(
      Object.keys(validFlags).reduce((invalid, name) => {
        if (!validFlags[name].some(value => value === undefined)) {
          invalid[name] = [undefined]
        } else {
          invalid[name] = []
        }

        invalid[name].push(... validFlags[name].map(randomString))
        return invalid
      }, {})
    ).map(async ({ input, expected }) => {
      let actual = await parseOpts(barePkg, argv('--flags', `${input}`))

      if (!deepEqual(actual.flags, defaultFlags)) {
        t.deepEqual(actual.flags, defaultFlags, `--flags ${input}`)
      }
    })
  )

  t.comment('Options > --include/--exclude patterns')
  await Promise.all(
    [ [ 'js:**/*.{js,jsx}'
      , { js: [ '**/*.{js,jsx}' ]
        }
      ]
    , [ 'js:**/*.{js,jsx},css:*.css'
      , { js: [ '**/*.{js,jsx}' ]
        , css: [ '*.css']
        }
      ]
    , [ 'js:**/*.{js,jsx},js:*.wibble'
      , { js: [ '**/*.{js,jsx}', '*.wibble' ]
        }
      ]
    , [ 'js:**/*.{js,jsx},js:*.wibble,css:*.css'
      , { js: [ '**/*.{js,jsx}', '*.wibble' ]
        , css: [ '*.css']
        }
      ]
    ].map(async ([pattern, expected]) => {
      opts = await parseOpts(barePkg, argv('--include', pattern))

      t.comment(`--include ${pattern}`)

      Object.keys(expected).forEach(result => {
        t.deepEqual(opts.include[result], expected[result], `${result} should equal ${expected[result]}`)
      })
    })
  )

  t.comment('Options > --production')
  opts = await parseOpts(barePkg, argv('--production'))
  t.equal(opts.optimize, 1, 'implies -O 1')
  t.ok(opts.production, 'enables production mode')
  t.notOk(opts.interactive, 'disables interactive mode')
  opts = await parseOpts(barePkg, argv('--production', '--interactive'))
  t.notOk(opts.interactive, 'always disables interactive mode')

  t.comment('Options > NODE_ENV=production')
  const OLD_ENV = process.env.NODE_ENV
  process.env.NODE_ENV='production'
  opts = await parseOpts(barePkg, argv())
  t.equal(opts.optimize, 1, 'implies -O 1')
  t.ok(opts.production, 'enables production mode')
  t.notOk(opts.interactive, 'disables interactive mode')
  opts = await parseOpts(barePkg, argv('--interactive'))
  t.ok(opts.interactive, 'does not disable interactive mode')

  t.comment('Options > NODE_ENV=development')
  process.env.NODE_ENV='development'
  opts = await parseOpts(barePkg, argv())
  t.notOk(opts.production, 'does not enable production mode')
  opts = await parseOpts(barePkg, argv('--interactive'))
  t.ok(opts.interactive, 'does not affect interactive mode')

  t.comment('Options > NODE_ENV=interactive')
  process.env.NODE_ENV='interactive'
  opts = await parseOpts(barePkg, argv())
  t.notOk(opts.production, 'does not enable production mode')
  opts = await parseOpts(barePkg, argv('--interactive'))
  t.ok(opts.interactive, 'does not enable interactive mode')
  process.env.NODE_ENV = OLD_ENV

  t.comment('Options > --interactive')
  opts = await parseOpts(barePkg, argv('--interactive'))
  t.equal(opts.optimize, 0, 'implies -O 0')
  t.ok(opts.interactive, 'enables interactive mode')
  t.notOk(opts.production, 'leaves production mode disabled')

  t.comment('Options > --interactive foo')
  opts = await parseOpts(barePkg, argv('--interactive', 'foo'))
  t.equal(opts.optimize, 0, 'implies -O 0')
  t.ok(opts.interactive, 'enables interactive mode')
  t.equal(opts.interactive, 'foo', 'Command equals `foo`')
  t.notOk(opts.production, 'leaves production mode disabled')

  t.comment('Options > --interactive foo bar')
  opts = await parseOpts(barePkg, argv('--interactive', 'foo', 'bar'))
  t.equal(opts.optimize, 0, 'implies -O 0')
  t.ok(opts.interactive, 'enables interactive mode')
  t.equal(opts.interactive, 'foo', 'Command equals `foo`')
  t.notOk(opts.production, 'leaves production mode disabled')

  t.comment('Options > --interactive "foo bar"')
  opts = await parseOpts(barePkg, argv('--interactive', 'foo bar'))
  t.equal(opts.optimize, 0, 'implies -O 0')
  t.ok(opts.interactive, 'enables interactive mode')
  t.equal(opts.interactive, 'foo bar', 'Command equals `foo bar`')
  t.notOk(opts.production, 'leaves production mode disabled')

  t.comment('Options > --src and --lib directories')
  opts = await parseOpts(typicalPkg, argv())
  t.equal(opts.src, typicalPkg.relative(typicalPkg.directories.src), 'should pick up src path from package.directories.src if --src is not specified')
  t.equal(opts.lib, typicalPkg.relative(typicalPkg.directories.lib), 'should pick up lib path from package.directories.lib if --lib is not specified')

  opts = await parseOpts(typicalPkg, argv('--src', 'source', '--lib', 'dist'))
  t.equal(opts.src, 'source', 'should pick up src path from --src, even if package.directories.src is specified')
  t.equal(opts.lib, 'dist', 'should pick up lib path from --lib, even if package.directories.lib is specified')

  t.comment('Options > --out <prefix>')
  opts = await parseOpts(typicalPkg, argv('--out', 'my-little-pony'))
  t.equal(opts.out, 'my-little-pony', '--out overrides default production build prefix')

  t.comment('Options > --no-copy')
  opts = await parseOpts(typicalPkg, argv('--no-copy'))
  t.equal(opts.copy, false, '--no-copy disables copy files pipeline')

  t.comment('Options > --no-debug')
  opts = await parseOpts(typicalPkg, argv('--no-debug'))
  t.equal(opts.debug, false, '--no-debug disables source map generation')

  t.comment('Options > --log <normal|json>')
  opts = await parseOpts(typicalPkg, argv('--log', 'json'))
  t.equal(opts.log, 'json', '--log json sets log mode to JSON output')
  opts = await parseOpts(typicalPkg, argv('--log', 'explode'))
  t.equal(opts.log, 'normal', '--log with an invalid value will default it to normal output')

  t.comment('Options > --optimize <level>')
  opts = await parseOpts(typicalPkg, argv('--optimize', '0'))
  t.equal(opts.optimize, 0, '--optimize 0 disables optimizations')
  opts = await parseOpts(typicalPkg, argv('--optimize', '1'))
  t.equal(opts.optimize, 1, '--optimize 1 enables optimizations')
  opts = await parseOpts(typicalPkg, argv('--optimize', 'all-of-the-things'))
  t.equal(opts.optimize, 0, 'setting --optimize to a non-numeric value defaults to 0')
  opts = await parseOpts(typicalPkg, argv('--optimize', '-1'))
  t.equal(opts.optimize, 0, 'setting --optimize to a negative value defaults to 0')

  t.comment('Options > --target-browsers')
  opts = await parseOpts(typicalPkg, argv('--target-browsers', 'last 3 versions, Chrome 48'))
  t.deepEqual(opts.targetBrowsers, ['last 3 versions', 'Chrome 48'], '--target-browsers allows multiple queries')
  opts = await parseOpts(typicalPkg, argv('--target-browsers', 'false'))
  t.equal(opts.targetBrowsers, false, '--target-browsers can be disabled')

  t.comment('Options > --target-node')
  opts = await parseOpts(typicalPkg, argv('--target-node', '8'))
  t.equal(opts.targetNode, 8, '--target-node parses numbers')
  opts = await parseOpts(typicalPkg, argv('--target-node', 'false'))
  t.equal(opts.targetNode, false, '--target-node can be disabled')
  opts = await parseOpts(typicalPkg, argv('--target-node', 'current'))
  t.equal(opts.targetNode, 'current', '--target-node can be "current"')
  opts = await parseOpts(typicalPkg, argv('--target-node', 'bleh'))
  t.equal(opts.targetNode, false, '--target-node with an invalid value will default it to false')
})

function generateCombinations(flags) {
  return combinations(Object.keys(flags))
    .toArray().slice(1)
    .reduce((all, names) => {
      let vals = names.map(f => flags[f])
      let opts = matrixCombinations(...vals).toArray()

      return all.concat(opts.map(vals =>
        vals.reduce((test, val, i) => {
          let flag = names[i]

          if (val === undefined) {
            test.input.push(flag)
            test.expected[flag] = true
          } else {
            test.input.push(`${flag}:${val}`)
            test.expected[flag] = val
          }

          return test
        }, { input: [], expected: {} })
      ))
    }, [])
}
