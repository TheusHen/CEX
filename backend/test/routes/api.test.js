'use strict'

const { build } = require('../helper')

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis()
  }
}))

describe('API Routes', () => {
  let request

  beforeAll(() => {
    request = build()
  })

  test('GET /api/airports returns all airports', async () => {
    const { supabase } = require('../../utils/supabase')
    supabase.select.mockReturnValueOnce({
      data: [
        { iata: 'GRU', airport: 'São Paulo/Guarulhos', comfort: 7.5, efficiency: 8.0, aesthetics: 6.5, cex: 7.33 },
        { iata: 'JFK', airport: 'New York/JFK', comfort: 8.0, efficiency: 7.5, aesthetics: 8.5, cex: 8.0 }
      ],
      error: null
    })

    const res = await request.get('/api/airports')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
    expect(res.body[0].iata).toBe('GRU')
    expect(res.body[1].iata).toBe('JFK')
  })
})
