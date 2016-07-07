import { readFile } from 'fs'
import outputFile from 'output-file'
import deferred from 'thenify'
import glob from 'glob'

export let put = deferred(outputFile)
export let slurp = deferred(readFile)
export let find = deferred(glob)
