import { DiscoveryV1 } from 'watson-developer-cloud'
import { getCredentials } from '../bluemix/config'
import { leftPad } from '../models/frequency'

import { BRAND_ALERTS, PRODUCT_ALERTS, RELATED_BRANDS, POSITIVE_PRODUCT_ALERTS, STOCK_ALERTS } from './constants'

// NOTE, due to the use of async/await, this file is not intended to be imported by the front-end

// These globals are used to cache responses for the requested environment/collection. These might be null but currently are
// only accessed from makeQuery, if you experience a null pointer accessing them then please move them into some protected
// getter logic which will get the proper environment if it isn't set.
let environment = null
let collection = null

async function getFirstDiscoverNewsEnvironment(discovery) {
  return new Promise( (resolve, reject) => {
      discovery.getEnvironments({}, (error, data) => {
        if (error) {
          reject(error)
        } else {
          for (const env of data.environments) {
            if (env.name == 'Watson News Environment') {
              resolve(env)
            }
          }

          reject("No environment named 'Watson News Environment' found")
        }
      })
  })
}

async function getFirstDiscoverNewsCollection(discovery, environment) {
  return new Promise( (resolve, reject) => {
    discovery.getCollections({environment_id: environment.environment_id}, (error, data) => {
      if (error) {
        reject(error)
      } else {
        for (const col of data.collections) {
          if (col.name == 'watson_news') {
            resolve(col)
          }
        }

        reject("No collection named watson_news found")
      }
    })
  })
}

