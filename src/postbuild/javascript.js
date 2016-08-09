import { slurp } from '../util/file'
import min from './min'

export default function configure(pkg, opts) {
  return min(/\.js$/, file => slurp(file, 'utf8'))
}