import React from 'react';
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router'

import nodemailer from 'nodemailer'

import { Email } from '../web/src/components/email'
import { getNewsAlert, getEventAlert } from '../web/src/watson/discovery'
import { getSubscribers, subscriberUpdated } from '../web/src/models/track'
import { createCode } from '../web/src/models/access'


function renderAndSendEmail(emailAddress, results, baseUrl, mailCredentials, oneTimeCode) {
  console.log('Using one-time code of: %s', oneTimeCode)
  const transporter = nodemailer.createTransport({
    host: mailCredentials.host,
    port: 465,
    secure: true,
    attachDataUrls: true,
    auth: {
      user: mailCredentials.user,
      pass: mailCredentials.pass
    }
  })

  const context = {}
  const renderedBody = ReactDOMServer.renderToString(
    <html>
      <head>
      </head>
      <body>
        <StaticRouter
          location='/news-alert'
          context={context}>
          <Email baseUrl={baseUrl} results={results} />
        </StaticRouter>
      </body>
    </html>
  )

  const mailOptions = {
    from: `"Watson Discovery Alerts" <${mailCredentials.fromEmail}>`,
    to: emailAddress,
    subject: 'Daily update from Watson',
    text: 'Daily update from Watson',
    html: renderedBody
  }

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error(error);
    }
    console.log('Message %s sent: %s', info.messageId, info.response)
  })
}

function sendSubscriberEmails() {
  const baseUrl = process.env.BASE_URL
  const rawSMTPSettings = process.env.SMTP_SETTINGS
  if (!rawSMTPSettings) {
    throw new ReferenceError('No SMTP settings are defined for the mailer to work')
  }
  if (!baseUrl) {
    throw new ReferenceError('No BASE_URL set, this is required in order to properly link emails back to the system displaying them')
  }
  const mailCredentials = JSON.parse(rawSMTPSettings)

  getSubscribers('daily')
    .then((results) => {
      console.log(results)
      results.docs.map((subscriber) => {
        getNewsAlert('Watson')
          .then(async (response) => {
            console.log('Sending email update')
            const email = 'eerwitt@gmail.com'
            const code = await createCode(email)
            renderAndSendEmail(
              email,
              response.results,
              baseUrl,
              mailCredentials,
              code)
            await subscriberUpdated(subscriber)
          })
          .catch(console.error)
      })
    })
    .catch(console.error)
}

sendSubscriberEmails()
