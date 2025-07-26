'use strict'

require('dotenv').config()
const buildApp = require('../app')
const supertest = require('supertest')

function build() {
  const app = buildApp()
  return supertest(app)
}

module.exports = { build }
