import express from 'express'
import request from 'request'
import bodyParser from 'body-parser'

import MainMessage, {Options} from './lib/message'

let clientId = '189267654517.189173178162'
let clientSecret = 'c7b20448271a0f6bea163487d374ff30'

const app = express()
const port = 4390

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))

app.listen(port, () => console.log(`Listening on port ${port}.`) )

app.post('/button', (req, res) => {
  console.log(req.body)
  let message = new MainMessage()
  res.send(message.toSlack())
});

app.post('/menu', (req, res) => {
  console.log(JSON.parse(req.body.payload))
  let payload = JSON.parse(req.body.payload)
  res.json(Options.toSlack(payload))
})
