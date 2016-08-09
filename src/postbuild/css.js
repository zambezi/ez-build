import rebaseProdCss from './rebase-prod-css'
import min from './min'

export default function configure(pkg, opts) {
  return min(/\.css$/, file => rebaseProdCss(pkg, file))
} 