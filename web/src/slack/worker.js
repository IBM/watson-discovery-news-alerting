var request = require('request')
// These need to be absolute paths in order to work with the web-worker framework requirements
// Note, import doesn't work with the worker scripts pulled in from tiny-worker
var MainMessage = require(`${__dirname}/src/slack/message`).default
var discovery = require(`${__dirname}/src/watson/discovery`)
var track = require(`${__dirname}/src/models/track`)

// This is a background worker so few features are available.
// NOTE self is used instead of this while working with workers
onmessage = (e) => {
  postMessage(e.data)
  const data = e.data
  const messageType = data.message_type
  const message = MainMessage.fromJSON(data.message)
  const responseUrl = data.response_url

  // Search for the query
  if (messageType === 'search') {
    const query = message.query
    const keyword = message.keyword

    discovery.getAlertsByQuery(query, keyword)
      .then((res) => {
        message.updateSearchResults(
          res.results.map((result) => {
            return {
              title: result.title,
              title_link: result.url,
              details: result.alchemyapi_text
            }
          }).slice(0, 2)
        )

        request.post({
          url: responseUrl,
          body: JSON.stringify(message.toSlack())}, (error, response, body) => {
          if (error) {
            console.error(error)
          }
          console.log(body)
        })
      })
      .catch((error) => console.error(error))
  }

  // Handle the background message to track (subscribe) to the alerts
  if (messageType === 'track') {
    const slackUser = data.slack_user
    const channel = data.channel
    const team = data.team

    const query = message.query
    const keyword = message.keyword
    const frequency = message.frequency

    track.trackSlack(slackUser, channel, team, query, keyword, frequency)
      .then((result) => console.log(result))
      .catch((error) => console.error(error))
  }

  // Background message to respond to something without doing any other operations
  if (messageType === 'respond') {
    postMessage(`Sending response to ${responseUrl}`)
    request.post({
      url: responseUrl,
      body: JSON.stringify(message.toSlack())}, (error, response, body) => {
      if (error) {
        console.error(error)
      }
      console.log(body)
    })
  }
}

onerror = (error) => {
  console.error(error)
}
