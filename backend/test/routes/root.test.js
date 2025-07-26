'use strict'

const { build } = require('../helper')

describe('Root Route', () => {
  let app

  beforeAll(async () => {
    app = await build()
  })

  afterAll(async () => {
    if (app) {
      await app.close()
    }
  })

  test('default root route', async () => {
    const res = await app.inject({
      url: '/'
    })
    expect(JSON.parse(res.payload)).toEqual({ online: true })
  })
})
