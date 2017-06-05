import { RtmClient, CLIENT_EVENTS } from '@slack/client'

const bot_token = process.env.SLACK_BOT_TOKEN || ''

const rtm = new RtmClient(bot_token)

let channel

// The client will emit an RTM.AUTHENTICATED event on successful connection, with the `rtm.start` payload
rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, (rtmStartData) => {
  for (const c of rtmStartData.channels) {
    if (c.is_member && c.name ==='general') {
      channel = c.id
    }
  }
  console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}, but not yet connected to a channel`)
})

rtm.on(CLIENT_EVENTS.RTM.RTM_CONNECTION_OPENED, () => {
  console.log('Connection opened.')
})

rtm.on(CLIENT_EVENTS.RTM.RAW_MESSAGE, (message) => {
  console.log(message)
})

rtm.start()
