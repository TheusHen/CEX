'use strict'

const { build: buildApplication } = require('fastify-cli/helper')
const path = require('node:path')
const AppPath = path.join(__dirname, '..', 'app.js')

function config () {
  return {
    skipOverride: true
  }
}

async function build (t) {
  const argv = [AppPath]

  // fastify-plugin ensures that all decorators
  // are exposed for testing purposes, this is
  // different from the production setup
  const app = await buildApplication(argv, config())

  // close the app after we are done
  t.after(() => app.close())

  return app
}

module.exports = {
  config,
  build
}
