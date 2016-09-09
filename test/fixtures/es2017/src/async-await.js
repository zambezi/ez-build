
async function wibble() {
  await delay(50)
  console.log('A-OK!')
}

function delay(duration) {
  return new Promise(resolve => {
    setTimeout(resolve, duration)
  })
}

export default {}

wibble()