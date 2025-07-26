'use strict'

require('dotenv').config()

const express = require('express')
const serverless = require('serverless-http')
const rootRoute = require('./routes/root')
const apiRoute = require('./routes/api')
const cexRoute = require('./routes/cex')

function buildApp() {
  const app = express()
  app.use(express.json())

  app.use('/', rootRoute)
  app.use('/api', apiRoute)
  app.use('/cex', cexRoute)

  return app
}

const app = buildApp()

module.exports.handler = serverless(app)

if (require.main === module) {
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

