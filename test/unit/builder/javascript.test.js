import test from 'tape-async'
import { loadUnit, readFixture, argv } from '../test-util.js'
import { default as preset_stage_0 } from 'babel-preset-stage-0'
import { default as preset_stage_1 } from 'babel-preset-stage-1'
import { default as preset_stage_2 } from 'babel-preset-stage-2'
import { default as preset_stage_3 } from 'babel-preset-stage-3'

test('JavaScript builder', async t => {
  t.plan(11)

  const pkg = await readFixture('typical-project')
      , { default: configure } = await loadUnit('builder/javascript')
      , { default: parseOpts } = await loadUnit('cli/opts')

  const srcMap = '\n//# sourceMappingURL=a.js.map'

  t.comment('building with source maps')
  const debugBuild = configure(pkg,
    await parseOpts(pkg, argv())
  )
  const { files: debug } = await debugBuild('a', `${pkg.root}/${pkg.directories.src}/a.js`)
  t.ok(debug['a.js'], 'debug build includes a.js')
  t.ok(debug['a.js.map'], 'debug build includes a.js.map')
  t.equal(debug['a.js'].slice(-srcMap.length), srcMap, 'debug build has source map comment at the end')
  
  t.comment('building without source maps')
  const releaseBuild = configure(pkg,
    await parseOpts(pkg, argv('--no-debug'))
  )
  const { files: release } = await releaseBuild('a', `${pkg.root}/${pkg.directories.src}/a.js`)
  t.ok(release['a.js'], 'build includes a.js')
  t.notOk(release['a.js.map'], 'build does not include a.js.map')
  t.notEqual(release['a.js'].slice(-srcMap.length), srcMap, 'build has no source map comment at the end')

  t.comment('general assertions')
  t.equal(debug['a.js'].slice(0, -srcMap.length), release['a.js'], 'without source map comment, builds should be equivalent')

  t.comment('building with es-stage flag set')
  await Promise.all(
    [ preset_stage_0
    , preset_stage_1
    , preset_stage_2
    , preset_stage_3
    ].map(async (stage, i) => {
      const build = configure(pkg,
        await parseOpts(pkg, argv('--flags', `es-stage:${i}`))
      )

      const { presets } = build.config
      t.ok(presets.some(preset => preset === stage), `--flags es-stage:${i} enables the stage ${i} preset`)
    })
  )
})