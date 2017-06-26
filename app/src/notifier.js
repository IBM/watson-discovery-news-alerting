const React = require('react')
const ReactDOMServer = require('react-dom/server')
const StaticRouter = require('react-router').StaticRouter

const nodemailer = require('nodemailer')
const WebClient = require('@slack/client').WebClient

// These need to be absolute paths in order to work with the web-worker framework requirements
// Note, import doesn't work with the worker scripts pulled in from tiny-worker
const Email = require(`${__dirname}/components/email`).Email
const getAlertsByQuery = require(`${__dirname}/watson/discovery`).getAlertsByQuery
const getSubscribers = require(`${__dirname}/models/track`).getSubscribers
const subscriberUpdated = require(`${__dirname}/models/track`).subscriberUpdated
const MainMessage = require(`${__dirname}/slack/message`).MainMessage
const createCode = require(`${__dirname}/models/access`).createCode


// Render the email via React and then send using nodemailer, this would be better done using an email service to keep
// from dealing with limitations using a mail relay and recording metrics on mails delivered.
function renderAndSendEmail(emailAddress, results, baseUrl, mailCredentials, oneTimeCode) {
  // The oneTimeCode is important, it's used to generate a unique unsubscribe link. It can be used multiple times but times out after a day
  console.log('Using one-time code of: %s', oneTimeCode)
  const transporter = nodemailer.createTransport({
    host: mailCredentials.host,
    port: 465,  // Secure SMTP, change this to 25 if 465 isn't allowed. Not recommended in general.
    secure: true,
    attachDataUrls: true,  // Allows embedding of images in the emails which was used with rendered charts
    auth: {
      user: mailCredentials.user,
      pass: mailCredentials.pass
    }
  })

  // The StaticRouter is used in case there are requirements to change the email style per type of email being sent
  const context = {}
  const renderedBody = ReactDOMServer.renderToString(
    <html>
      <head>
      </head>
      <body>
        <StaticRouter
          location='/news-alert'
          context={context}>
          <Email baseUrl={baseUrl} results={results} oneTimeCode={oneTimeCode} />
        </StaticRouter>
      </body>
    </html>
  )

  const mailOptions = {
    from: `"Watson Discovery Alerts" <${mailCredentials.fromEmail}>`,
    to: emailAddress,
    subject: 'Watson Discovery News Update',
    text: 'Unfortunately, these emails require HTML to be enabled in order to view them.',
    html: renderedBody
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response)
  })
}

// Sending emails to subscribers based on the email address in Cloudant, if it fails to send (fake email) it will log and
// skip without removing it from the database.
//
// This requires setting up the SMTP_SETTINGS environment variable as described in the README.md
async function sendSubscriberEmails() {
  const baseUrl = process.env.BASE_URL
  const rawSMTPSettings = process.env.SMTP_SETTINGS
  if (!rawSMTPSettings) {
    throw new ReferenceError('No SMTP settings are defined for the mailer to work')
  }
  if (!baseUrl) {
    throw new ReferenceError('No BASE_URL set, this is required in order to properly link emails back to the system displaying them')
  }
  const mailCredentials = JSON.parse(rawSMTPSettings)

  // getSubscribers(true, false) filters down to only email subscribers
  const results = await getSubscribers(true, false)
  for (const subscriber of results.docs) {
    // TODO make a test to see what happens when keyword or query are null, possibly protect against issues that would
    // stall delivery of mails.
    const response = await getAlertsByQuery(subscriber.query, subscriber.keyword, subscriber.lastUpdate)
    if (response && response.results.length > 0) {
      console.log('Sending email update')
      const email = subscriber.email
      const code = await createCode(email)

      renderAndSendEmail(
        email,
        response.results,
        baseUrl,
        mailCredentials,
        code)
      await subscriberUpdated(subscriber)
    }
  }
}

// Sending to Slack is easier than by Email but it's fairly fire and forget. If it fails, it's ignored.
async function sendSubscriberSlacks() {
  // See README.md on where this token is generated
  const token = process.env.SLACK_API_TOKEN
  if (!token) {
    throw new Error('This process requires a SLACK_API_TOKEN to be set in the environment.')
  }

  const slack = new WebClient(token)
  // Restricting the subscriber list to people who have opt'ed in to receive Slack notifications
  const results = await getSubscribers(false, true)
  for (const subscriber of results.docs) {
    const response = await getAlertsByQuery(subscriber.query, subscriber.keyword, subscriber.lastUpdate)
    if (response && response.results.length > 0) {
      slack.chat.postMessage(
        subscriber.slack,  // TODO check that this works via the email as well, hasn't been tested
        'Updates from Watson',
        MainMessage.toSlack(),
        (err, res) => {
          if (err) {
            console.error('Error sending slack notifications to %s: ', subscriber.slack, err)
          } else {
            console.log('Slack sent: %s', res)
          }
        })
    }
  }
}

// Periodically check for email or slack subscribers and send out their messages
async function processSubscribers() {
  await sendSubscriberEmails()
  await sendSubscriberSlacks()

  console.log('Sent all emails and Slacks, sleeping.')
}

// Simple long-polling solution to continually check the db for newly registered email addresses / Slack accounts
export function run() {
  processSubscribers()
    .then(() => setTimeout(run, 60 * 1000 /* 1 minute */))
    .catch((error) => console.error(error))
}

onmessage = (e) => {
  postMessage(e.data)

  if (e.data.status === 'start') {
    run()
  } else {
    throw new Error('Unknown status requested')
  }
}

onerror = (error) => {
  console.error(error)
}
