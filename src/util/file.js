import { readFile } from 'fs'
import outputFile from 'output-file'
import deferred from 'thenify'
import glob from 'glob'

export const put = deferred(outputFile)
export const slurp = deferred(readFile)
export const find = deferred(glob)
