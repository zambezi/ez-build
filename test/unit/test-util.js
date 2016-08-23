import { dirname } from 'path'
import readPkg from 'read-package-json'
import deferred from 'thenify'

export const pkgRoot = dirname(require.resolve('../../package.json'))

export async function readFixture(name) {
  let root = `${pkgRoot}/test/fixtures/${name}`
  let pkg = await deferred(readPkg)(`${root}/package.json`)
  pkg.root = root
  return pkg
}

export function loadUnit(path) { 
  return require(`${pkgRoot}/src/${path}`)
}