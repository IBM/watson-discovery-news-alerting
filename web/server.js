import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import path from 'path'

import { getNewsAlert, getEventAlert } from './src/watson/discovery'
import { track } from './src/models/track'

const app = express()
const port = process.env.PORT || 4391

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('build'))
app.use(morgan('combined'))
app.listen(port, () => console.log(`Listening on port ${port}.`) )

function genericError(res, error) {
  console.error(error)
  res.status(500).json({'status': 'error'})
}

app.get('/api/1/news-alerts', (req, res) => {
  const company_name = req.query.company_name
  getNewsAlert(company_name)
    .then((response) => res.json(response))
    .catch((error) => genericError(res, error))
})

app.get('/api/1/event-alerts', (req, res) => {
  const industry = req.query.industry
  getEventAlert(industry)
    .then((response) => res.json(response))
    .catch((error) => genericError(res, error))
})

app.post('/api/1/tracking', (req, res) => {
  const email = req.body.email
  const query = req.body.query
  const frequency = req.body.frequency

  track(email, query, frequency)
    .then((result) => res.json(result))
    .catch((error) => genericError(res, error))
})

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'))
})
