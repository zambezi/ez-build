import test from 'tape-async'
import { is } from 'funkis'
import { loadUnit, readFixture } from '../test-util.js'

test('Options parser', async t => {
  t.plan(80)

  const barePkg = await readFixture('bare-project')
      , { default: parseOpts } = await loadUnit('cli/opts')

  const defaults = await parseOpts(barePkg, argv())

  t.comment('Option defaults')
  t.equal(defaults.src, 'src', '-i,--src defaults to src')
  t.equal(defaults.lib, 'lib', '-L,--lib defaults to lib')
  t.equal(defaults.out, 'bare-project-min', '-o,--out defaults to bare-project-min')

  t.comment('Option defaults: -I,--include')
  t.deepEqual(defaults.include['copy-files'], [ '**/*' ], 'copy-files include defaults to **/*')
  t.deepEqual(defaults.include['css'], [ '**/*.css' ], 'css include defaults to **/*.css')
  t.deepEqual(defaults.include['js'], [ '**/*.js' ], 'js include defaults to ')

  t.comment('Option defaults: -X,--exclude')
  t.deepEqual(defaults.exclude['*'], [ 'node_modules', 'package.json', '.*', '*-min.js', '*-min.js.map', '*-min.css', '*-min.css.map', '*-debug.log', 'optimised-modules.json', 'dependencies.json' ], '* defaults to node_modules,package.json,.*,*-min.js,*-min.js.map,*-min.css,*-min.css.map,*-debug.log,optimised-modules.json,dependencies.json')
  t.deepEqual(defaults.exclude['copy-files'], [ '**/*.js', '**/*.css', 'node_modules', 'package.json', '.*', '*-min.js', '*-min.js.map', '*-min.css', '*-min.css.map', '*-debug.log', 'optimised-modules.json', 'dependencies.json' ], 'copy-files defaults to **/*.js,**/*.css,node_modules,package.json,.*,*-min.js,*-min.js.map,*-min.css,*-min.css.map,*-debug.log,optimised-modules.json,dependencies.json')
  t.deepEqual(defaults.exclude['css'], [ 'node_modules', 'package.json', '.*', '*-min.js', '*-min.js.map', '*-min.css', '*-min.css.map', '*-debug.log', 'optimised-modules.json', 'dependencies.json' ], 'copy-files defaults to node_modules,package.json,.*,*-min.js,*-min.js.map,*-min.css,*-min.css.map,*-debug.log,optimised-modules.json,dependencies.json')
  t.deepEqual(defaults.exclude['js'], [ 'node_modules', 'package.json', '.*', '*-min.js', '*-min.js.map', '*-min.css', '*-min.css.map', '*-debug.log', 'optimised-modules.json', 'dependencies.json' ], 'copy-files defaults to node_modules,package.json,.*,*-min.js,*-min.js.map,*-min.css,*-min.css.map,*-debug.log,optimised-modules.json,dependencies.json')

  t.equal(defaults.optimize, 0, '-O,--optimize defaults to 0')
  t.equal(defaults.copy, true, '--no-copy defaults to false')
  t.equal(defaults.debug, true, '--no-debug defaults to false')
  t.equal(defaults.log, 'normal', '--log defaults to normal')
  t.deepEqual(defaults.flags, { modules: 'umd' }, '--flags defaults to modules:umd')

  t.comment('Setting build flags')
  await Promise.all(
    [ { 'es2017': true }
    , { 'add-module-exports': true }
    , { 'es2017': true, 'add-module-exports': true }
    , { 'add-module-exports': true, 'es2017': true }
    , { 'modules': 'umd' }
    , { 'modules': 'amd' }
    , { 'modules': 'none' }
    , { 'modules': 'commonjs' }
    , { 'modules': 'systemjs' }
    , { 'modules': 'umd', 'es2017': true }
    , { 'modules': 'amd', 'es2017': true }
    , { 'modules': 'none', 'es2017': true }
    , { 'modules': 'commonjs', 'es2017': true }
    , { 'modules': 'systemjs', 'es2017': true }
    , { 'modules': 'umd', 'add-module-exports': true }
    , { 'modules': 'amd', 'add-module-exports': true }
    , { 'modules': 'none', 'add-module-exports': true }
    , { 'modules': 'commonjs', 'add-module-exports': true }
    , { 'modules': 'systemjs', 'add-module-exports': true }
    , { 'modules': 'umd', 'es2017': true, 'add-module-exports': true }
    , { 'modules': 'amd', 'es2017': true, 'add-module-exports': true }
    , { 'modules': 'none', 'es2017': true, 'add-module-exports': true }
    , { 'modules': 'commonjs', 'es2017': true, 'add-module-exports': true }
    , { 'modules': 'systemjs', 'es2017': true, 'add-module-exports': true }
    , { 'modules': 'umd', 'add-module-exports': true, 'es2017': true }
    , { 'modules': 'amd', 'add-module-exports': true, 'es2017': true }
    , { 'modules': 'none', 'add-module-exports': true, 'es2017': true }
    , { 'modules': 'commonjs', 'add-module-exports': true, 'es2017': true }
    , { 'modules': 'systemjs', 'add-module-exports': true, 'es2017': true }

    ].map(async specifiedFlags => {
      let specifiedFlagsCLI = Object.keys(specifiedFlags).map(flag => {
        let value = specifiedFlags[flag]
        return is(Boolean, value)? flag : `${flag}:${value}`
      }).join(',')

      let opts = await parseOpts(barePkg, argv('--flags', specifiedFlagsCLI))
      t.comment(`--flags ${specifiedFlagsCLI}`)

      Object.keys(defaults.flags).forEach(flag => {
        if (flag in specifiedFlags) return
        let value = opts.flags[flag]
        let defaultValue = defaults.flags[flag]
        t.equal(value, defaultValue, `${flag} defaults to ${defaultValue}`)
      })

      Object.keys(specifiedFlags).forEach(flag => {
        let value = opts.flags[flag]
        t.equal(value, specifiedFlags[flag], `${flag} set to ${specifiedFlags[flag]}`)
      })
    })
  )
})

function argv(... args) {
  return ['node', 'ez-build', ... args]
}