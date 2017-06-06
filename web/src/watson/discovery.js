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

export function getNewsAlert(company_name) {
  const params = {
    query: company_name,
    filter: 'enrichedTitle.relations.action.verb.text:[downgrade|upgrade],enrichedTitle.relations.subject.entities.type::Company',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'blekko.snippet,title,url'
  }

  return makeQuery(params)
}

export function getEventAlert(industry) {
  const params = {
    query: `enrichedTitle.taxonomy.label:${industry}`,
    filter: 'enrichedTitle.relations.subject.entities.type::Company,enrichedTitle.relations.action.verb.text:aquire',
    aggregation: 'timeslice(blekko.chrondate, 1day, America/Los_Angeles)',
    return: 'blekko.snippet,title,url'
  }

  return makeQuery(params)
}

// getNewsAlert('IBM').then(console.log)
// getEventAlert('/finance/bank').then(console.log)
