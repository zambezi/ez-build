import readPkg from 'read-package-json'
import deferred from 'thenify'
import { dirname, resolve, relative, join } from 'path'

export async function read(path) {
  const pkgFile = find(path)
  const pkg = await deferred(readPkg)(pkgFile)

  pkg.root = dirname(pkgFile)
  pkg.resolve = (path) => relative(process.cwd(), resolve(pkg.root, path))
  pkg.relative = (path) => relative(pkg.root, resolve(pkg.root, path))

  pkg.directories || (pkg.directories = {})

  return pkg
}

export function find(path) {
  path = resolve(path || process.cwd())

  if (path === resolve('/')) throw new Error('Unable to find package.json')

  try {
    return require.resolve(join(path, 'package.json'))
  } catch (e) {
    return find(dirname(path))
  }
}