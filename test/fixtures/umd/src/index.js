import { readFileSync } from 'fs'
import { resolve } from 'path'

exports = undefined

// The order of imports is important
importGlobal('./baz/fizzbuzz')
importGlobal('./baz/wonderland')
importGlobal('./bar')
importGlobal('./down/the-rabbit-hole/we/go/alice')

let bar = testUmdLibBar.default
let alice = testUmdLibDownTheRabbitHoleWeGoAlice.default

console.log(`${bar()}${alice()}`) // Should print OK

function importGlobal(path) {
  let globalEval = eval
  globalEval(readFileSync(resolve(__dirname, `${path}.js`), 'utf8'))
}