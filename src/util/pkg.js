import readPkg from 'read-package-json'
import pkgInfo from 'pkginfo'
import deferred from 'thenify'

export let read = deferred(readPkg)
export let find = pkgInfo.find