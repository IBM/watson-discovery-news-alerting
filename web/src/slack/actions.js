import Worker from 'tiny-worker'

export function respond(response_url, message) {
  const worker = new Worker(`${__dirname}/worker.js`)
  worker.postMessage(
    JSON.stringify({
      response_url: response_url,
      message: message
    })
  )
}
