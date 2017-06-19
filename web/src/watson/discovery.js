import { DiscoveryV1 } from 'watson-developer-cloud'
import { getCredentials } from '../bluemix/config'

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

function makeQuery(params) {
  const credentials = getCredentials('discovery')

  const discovery = new DiscoveryV1({
    username: credentials.username,
    password: credentials.password,
    version_date: '2016-11-07'
  })

  return new Promise(async (resolve, reject) => {
    const environment = await getFirstDiscoverNewsEnvironment(discovery)
    const collection = await getFirstDiscoverNewsCollection(discovery, environment)

    params.environment_id = environment.environment_id
    params.collection_id = collection.collection_id

    discovery.query(params, (error, data) => {
      if (error) {
        reject(error)
      } else {
        resolve(data)
      }
    })
  })
}

export function getBrandAlerts(brandName) {
  const params = {
    query: `${encodeURIComponent(brandName)},enrichedTitle.entities.type:Company,enrichedTitle.entities.relevance>0.8,blekko.documentType:news`,
    filter: 'blekko.lang:en,enrichedTitle.language:english,blekko.documentType:news',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'alchemyapi_text,title,url'
  }

  return makeQuery(params)
}

export function getProductAlerts(productName) {
  const params = {
    query: `${encodeURIComponent(productName)},blekko.documentType:news`,
    filter: 'blekko.lang:en,enrichedTitle.language:english,blekko.documentType:news',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'alchemyapi_text,title,url'
  }

  return makeQuery(params)
}

export async function getRelatedBrands(brandName) {
  // Find more information about the brand to then explicitly exclude from queries
  const brandParams = {
    query: brandName,
    filter: `blekko.lang:en,enrichedTitle.language:english,(enrichedTitle.entities.type:Company,enrichedTitle.entities.relevance>0.8,enrichedTitle.entities.text:${brandName}),blekko.documentType:news`,
    count: 50,
    return: 'taxonomy'
  }
  const brandResults = await makeQuery(brandParams)

  const taxonomies = brandResults.results
    .reduce((acc, val) => acc.concat(val.taxonomy), [])
    .filter((taxonomy) => taxonomy.confident !== 'no' && taxonomy.score > 0.5)
    .reduce((acc, val) => {
      const key = val.label.split('/').splice(1,2).join('/')
      let found = false
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

  // First attempt was to use the disambiguated name but that rarely results in anything, not sure why.
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

  return await makeQuery(params)
}

export function getPositiveProductAlerts(productName) {
  const params = {
    query: `${productName},docSentiment.type::positive`,
    filter: 'blekko.lang:en,enrichedTitle.language:english,blekko.documentType:news,(docSentiment.type::positive,docSentiment.score>0.5)',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'alchemyapi_text,title,url'
  }

  return makeQuery(params)
}

export async function getAlertsByQuery(query, keyword) {
  switch (query) {
    case 'brand-alerts':
      return await getBrandAlerts(keyword)
      break
    case 'product-alerts':
      return await getProductAlerts(keyword)
      break
    case 'related-brands':
      return await getRelatedBrands(keyword)
      break
    case 'positive-product-alerts':
      return await getPositiveProductAlerts(keyword)
      break
    default:
      console.error('Unknown query! %s', query)
      break
  }
}
