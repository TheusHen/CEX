'use strict'

require('dotenv').config()

const cexRoutes = require('./routes/cex')
const apiRoutes = require('./routes/api')
const rootRoutes = require('./routes/root')

async function app(fastify, opts) {
  fastify.register(rootRoutes, { prefix: '/' })
  fastify.register(cexRoutes, { prefix: '/api' })
  fastify.register(apiRoutes, { prefix: '/api' })
}

module.exports = app
