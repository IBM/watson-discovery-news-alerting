import bodyParser from 'body-parser'
import express from 'express'
import morgan from 'morgan'
import path from 'path'

const app = express()
const port = process.env.PORT || 4391

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('build'))
app.use(morgan('combined'))
app.listen(port, _ => console.log(`Listening on port ${port}.`) )

