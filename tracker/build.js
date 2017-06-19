import { createTrackDb } from '../web/src/models/track'
import { createAccessDb } from '../web/src/models/access'

console.log('Create required databases')
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
