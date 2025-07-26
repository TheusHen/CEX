'use strict'

const Fastify = require('fastify')
const rootRoute = require('./routes/root')
const apiRoute = require('./routes/api')
const cexRoute = require('./routes/cex')

async function buildApp() {
  const app = Fastify()

  // Registra as rotas
  app.register(rootRoute)
  app.register(apiRoute, { prefix: '/api' })
  app.register(cexRoute)

  return app
}

module.exports = buildApp