// TODO investigate escaping queries before sending to the discovery service
// This wrapper sets the discover service up and connects to the proper discovery environment and collection before making a query.
//
// All the params are passed straight through.
function makeQuery(params) {
  const credentials = getCredentials('discovery')

  const discovery = new DiscoveryV1({
    username: credentials.username,
    password: credentials.password,
    version_date: '2016-11-07'
  })

  // Using a Promise to allow the use of async/await in other code, this allows calls without callback hell which is important in
  // finding the correct collection, it requires both the environment and a discovery instance.
  return new Promise(async (resolve, reject) => {
    // In order to query the news we need to find it in the list of collections for each environment.
    // Storing these as module global because looking them up requires two subsequent web requests.
    if (!environment || !collection) {
      environment = await getFirstDiscoverNewsEnvironment(discovery)
      collection = await getFirstDiscoverNewsCollection(discovery, environment)
    }

    params.environment_id = environment.environment_id
    params.collection_id = collection.collection_id

    // The SDK isn't setup for promises, wrapping in one so that we may use async/await with other calls to these functions
    discovery.query(params, (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

export function getBrandAlerts(brandName, lastUpdatedAt=null) {
  const params = {
    query: `${encodeURIComponent(brandName)},enrichedTitle.entities.type:Company,enrichedTitle.entities.relevance>0.8,blekko.documentType:news`,
    filter: 'blekko.lang:en,enrichedTitle.language:english,blekko.documentType:news',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'alchemyapi_text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return makeQuery(params)
}

export function getProductAlerts(productName, lastUpdatedAt=null) {
  const params = {
    query: `${encodeURIComponent(productName)},blekko.documentType:news`,
    filter: 'blekko.lang:en,enrichedTitle.language:english,blekko.documentType:news',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'alchemyapi_text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return makeQuery(params)
}

export async function getRelatedBrands(brandName, lastUpdatedAt=null) {
  // Find more information about the brand to then explicitly exclude from queries
  const brandParams = {
    query: brandName,
    filter: `blekko.lang:en,enrichedTitle.language:english,blekko.documentType:news`,
    count: 50,
    return: 'taxonomy'
  }
  const brandResults = await makeQuery(brandParams)

  // This is a fairly complex chain of reduce/filter/map which is used to post process the taxonomies coming back from the
  // list of articles related to the brand name.
  //
  // In the end, this is chosing the top taxonomy found in the list of results for the brandname
  const taxonomies = brandResults.results
    .reduce((acc, val) => acc.concat(val.taxonomy), [])
    .filter((taxonomy) => taxonomy.confident !== 'no' && taxonomy.score > 0.5)
    .reduce((acc, val) => {
      const key = val.label.split('/').splice(1,2).join('/')
      let found = false

      // A weighted score where the score is a number between 0-1 and each is weighted with a 1 to allow the number
      // of repeat occurances to equalize the scoring
      for (const existing of acc) {
        if (existing.label === key) {
          existing.count += 1 + val.score
          found = true
        }
      }
      if (!found) {
        acc.push({label: key, count: 1 + val.score})
      }

      return acc
    }, [])
    .sort((a, b) => b.count - a.count)
    .map((taxonomyCount) => `(taxonomy.label:/${taxonomyCount.label},taxonomy.score>0.5,taxonomy.confident::!no)`)

  // First attempt was to use the disambiguated name but that rarely results in anything, because many entities don't have
  // a disambiguated value
  /*const subTypes = brandResults.results
    .reduce((acc, val) => acc.concat(val.entities), [])
    .filter((entity) => entity.disambiguated.name === brandName)
    .reduce((acc, val) => acc.concat(val.disambiguated.subType), [])
    .reduce((acc, val) => acc.indexOf(val) === -1 ? acc.concat(val) : acc, [])
    .map((subType) => `(entities.disambiguated.subType:${subType},entities.relevance>0.8)`)*/

  const params = {
    query: taxonomies.splice(0, 1).join('|'),
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    filter: `blekko.lang:en,enrichedTitle.language:english,(enrichedTitle.entities.type:Company,enrichedTitle.entities.relevance>0.8,enrichedTitle.entities.text:!${brandName}),entities.disambiguated.name:!${brandName},blekko.documentType:news`,
    return: 'alchemyapi_text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return await makeQuery(params)
}

export function getPositiveProductAlerts(productName, lastUpdatedAt=null) {
  const params = {
    query: `${productName},docSentiment.type::positive`,
    filter: 'blekko.lang:en,enrichedTitle.language:english,blekko.documentType:news,(docSentiment.type::positive,docSentiment.score>0.5)',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'alchemyapi_text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return makeQuery(params)
}

export function getStockAlerts(stockSymbol, lastUpdatedAt=null) {
  const params = {
    query: `${stockSymbol},enrichedTitle.relations.action.verb.text:[downgrade|upgrade],enrichedTitle.relations.subject.entities.type::Company`,
    filter: 'blekko.lang:en,enrichedTitle.language:english,blekko.documentType:news',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'alchemyapi_text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return makeQuery(params)
}

// Warning, this method mutates the params hash and possible adds to the filtering if lastUpdatedAt exists
// NOTE if implementing, it'd work better to convert all this logic into a single class because there is quite a bit of duplication.
function addDateFilter(params, lastUpdatedAt) {
  if (lastUpdatedAt) {
    // Uncertain why but often Cloudant returns dates as strings, might be related to misconfigured indexes.
    if (typeof lastUpdatedAt === 'string') {
      // NOTE this is a likely cause of bugs, what if the string is malformed? Will it give an irrelevant date in response?
      // Assuming the date is in ISO8601 format
      lastUpdatedAt = new Date(lastUpdatedAt)
    }
    const day = leftPad(lastUpdatedAt.getDate(), '0', 2)
    const month = leftPad(lastUpdatedAt.getMonth() + 1, '0', 2)  // JavaScript Dates start at 0 but Watson's start at 1
    const year = lastUpdatedAt.getFullYear()

    // This will mutate the params hash
    params.filter = `${params.filter},yyyymmdd>=${year}${month}${day}`
  }
}

export function validQueryName(queryName) {
  return [
    BRAND_ALERTS,
    PRODUCT_ALERTS,
    RELATED_BRANDS,
    POSITIVE_PRODUCT_ALERTS,
    STOCK_ALERTS
  ].indexOf(queryName) !== -1
}

// Trying to avoid duck typing the names and using this case statement to make the correct query against Discover Service
export async function getAlertsByQuery(query, keyword, lastUpdatedAt=null) {
  switch (query) {
    case BRAND_ALERTS:
      return await getBrandAlerts(keyword, lastUpdatedAt)
      break
    case PRODUCT_ALERTS:
      return await getProductAlerts(keyword, lastUpdatedAt)
      break
    case RELATED_BRANDS:
      return await getRelatedBrands(keyword, lastUpdatedAt)
      break
    case POSITIVE_PRODUCT_ALERTS:
      return await getPositiveProductAlerts(keyword, lastUpdatedAt)
      break
    case STOCK_ALERTS:
      return await getStockAlerts(keyword, lastUpdatedAt)
      break
    default:
      console.error('Unknown query! %s', query)
      break
  }
}
