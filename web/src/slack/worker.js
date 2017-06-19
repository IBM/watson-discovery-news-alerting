var request = require('request')
// Note, import doesn't work with the worker scripts pulled in from tiny-worker

// This is a background worker so few features are available.
// NOTE self is used instead of this while working with workers
onmessage = (e) => {
  postMessage(e.data)
  const data = JSON.parse(e.data)
  postMessage(`Sending response to ${data.response_url}`)
  request.post({url: data.response_url, body: data.message}, (error, response, body) => {
    if (error) {
      console.error(error)
    }
    console.log(body)
  })
}

onerror = (error) => {
  console.error(error)
}
