import Cloudant from 'cloudant'
import uuid from 'uuid'
import { getCredentials } from '../bluemix/config'
import { day, week, month, yesterday, lastWeek, lastMonth } from './frequency'
import { useCode } from './access'

const dbName = 'track'
const credentials = getCredentials('cloudantNoSQLDB')

const cloudant = Cloudant({
  account: credentials.username,
  password: credentials.password,
  plugin: 'promises'
})

export async function createTrackDb() {
  const dbs = await cloudant.db.list()
  if (dbs.includes(dbName)) {
    console.info('Database already exists: %s', dbName)
  } else {
    console.info('Creating database: %s', dbName)
    await cloudant.db.create(dbName)
  }
  const trackDb = cloudant.db.use(dbName)

  await trackDb.index({
    name: 'subscriberFrequencyIndex',
    type: 'json',
    index: {
      fields: [
        'subscribed',
        'frequency',
        'lastUpdate'
      ]
    }
  })

  await trackDb.index({
    name: 'emailIndex',
    type: 'json',
    index: {
      fields: [
        'email'
      ]
    }
  })

  return trackDb
}

export async function track(email, query, frequency) {
  const trackDb = cloudant.db.use(dbName)
  const result = await trackDb.insert({
      email: email,
      query: query,
      subscribed: true,
      destinationEmail: true,
      destinationSlack: false,
      frequency: frequency,
      lastUpdate: null
    },
    uuid.v4())

  return result
}

export async function getSubscribers(frequency) {
  let lastUpdated = null

  if (frequency === 'daily') {
    lastUpdated = yesterday()
  } else if (frequency === 'weekly') {
    lastUpdated = lastWeek()
  } else if (frequency === 'monthly') {
    lastUpdated = lastMonth()
  }

  console.log('Checking for subscribers updated before %s.', lastUpdated)
  const trackDb = cloudant.db.use(dbName)
  const subscribers = await trackDb.find({
    selector: {
      $and: [
        {
          subscribed: true
        },
        {
          frequency: frequency
        },
        {
          $or: [
            {
              lastUpdate: null
            },
            {
              lastUpdate: {
                $lt: lastUpdated
              }
            }
          ]
        }
      ]
    }
  })

  return subscribers
}

export async function subscriptionsByEmail(email) {
  const trackDb = cloudant.use(dbName)

  const subscriptions = await trackDb.find({
    selector: {
      $and: [
        {
          subscribed: true
        },
        {
          email: email
        }
      ]
    }
  })

  return subscriptions
}

export async function unsubscribe(code, id) {
  const trackDb = cloudant.use(dbName)
  const accessEmail = await useCode(code)
  const subscription = await trackDb.get(id)

  if (subscription && subscription.email === accessEmail) {
    subscription.subscribed = false
    await trackDb.insert(subscription)
  } else {
    throw new Error('No subscription by that id')
  }
}

export async function updateDestination(code, id, destinationEmail, destinationSlack) {
  const trackDb = cloudant.use(dbName)
  const accessEmail = await useCode(code)
  const subscription = await trackDb.get(id)

  if (subscription && subscription.email === accessEmail) {
    subscription.destinationEmail = destinationEmail
    subscription.destinationSlack = destinationSlack

    await trackDb.insert(subscription)
  } else {
    throw new Error('No subscription by that id')
  }
}

export async function subscriberUpdated(subscriber) {
  const trackDb = cloudant.use(dbName)
  subscriber.lastUpdate = new Date()
  await trackDb.insert(subscriber)
}
