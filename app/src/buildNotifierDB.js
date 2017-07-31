import {} from 'dotenv/config'

import { createTrackDb } from './models/track'
import { createAccessDb } from './models/access'

console.log('Creating required databases')

/*eslint no-unused-vars: ["error", { "args": "none" }]*/
createTrackDb()
  .then((result) => {
    console.log('Track DB created')
  })
  .catch(console.error)

createAccessDb()
  .then((result) => {
    console.log('Access DB created')
  })
  .catch(console.error)
console.log('Completed creating required databases')
