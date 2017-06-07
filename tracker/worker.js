import React from 'react';
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router'

import nodemailer from 'nodemailer'

import App from '../web/src/App'

/*const transporter = nodemailer.createTransport({
  host: 'smtp.example.com',
  port: 465,
  secure: true,
  auth: {
    user: 'username@example.com',
    pass: 'userpass'
  }
})*/

const context = {}
console.log(ReactDOMServer.renderToString(
  <StaticRouter
    location='/example/news-alert?company_name=Netflix'
    context={context}>
    <App />
  </StaticRouter>))
