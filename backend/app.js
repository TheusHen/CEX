'use strict'

const express = require('express')
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

module.exports = buildApp
