'use strict'

const { build } = require('../helper')

describe('Root Route', () => {
  let request

  beforeAll(() => {
    request = build()
  })

  test('default root route', async () => {
    const res = await request.get('/')
    expect(res.body).toEqual({ online: true })
  })
})
