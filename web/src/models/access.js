import Cloudant from 'cloudant'
import uuid from 'uuid'
import { getCredentials } from '../bluemix/config'
import { nextMonth } from './frequency'

const dbName = 'access'
const credentials = getCredentials('cloudantNoSQLDB')

const cloudant = Cloudant({
  account: credentials.username,
  password: credentials.password,
  plugin: 'promises'
})

export async function createAccessDb() {
  const dbs = await cloudant.db.list()
  if (dbs.includes(dbName)) {
    console.info('Database already exists: %s', dbName)
  } else {
    console.info('Creating database: %s', dbName)
    await cloudant.db.create(dbName)
  }
  const accessDb = cloudant.db.use(dbName)

  await accessDb.index({
    name: 'oneTimePassword',
    type: 'json',
    index: {
      fields: [
        'used',
        'expiresAt'
      ]
    }
  })

  return accessDb
}

export async function createCode(email) {
  const accessDb = cloudant.db.use(dbName)

  const code = await accessDb.insert({
      used: false,
      email: email,
      expiresAt: nextMonth()
    },
    uuid.v4())

  return code.id
}

export async function useCode(codeId) {
  const accessDb = cloudant.db.use(dbName)

  const code = await accessDb.get(codeId)
  if (code.used) {
    console.error('Tried to use an already used code: %s', JSON.stringify(code))
    throw new Error('Invalid code error')
  }

  // use the code and update the db
  code.used = true
  await accessDb.insert(code)

  return code.email
}
