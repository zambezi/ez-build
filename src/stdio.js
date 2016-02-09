export default function out(...args) {
  console.log.call(console, ...args)
}

export function err(...args) {
  console.error.call(console, ...args)
}

export function debug(...args) {
  process.env.DEBUG && err('#', ...args)
}