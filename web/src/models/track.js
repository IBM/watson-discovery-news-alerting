import Cloudant from 'cloudant'
import uuid from 'uuid'
import { getCredentials } from '../bluemix/config'

const dbName = 'tracking'
const credentials = getCredentials('cloudantNoSQLDB')

const cloudant = Cloudant({
  account: credentials.username,
  password: credentials.password,
  plugin: 'promises'
})

async function createTrackingDb(cloudant) {
  const dbName = dbName
  const dbs = await cloudant.db.list()
  if (dbs.includes(dbName)) {
    console.info('Database already exists: %s', dbName)
  } else {
    console.info('Creating database: %s', dbName)
    await cloudant.db.create(dbName)
  }
  const trackingDb = cloudant.db.use(dbName)

  return trackingDb
}

export async function track(email, query, frequency) {
  const trackingDb = cloudant.db.use(dbName)
  const result = await trackingDb.insert({
      email: email,
      query: query,
      frequency: frequency,
      lastUpdate: null
    },
    uuid.v4())

  return result
}
