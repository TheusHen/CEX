'use strict'

const { build } = require('../helper')

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null })
  }
}))

describe('CEX Route', () => {
  let request

  beforeAll(() => {
    request = build()
  })

  test('POST /cex with valid data', async () => {
    const validData = {
      Sp: 8.0, Ac: 7.0, Da: 9.0, Zl: 6.0,
      To: 8.0, Ng: 7.0, Rt: 9.0, Pm: 6.0,
      Va: 8.0, Id: 7.0, Sc: 9.0, Lu: 6.0,
      iata: 'GRU', airport: 'São Paulo/Guarulhos'
    }

    const res = await request.post('/cex').send(validData)

    expect(res.status).toBe(200)
    expect(res.body.iata).toBe('GRU')
    expect(res.body.airport).toBe('São Paulo/Guarulhos')
  })
})
