import { is } from 'funkis'

const all = Promise.all.bind(Promise)

export default function min(filter, process) {
  let test
  
  if (is(RegExp, filter)) {
    test = file => filter.test(file)
  }

  return async function(pipe) {
    let content = []

    for (let unit of pipe) {
      let files = (unit.files || []).filter(test)
      content.push(... await all(files.map(process)))
    }

    return content.join('\n')
  }
}