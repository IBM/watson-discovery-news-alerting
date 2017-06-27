import uuid from 'uuid'

import { BRAND_ALERTS, PRODUCT_ALERTS, RELATED_BRANDS, POSITIVE_PRODUCT_ALERTS, STOCK_ALERTS } from '../watson/constants'

// This is a tricky bit and wouldn't work if this app needed to have a cluster of servers running. This is an in memory store of the current message being displayed in Slack. The reason for this is to allow super fast responses to Slack (remember, max 3s response including transit) but in a production environment, it requires further thought and likely a cache system backed by a persistent DB.
class ActiveMessages {
  constructor() {
    this.messages = {}
  }

  addMessage(message) {
    const uniqueKey = message.getUniqueKey()
    this.messages[uniqueKey] = message
  }

  getMessage(uniqueKey) {
    return this.messages[uniqueKey]
  }
}

// We expect the internal state of this object to change often but it should stay constant.
const GlobalActiveMessages = new ActiveMessages()

export function registerMessage(message) {
  GlobalActiveMessages.addMessage(message)
}

/*
 * The slackBody should be of this format (Notice, double encoded payload):
{ payload: '{"actions":[{"name":"alert_type","type":"select","selected_options":[{"value":"brand-alerts"}]}],"callback_id":"select_filter","team":{"id":"T5K7VK8F7","domain":"ibm-testhq"},"channel":{"id":"D5L0N7CVD","name":"directmessage"},"user":{"id":"U5JEUQF5W","name":"e3"},"action_ts":"1497982018.022452","message_ts":"1497981821.000007","attachment_id":"1","token":"IyE2ob8d364KIi2hLp0PQgGR","is_app_unfurl":false,"response_url":"https:\\/\\/hooks.slack.com\\/actions\\/T5K7VK8F7\\/200790698708\\/bubfLwatxvLT4pzgdMzlcj46"}' }
 */
export function registerButtonClick(slackBody) {
  const payload = JSON.parse(slackBody.payload)
  const callbackId = payload.callback_id
  const currentMessage = GlobalActiveMessages.getMessage(callbackId)

  for (const action of payload.actions) {
    if (action.name === 'alert_type') {
      const alertType = action.selected_options[0].value
      currentMessage.updateAlert(alertType)
    }

    if (action.name === 'filter_list') {
      const keyword = action.selected_options[0].value
      currentMessage.updateKeyword(keyword)
    }

    if (action.name === 'frequency') {
      const frequency = action.selected_options[0].value
      currentMessage.updateFrequency(frequency)
    }

    // This button cancels the entire flow, return back a static message to clear the displayed one
    if (action.name === 'cancel') {
      return new MainMessage(null, null, null, null, false, false, {text: 'Cancelled'})
    }

    // The track button stops the flow and responds with a tracking text as feedback
    if (action.name === 'track') {
      currentMessage.isTracking = true
    }
  }

  if (currentMessage.shouldFrequency()) {
    currentMessage.enableFrequency()
  }

  if (currentMessage.shouldSearch()) {
    currentMessage.enableTrackButton()
  }

  return currentMessage
}

// These are the different messages available to Slack, all details were pulled from Slack's documentation on attachments: https://api.slack.com/docs/message-attachments
export default class MainMessage {
  constructor(callbackId, query, keyword, frequency, hasResults, isTracking, body) {
    this.callbackId = callbackId || uuid.v4()

    this.query = query
    this.keyword = keyword
    this.frequency = frequency
    this.isTracking = isTracking || false
    this.hasResults = hasResults || true

    if (body) {
      this.body = body
    } else {
      this.setInitialBody()
    }
  }

  // Communicating to web workers requires JSON or string data types, this allows us to serialize/deserialize these objects between the main process and other threads.
  asJSON() {
    return {
      callbackId: this.callbackId,
      query: this.query,
      keyword: this.keyword,
      frequency: this.frequency,
      hasResults: this.hasResults,
      isTracking: this.isTracking,
      body: this.body
    }
  }

  static fromJSON(messageJSON) {
    return new MainMessage(
      messageJSON.callbackId,
      messageJSON.query,
      messageJSON.keyword,
      messageJSON.frequency,
      messageJSON.hasResults,
      messageJSON.isTracking,
      messageJSON.body)
  }

  // The callbackId is unique and used to support mapping button clicks back to the proper message that should be updated. Without it, there's no way to find which message should be updated.
  getUniqueKey() {
    return this.callbackId
  }

  shouldSearch() {
    return this.query && this.keyword && this.frequency && this.hasResults && !this.isTracking
  }

  shouldSaveTracking() {
    return this.isTracking
  }

  shouldFrequency() {
    return this.query && this.keyword && this.hasResults
  }

