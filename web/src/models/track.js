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

// Create the "Tracking" DB which is where all the subscribers are stored
// TODO I'd prefer this named Subscribers so that it's clear what the contents of the DB are.
export async function createTrackDb() {
  const dbs = await cloudant.db.list()
  if (dbs.includes(dbName)) {
    console.info('Database already exists: %s', dbName)
  } else {
    console.info('Creating database: %s', dbName)
    await cloudant.db.create(dbName)
  }
  const trackDb = cloudant.db.use(dbName)

  // Used by the periodic notifications to find subscribers
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

  // Used when listing the set of subscriptions tied to an email address
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

// It'd be better to call this trackEmail or something along those lines, it inserts a new subscriber into the DB
export async function track(email, query, keyword, frequency) {
  const trackDb = cloudant.db.use(dbName)
  const result = await trackDb.insert({
      email: email,
      query: query,
      keyword: keyword,
      subscribed: true,
      destinationEmail: true,
      destinationSlack: false,
      frequency: frequency,
      lastUpdate: null
    },
    uuid.v4())

  return result
}

// Kinda crazy selector used with Cloudant to get a list of anyone subscribed to recieve and update which hasn't recieved one in
// their chosen time frame (frequency)
export async function getSubscribers(destinationEmail, destinationSlack) {
  console.log('Checking for subscribers of any frequency.')
  const trackDb = cloudant.db.use(dbName)
  const query = {
    selector: {
      $and: [
        {
          subscribed: true
        },
        {
          $or: [
            {
              $and: [
                {
                  frequency: 'daily'
                },
                {
                  $or: [
                    {
                      lastUpdate: null
                    },
                    {
                      lastUpdate: {
                        $lt: yesterday()
                      }
                    }
                  ]
                }
              ]
            },
            {
              $and: [
                {
                  frequency: 'weekly'
                },
                {
                  $or: [
                    {
                      lastUpdate: null
                    },
                    {
                      lastUpdate: {
                        $lt: lastWeek()
                      }
                    }
                  ]
                }
              ]
            },
            {
              $and: [
                {
                  frequency: 'monthly'
                },
                {
                  $or: [
                    {
                      lastUpdate: null
                    },
                    {
                      lastUpdate: {
                        $lt: lastMonth()
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    }
  }

  // Limit the query if it's only requesting email subscribers, avoid trying to send to people who aren't subscribed to emails.
  if (destinationEmail) {
    query.selector.$and.push(
      {
        destinationEmail: destinationEmail
      })
  }

  if (destinationSlack) {
    query.selector.$and.push(
      {
        destinationSlack: destinationSlack
      })
  }

  const subscribers = await trackDb.find(query)

  return subscribers
}

// List the subscriptions for a certain email address (or Slack email)
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
    subscription.subscribed = false  // Instead of destroying the subscription row, just disable the record
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

// A subscription Email or Slack has been sent, avoid sending at the incorrect frequency
export async function subscriberUpdated(subscriber) {
  const trackDb = cloudant.use(dbName)
  subscriber.lastUpdate = new Date()
  await trackDb.insert(subscriber)
}
