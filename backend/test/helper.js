'use strict'

require('dotenv').config()
const buildApp = require('../app')

async function build() {
  const app = await buildApp()
  await app.ready()
  return app
}

module.exports = { build }
