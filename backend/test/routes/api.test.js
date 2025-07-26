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

  test('GET /api/airports/order/desc returns airports ordered by CEX descending', async () => {
    const { supabase } = require('../../utils/supabase')
    supabase.select.mockReturnValueOnce({
      data: [
        { iata: 'JFK', airport: 'New York/JFK', cex: 8.0 },
        { iata: 'GRU', airport: 'São Paulo/Guarulhos', cex: 7.33 }
      ],
      error: null
    })

    const res = await request.get('/api/airports/order/desc')

    expect(res.status).toBe(200)
    expect(res.body[0].cex).toBeGreaterThan(res.body[1].cex)
  })

  test('GET /api/airports/order/asc returns airports ordered by CEX ascending', async () => {
    const { supabase } = require('../../utils/supabase')
    supabase.select.mockReturnValueOnce({
      data: [
        { iata: 'GRU', airport: 'São Paulo/Guarulhos', cex: 7.33 },
        { iata: 'JFK', airport: 'New York/JFK', cex: 8.0 }
      ],
      error: null
    })

    const res = await request.get('/api/airports/order/asc')

    expect(res.status).toBe(200)
    expect(res.body[0].cex).toBeLessThan(res.body[1].cex)
  })

  test('GET /api/airports/search/:name returns airports matching name', async () => {
    const { supabase } = require('../../utils/supabase')
    supabase.select.mockReturnValueOnce({
      data: [{ iata: 'GRU', airport: 'São Paulo/Guarulhos', cex: 7.33 }],
      error: null
    })

    const res = await request.get('/api/airports/search/São')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].airport).toContain('São')
  })

  test('GET /api/airports/cex/above/:value returns airports with CEX above value', async () => {
    const { supabase } = require('../../utils/supabase')
    supabase.select.mockReturnValueOnce({
      data: [{ iata: 'JFK', airport: 'New York/JFK', cex: 8.0 }],
      error: null
    })

    const res = await request.get('/api/airports/cex/above/7.5')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].cex).toBeGreaterThan(7.5)
  })

  test('GET /api/airports/cex/below/:value returns airports with CEX below value', async () => {
    const { supabase } = require('../../utils/supabase')
    supabase.select.mockReturnValueOnce({
      data: [{ iata: 'GRU', airport: 'São Paulo/Guarulhos', cex: 7.33 }],
      error: null
    })

    const res = await request.get('/api/airports/cex/below/7.5')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].cex).toBeLessThan(7.5)
  })
})

