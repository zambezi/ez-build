export function then(fn, ...args) {
  return (handleResult) => {
    return new Promise((resolve, reject) => {
      fn(...args, (err, ...result) => {
        if (err) {
          reject(err)
        } else {
          resolve(handleResult(...result))
        }
      })
    })
  }
}