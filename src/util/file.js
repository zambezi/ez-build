import { readFile } from 'fs'
import { dirname, resolve } from 'path'
import deferred from 'thenify'
import glob from 'glob'
import mkdirp from 'mkdirp'
import writeFile from 'write-file-atomic'

export let slurp = deferred(readFile)
export let find = deferred(glob)

export async function put(filename, data) {
  const path = dirname(resolve(filename))
  await deferred(mkdirp)(path)
  return await deferred(writeFile)(filename, data)
}
