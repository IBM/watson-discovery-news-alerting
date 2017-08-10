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

/*eslint no-use-before-define: ["error", { "functions": false }]*/

import { DiscoveryV1 } from 'watson-developer-cloud'
import { getCredentials } from '../bluemix/config'
import { leftPad } from '../models/frequency'

import { BRAND_ALERTS, PRODUCT_ALERTS, RELATED_BRANDS, POSITIVE_PRODUCT_ALERTS, STOCK_ALERTS } from './constants'

// NOTE, due to the use of async/await, this file is not intended to be imported by the front-end

// TODO investigate escaping queries before sending to the discovery service
// This wrapper sets the discover service up and connects to the proper discovery environment and collection before making a query.
//
// All the params are passed straight through.
function makeQuery(params) {
  const credentials = getCredentials('discovery')

  const discovery = new DiscoveryV1({
    username: credentials.username,
    password: credentials.password,
    version_date: '2017-08-01'
  })

  // Using a Promise to allow the use of async/await in other code, this allows calls without callback hell which is important in
  // finding the correct collection, it requires both the environment and a discovery instance.
  return new Promise(async (resolve, reject) => {
    // Watson News now uses pre-defined env and coll id values
    params.environment_id = 'system'
    params.collection_id = 'news'

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

export function getBrandAlerts(brandName, lastUpdatedAt = null) {
  const params = {
    query: `${encodeURIComponent(brandName)},enriched_title.entities.type:Company,enriched_title.entities.relevance>0.8,source_type:mainstream`,
    filter: 'language:en,source_type:mainstream',
    aggregation: 'timeslice(crawl_date, 1day, America/Los_Angeles)',
    return: 'text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return makeQuery(params)
}

export function getProductAlerts(productName, lastUpdatedAt = null) {
  const params = {
    query: `${encodeURIComponent(productName)},source_type:mainstream`,
    filter: 'language:en,source_type:mainstream',
    aggregation: 'timeslice(crawl_date, 1day, America/Los_Angeles)',
    return: 'text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return makeQuery(params)
}

export async function getRelatedBrands(brandName, lastUpdatedAt = null) {
  // Find more information about the brand to then explicitly exclude from queries
  const brandParams = {
    query: brandName,
    filter: `language:en,source_type:mainstream`,
    count: 50,
    return: 'enriched_text.categories'
  }
  const brandResults = await makeQuery(brandParams)

  // This is a fairly complex chain of reduce/filter/map which is used to post process the taxonomies coming back from the
  // list of articles related to the brand name.
  //
  // In the end, this is chosing the top taxonomy found in the list of results for the brandname
  const taxonomies = brandResults.results
    .reduce((acc, val) => acc.concat(val.enriched_text.categories), [])
    .filter((taxonomy) => taxonomy.score > 0.5)
    .reduce((acc, val) => {
      const key = val.label.split('/').splice(1, 2).join('/')
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
    .map((taxonomyCount) => `(enriched_text.categories.label:/${taxonomyCount.label},enriched_text.categories.score>0.5)`)

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
    aggregation: 'timeslice(crawl_date, 1day, America/Los_Angeles)',
    filter: `language:en,(enriched_title.entities.type:Company,enriched_title.entities.relevance>0.8,enriched_title.entities.text:!${brandName}),enriched_text.entities.disambiguation.name:!${brandName},source_type:mainstream`,
    return: 'text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return await makeQuery(params)
}

export function getPositiveProductAlerts(productName, lastUpdatedAt = null) {
  const params = {
    query: `${productName},enriched_text.sentiment.document.label::positive`,
    filter: 'language:en,source_type:mainstream,(enriched_text.sentiment.document.label::positive,enriched_text.sentiment.document.score>0.5)',
    aggregation: 'timeslice(crawl_date, 1day, America/Los_Angeles)',
    return: 'text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)
  return makeQuery(params)
}

export async function getStockAlerts(stockSymbol, lastUpdatedAt = null) {
  const params = {
    query: `${stockSymbol},enriched_text.semantic_roles.action.verb.text:[downgrade|upgrade],enriched_title.semantic_roles.subject.entities.type::Company`,
    filter: 'language:en,source_type:mainstream',
    aggregation: 'timeslice(crawl_date, 1day, America/Los_Angeles)',
    count: 50,
    return: 'text,title,url'
  }

  addDateFilter(params, lastUpdatedAt)

  // Often there will be duplicated entities which are easiest to find by removing duplicate titles
  const results = await makeQuery(params)
  const uniqueTitles = results.results.reduce((acc, val) => {
    if (!acc.some((v) => v.title === val.title)) {
      acc.push(val)
    }

    return acc
  }, [])

  results.results = uniqueTitles

  return results
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
export async function getAlertsByQuery(query, keyword, lastUpdatedAt = null) {
  switch (query) {
    case BRAND_ALERTS:
      return await getBrandAlerts(keyword, lastUpdatedAt)
    case PRODUCT_ALERTS:
      return await getProductAlerts(keyword, lastUpdatedAt)
    case RELATED_BRANDS:
      return await getRelatedBrands(keyword, lastUpdatedAt)
    case POSITIVE_PRODUCT_ALERTS:
      return await getPositiveProductAlerts(keyword, lastUpdatedAt)
    case STOCK_ALERTS:
      return await getStockAlerts(keyword, lastUpdatedAt)
    default:
      console.error('Unknown query! %s', query)
      break
  }
}