  updateLoadingResults() {
    this.body.attachments[0].fields.push({
      title: 'Loading...',
      value: 'Watson is searching for results.',
      short: false
    })
  }

  updateSearchResults(results) {
    // Remove the loading message
    this.body.attachments[0].fields = this.body.attachments[0].fields.filter((f) => f.title !== 'Loading...')

    for (const result of results) {
      let details = result.details
      // Shorten the text sent to Slack
      if (details && details.length > 150) {
        details = `${details.slice(0, 150)}...`
      }

      this.body.attachments[0].fields.push({
        title: result.title,
        value: details,
        short: false
      })
    }

    if (results.length === 0) {
      this.body.attachments[0].fields.push({
        title: 'No results',
        value: "We're sorry, this query returned no results. You may still track it in case results begin showing up.",
        short: false
      })
    }
  }

  setInitialBody() {
    this.body = {
      attachments: [
        {
          title: 'Watson Discover News Tracking',
          title_link: process.env.BASE_URL,
          footer: '',
          footer_icon: '',
          color: '9855d4',
          fallback: 'Watson Discovery News Tracking',
          fields: [
            {
              title: 'Details',
              value: "Monitor a product's marketplace life-cycle using Watson's Discovery service to intelligently alert when a product's stance in the marketplace has changed. Receive periodic updates via email or Slack related to a product or brand and how they're perceived in the News.",
              short: false
            }
          ],
          attachment_type: 'default',
          callback_id: this.callbackId,  // This is how we keep track of the unique message being interacted with
          actions: [
            {
              name: 'alert_type',
              text: 'Alert type',
              type: 'select',
              options: [
                {
                  text: 'Brand Alerts',
                  value: BRAND_ALERTS
                },
                {
                  text: 'Product Alerts',
                  value: PRODUCT_ALERTS
                },
                {
                  text: 'Related Brands',
                  value: RELATED_BRANDS
                },
                {
                  text: 'Positive Product Alerts',
                  value: POSITIVE_PRODUCT_ALERTS
                },
                {
                  text: 'Stock Alerts',
                  value: STOCK_ALERTS
                }
              ]
            },
            {
              name: 'filter_list',
              text: 'Keyword (brand or product name)',
              type: 'select',
              data_source: 'external',
              min_query_length: 1
            },
          ]
        }
      ]
    }
  }

  enableTrackButton() {
    if (!this.body.attachments[0].actions.some((e) => e.name === 'cancel')) {
      this.body.attachments[0].actions.push({
        name: 'cancel',
        text: 'Cancel',
        style: 'danger',
        type: 'button',
        value: 'cancel'
      })
    }

    if (!this.body.attachments[0].actions.some((e) => e.name === 'track')) {
      this.body.attachments[0].actions.push({
        name: 'track',
        text: 'Track',
        style: 'primary',
        type: 'button',
        value: 'track'
      })
    }
  }

  enableFrequency() {
    if (!this.body.attachments[0].actions.some((e) => e.name === 'frequency') && !this.body.attachments[0].fields.some((e) => e.title === 'Frequency')) {
      this.body.attachments[0].actions.push({
          name: 'frequency',
          text: 'Frequency of updates',
          type: 'select',
          options: [
            {
              text: 'Daily',
              value: 'daily'
            },
            {
              text: 'Weekly',
              value: 'weekly'
            },
            {
              text: 'Monthly',
              value: 'monthly'
            }
          ]
        })
    }
  }

  updateAlert(alertType) {
    this.query = alertType
    this.body.attachments[0].actions = this.body.attachments[0].actions.filter((action) => action.name !== 'alert_type')
    this.body.attachments[0].fields.push({
      title: 'Alert type',
      value: alertType,
      short: true
    })
  }

  updateKeyword(keyword) {
    this.keyword = keyword
    this.body.attachments[0].actions = this.body.attachments[0].actions.filter((action) => action.name !== 'filter_list')
    this.body.attachments[0].fields.push({
      title: 'Keyword',
      value: keyword,
      short: true
    })
  }

  updateFrequency(frequency) {
    this.frequency = frequency
    this.body.attachments[0].actions = this.body.attachments[0].actions.filter((action) => action.name !== 'frequency')
    this.body.attachments[0].fields.push({
      title: 'Frequency',
      value: frequency,
      short: true
    })
  }

  toSlack() {
    return this.body
  }
}

export class Options {
  static toSlack(payload) {
    const current_value = payload.value
    return {
      option_groups: [
        {
          text: 'Custom query',
          options: [
            {
              text: current_value,
              value: current_value
            }
          ]
        },
        {
          text: 'Examples',
          options: [
            {
              text: 'IBM',
              value: 'IBM'
            },
            {
              text: 'IBM Watson',
              value: 'IBM Watson'
            }
          ]
        }
      ]
    }
  }
}
