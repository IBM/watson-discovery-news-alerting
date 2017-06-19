import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import path from 'path'

import { getBrandAlerts, getProductAlerts, getRelatedBrands, getPositiveProductAlerts } from './src/watson/discovery'
import { track, subscriptionsByEmail, unsubscribe, updateDestination } from './src/models/track'
import { useCode } from './src/models/access'
import MainMessage, { Options } from './src/slack/message'
import { respond } from './src/slack/actions'

const app = express()
const port = process.env.PORT || 4391

// The app posts in JSON
app.use(bodyParser.json())
// Slack posts as URL encoded bodies
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('build'))
// A simple logger for express to give a request log
app.use(morgan('combined'))
app.listen(port, () => console.log(`Listening on port ${port}.`) )

// This helper makes it easier to respond to exceptions with a proper status code, without a res.status then the failed
// request seems like it hangs and makes it hard to debug front-end problems.
function genericError(res, error) {
  console.error(error)
  res.status(500).json({status: 'error'})
}

// Every Slack route must return everything within 3s including transport time, Slack is in us-west so keep in mind latency
// NOTE if you're seeing timeouts in Slack, it may be as simple as the amount of time it took to have the message sent back
// to Slacks servers, this is fairly common when running locally.

// Button is clicked or menu item changed from Slack, this is the most common case
app.post('/api/1/slack/button/', (req, res) => {
  const payload = JSON.parse(req.body.payload)
  let alertType = null
  let keyword = null

  for (const action of payload.actions) {
    if (action.name === 'alert_type') {
      alertType = action.selected_options[0].value
    }

    if (action.name === 'filter_list') {
      keyword = action.selected_options[0].value
    }
  }
  const response = MainMessage.toSlack(alertType, keyword)
  res.send(response)
})

// Populate the dynamic menus (only the keyword menu) in Slack
app.post('/api/1/slack/menu/', (req, res) => {
  const payload = JSON.parse(req.body.payload)
  res.json(Options.toSlack(payload))
})

// Initial request from Slack when the registered command is executed, this ignores the text after the command
app.post('/api/1/slack/command/', (req, res) => {
  // respond is a background thread which will respond but allow the body to be returned quickly
  respond(req.body.response_url, JSON.stringify(MainMessage.toSlack()))
  // The response is used as the message Slack displays
  res.json({text: 'Loading results from Watson...'})
})
// End Slack routes

// The primary routes used to display information from Watson's Discovery Service, each route returns the raw response
// from Watson's Discovery Service so that it's easier to move this logic.
//
// These could be reduced to a single route which uses a path parameter to see which function to execute (see mailer),
// instead these routes are written out for extra clarity.
app.get('/api/1/track/brand-alerts/', (req, res) => {
  const brandName = req.query.brand_name
  getBrandAlerts(brandName)
    .then((response) => res.json(response))
    .catch((error) => genericError(res, error))
})

app.get('/api/1/track/product-alerts/', (req, res) => {
  const productName = req.query.product_name
  getProductAlerts(productName)
    .then((response) => res.json(response))
    .catch((error) => genericError(res, error))
})

app.get('/api/1/track/related-brands/', (req, res) => {
  const brandName = req.query.brand_name
  getRelatedBrands(brandName)
    .then((response) => res.json(response))
    .catch((error) => genericError(res, error))
})

app.get('/api/1/track/positive-product-alerts/', (req, res) => {
  const productName = req.query.product_name
  getPositiveProductAlerts(productName)
    .then((response) => res.json(response))
    .catch((error) => genericError(res, error))
})
// End Watson's Discovery Service related routes

// Subscription routes take care of some basic actions required for people to subscribe or unsubscribe to tracking
// alerts.
app.post('/api/1/subscription/', (req, res) => {
  // By default, this route is used only for email based subscriptions. See the button handler above to see how the
  // Slack subscriptions are handled.
  const email = req.body.email
  const query = req.body.query
  const keyword = req.body.keyword
  const frequency = req.body.frequency

  track(email, query, keyword, frequency)
    .then((result) => res.json(result))
    .catch((error) => genericError(res, error))
})

// List the subscriptions available for a user by email address, the token (or code) encapsulates their email address
// which is used to select all the subscriptions they currently have.
app.get('/api/1/subscription/:token/', (req, res) => {
  const token = req.params.token
  if (!token || token.search(/[^\w\-]/) != -1) {
    throw new TypeError('Invalid token provided.')
  }
  useCode(token)
    .then((email) => subscriptionsByEmail(email))
    .then((subscriptions) => res.json(subscriptions))
    .catch((error) => genericError(res, error))
})

app.post('/api/1/subscription/:token/unsubscribe/:id/', (req, res) => {
  const token = req.params.token
  const id = req.params.id
  // Each token/ID are UUID4s which have a common format
  // TODO move this logic into a shared function
  if (!token || token.search(/[^\w\-]/) != -1) {
    throw new TypeError('Invalid token provided.')
  }
  if (!id || id.search(/[^\w\-]/) != -1) {
    throw new TypeError('Invalid ID provided.')
  }

  unsubscribe(token, id)
    .then(() => res.json({status: 'success'}))
    .catch((error) => genericError(res, error))
})

// Change the destination subscriptions are sent to, can be Slack and/or Email
app.post('/api/1/subscription/:token/destination/:id/', (req, res) => {
  const token = req.params.token
  const id = req.params.id

  // NOTE further validation on input is recommended because the DB being used has no schema to do validation against
  if (!token || token.search(/[^\w\-]/) != -1) {
    throw new TypeError('Invalid token provided.')
  }
  if (!id || id.search(/[^\w\-]/) != -1) {
    throw new TypeError('Invalid ID provided.')
  }
  const destinationEmail = req.body.destinationEmail
  const destinationSlack = req.body.destinationSlack

  updateDestination(token, id, destinationEmail, destinationSlack)
    .then(() => res.json({status: 'success'}))
    .catch((error) => genericError(res, error))
})

// The fallback, this is a fairly common route used with React and other JS frameworks which handle routing themselves. It
// can cause confusion because in the case of a 404, instead the homepage is returned and then JS renders nothing since the
// route didn't match.
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})
