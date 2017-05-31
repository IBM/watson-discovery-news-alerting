import MainMessage from './lib/message'

const WebClient = require('@slack/client').WebClient

const token = process.env.SLACK_API_TOKEN || ''

let web = new WebClient(token)
web.chat.postMessage('D5L0N7CVD', 'Track news using powerful search queries', MainMessage.toSlack(null), (err, res) => {
    if (err) {
        console.log('Error:', err, res)
    } else {
        console.log('Message sent: ', res)
    }
})
