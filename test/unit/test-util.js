import { dirname } from 'path'
import { read as readPkg } from '../../src/util/pkg'
import deferred from 'thenify'

export const pkgRoot = dirname(require.resolve('../../package.json'))

export async function readFixture(name) {
  let root = `${pkgRoot}/test/fixtures/${name}`
  let pkg = await readPkg(root)
  return pkg
}

export function loadUnit(path) { 
  return require(`${pkgRoot}/lib/${path}`)
}