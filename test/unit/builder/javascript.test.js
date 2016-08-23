import test from 'tape-async'
import { loadUnit, readFixture } from '../test-util.js'

test('JavaScript builder', async t => {
  t.plan(7)

  const pkg = await readFixture('typical-project')
      , { default: configure } = await loadUnit('builder/javascript')

  const opts =
        { flags: {}
        , lib: pkg.directories.lib
        , src: pkg.directories.src
        }

  const srcMap = '\n//# sourceMappingURL=a.js.map'

  t.comment('building with source maps')
  opts.debug = true
  let debugBuild = configure(pkg, opts)
  let { files: debug } = await debugBuild('a', `${pkg.root}/${pkg.directories.src}/a.js`)
  t.ok(debug['a.js'], 'debug build includes a.js')
  t.ok(debug['a.js.map'], 'debug build includes a.js.map')
  t.equal(debug['a.js'].slice(-srcMap.length), srcMap, 'debug build has source map comment at the end')
  
  t.comment('building without source maps')
  opts.debug = false
  let releaseBuild = configure(pkg, opts)
  let { files: release } = await releaseBuild('a', `${pkg.root}/${pkg.directories.src}/a.js`)
  t.ok(release['a.js'], 'build includes a.js')
  t.notOk(release['a.js.map'], 'build does not include a.js.map')
  t.notEqual(release['a.js'].slice(-srcMap.length), srcMap, 'build has no source map comment at the end')

  t.comment('general assertions')
  t.equal(debug['a.js'].slice(0, -srcMap.length), release['a.js'], 'without source map comment, builds should be equivalent')
})