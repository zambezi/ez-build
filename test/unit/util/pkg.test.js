import test from 'tape-async'
import { join } from 'path'
import { pkgRoot } from '../test-util'
import { find, read } from '../../../lib/util/pkg'
import { is, src } from 'funkis'

test('Package util', t => {
  t.plan(2)

  const paths =
    [ pkgRoot
    , __dirname
    , '../'
    , './'
    , '.'
    , ''
    , null
    , undefined
    ]

  t.test('find()', t => {
    t.plan(8)

    const pushd = process.cwd()
    process.chdir(__dirname)

    const expected = join(pkgRoot, 'package.json')

    paths.forEach(path => {
      const arg = path === undefined? '' : src(path)
      t.equal(expected, find(path), `find(${arg}) => ${pkgRoot}`)
    })

    process.chdir(pushd)
  })

  t.test('read()', async t => {
    t.plan(4)
    const pkg = await read(pkgRoot)

    t.equal(pkgRoot, pkg.root, 'pkg.root should be set')
    t.ok(is(Function, pkg.resolve), 'pkg.resolve is a function')
    t.ok(is(Function, pkg.relative), 'pkg.relative is a function')
    t.ok(is(Object, pkg.directories), 'pkg.directories is an object')
  })
})