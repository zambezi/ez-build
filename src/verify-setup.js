import { execSync as exec } from 'child_process'
import { accessSync as exists } from 'fs'
import { resolve } from 'path'
import { satisfies as compatible } from 'semver'

import { err, debug } from './stdio'

const keys = Object.keys

const required =
      { "babel-cli": "^6.5.1"
      , "babel-plugin-transform-es2015-modules-amd": "^6.5.0"
      , "babel-preset-es2015": "^6.5.0"
      }

export default function verify(root) {
  let installed = JSON.parse(exec('npm list --depth 0 --json || true', { cwd: root, stdio: [undefined, undefined, 'ignore'] }))
    , toInstall = []
    , incompatible = []

  debug('Verifying dependencies:')

  keys(required).forEach(name => {
    const notInstalled = (name in installed.dependencies === false)
        , dep = `${name}@${required[name]}`

    if (notInstalled) {
      debug(`- ${dep}: ERR! Not installed.`)
      toInstall.push(dep)
    } else {
      const actual = installed.dependencies[name].version

      if (compatible(actual, required[name])) {
        debug(`- ${dep}: OK! found compatible ${actual}`)
      } else {
        incompatible.push(`- needed ${dep}; found ${name}@${actual}`)
        debug(incompatible[incompatible.length - 1])
      }
    }
  })

  if (incompatible.length) {
    err('Incompatible dependencies:')
    incompatible.forEach(msg => err(msg))

    err(`
      To continue, you may remove the offending dependencies from
      your project; ez-build will install any missing dependencies
      automatically.

      If you do wish to override ez-build dependencies in your
      project, please note the following requirements:

      ${JSON.stringify(required, null, 2)}

      You may override any or all of these dependencies, but the
      version must satisfy a semver compatibility check.
    `.replace(/^      /gm, ''))
    process.exit(1)
  } else if (toInstall.length) {
    console.error('Automatically installing missing but required dependencies:')
    toInstall.forEach(dep => console.error(`- ${dep}`))

    exec(`npm install ${toInstall.join(' ')}`,
      { cwd: root
      , stdio: 'inherit'
      }
    )
  }
}