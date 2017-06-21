import Worker from 'tiny-worker'

// Each worker being created is a new thread, if you run into out of process exceptions, these should be turned into singleton workers
export function respond(responseUrl, message) {
  const worker = new Worker(`${__dirname}/worker.js`)
  worker.postMessage({
      message_type: 'respond',
      response_url: responseUrl,
      message: message
    })
}

export function search(responseUrl, message) {
  const worker = new Worker(`${__dirname}/worker.js`)
  worker.postMessage({
      message_type: 'search',
      response_url: responseUrl,
      message: message
    })
}

export function trackSlack(slackUser, channel, team, responseUrl, message) {
  const worker = new Worker(`${__dirname}/worker.js`)
  worker.postMessage({
      message_type: 'track',
      slack_user: slackUser,
      channel: channel,
      team: team,
      response_url: responseUrl,
      message: message
    })
}
