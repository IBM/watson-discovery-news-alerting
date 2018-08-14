/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import uuid from 'uuid'
import { getCloudantService } from '../bluemix/config'
import { today, tomorrow } from './frequency'

const dbName = 'access'
const cloudant = getCloudantService()

// Create the access database (storing codes/tokens) and establishing its indexes
export async function createAccessDb() {
  const dbs = await cloudant.db.list()
  if (dbs.includes(dbName)) {
    console.info('Database already exists: %s', dbName)
  } else {
    console.info('Creating database: %s', dbName)
    await cloudant.db.create(dbName)
  }
  const accessDb = cloudant.db.use(dbName)

  // Index corresponds to the search which includes (where not used and expiresAt < now)
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

  // The code's _id becomes the secret shared to the front-end
  const code = await accessDb.insert({
      used: false,
      email: email,
      expiresAt: tomorrow()
    },
    uuid.v4())

  return code.id
}

export async function useCode(codeId) {
  const accessDb = cloudant.db.use(dbName)

  const code = await accessDb.get(codeId)
  if (code.used || code.expiresAt < today()) {
    console.error('Tried to use an already used code: %s', JSON.stringify(code))
    throw new Error('Invalid code error')
  }

  return code.email
}
