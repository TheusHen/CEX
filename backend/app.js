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

if (require.main === module) {
  const app = buildApp()
  const port = process.env.PORT || 3000
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`)
  })
}

