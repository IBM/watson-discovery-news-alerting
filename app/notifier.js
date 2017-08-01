/**
 * Copyright 2017 IBM Corp. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License'); you may not
 * use this file except in compliance with the License. You may obtain a copy of
 * the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations under
 * the License.
 */

import {} from 'dotenv/config'

import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router'
import React from 'react'

import nodemailer from 'nodemailer'
import { Email } from './src/components/email'
import { getAlertsByQuery } from './src/watson/discovery'
import { getSubscribers, subscriberUpdated } from './src/models/track'
import { createCode } from './src/models/access'


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
      return console.error(error)
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
    const response = await getAlertsByQuery(subscriber.query, subscriber.keyword)
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

// Periodically check for email and send out their messages
async function processSubscribers() {
  await sendSubscriberEmails()
  console.log('Sent all emails, sleeping.')
}

// Simple long-polling solution to continually check the db for newly registered email addresses
export function run() {
  processSubscribers()
    .then(() => setTimeout(run, 60 * 1000 /* 1 minute */))
    .catch((error) => console.error(error))
}

// TODO if moved to the web server, remove this call and use the exported function run to start the process
run()
