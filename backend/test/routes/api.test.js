'use strict'

const { build } = require('../helper')

const mockDataResponses = {
  allAirports: [
    { iata: 'GRU', airport: 'São Paulo/Guarulhos', comfort: 7.5, efficiency: 8.0, aesthetics: 6.5, cex: 7.33 },
    { iata: 'JFK', airport: 'New York/JFK', comfort: 8.0, efficiency: 7.5, aesthetics: 8.5, cex: 8.0 }
  ],
  orderDesc: [
    { iata: 'JFK', airport: 'New York/JFK', cex: 8.0 },
    { iata: 'GRU', airport: 'São Paulo/Guarulhos', cex: 7.33 }
  ],
  orderAsc: [
    { iata: 'GRU', airport: 'São Paulo/Guarulhos', cex: 7.33 },
    { iata: 'JFK', airport: 'New York/JFK', cex: 8.0 }
  ],
  searchSão: [
    { iata: 'GRU', airport: 'São Paulo/Guarulhos', cex: 7.33 }
  ],
  cexAbove7_5: [
    { iata: 'JFK', airport: 'New York/JFK', cex: 8.0 }
  ],
  cexBelow7_5: [
    { iata: 'GRU', airport: 'São Paulo/Guarulhos', cex: 7.33 }
  ]
}

jest.mock('../../utils/supabase', () => {
  const supabase = {
    from: jest.fn(() => supabase),
    select: jest.fn(() => supabase),
    order: jest.fn(() => supabase),
    ilike: jest.fn(() => supabase),
    gt: jest.fn(() => supabase),
    lt: jest.fn(() => supabase),
  }

  supabase._returnValue = { data: null, error: null }

  supabase.then = function(resolve) {
    return resolve(supabase._returnValue)
  }

  return { supabase }
})

describe('API Routes', () => {
  let request
  let supabase

  beforeAll(() => {
    request = build()
    supabase = require('../../utils/supabase').supabase
  })

  beforeEach(() => {
    jest.clearAllMocks()
    supabase._returnValue = { data: null, error: null }
  })

  test('GET /api/airports returns all airports', async () => {
    supabase._returnValue = { data: mockDataResponses.allAirports, error: null }

    const res = await request.get('/api/airports')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(2)
    expect(res.body[0].iata).toBe('GRU')
    expect(res.body[1].iata).toBe('JFK')
  })

  test('GET /api/airports/order/desc returns airports ordered by CEX descending', async () => {
    supabase._returnValue = { data: mockDataResponses.orderDesc, error: null }

    const res = await request.get('/api/airports/order/desc')

    expect(res.status).toBe(200)
    expect(res.body[0].cex).toBeGreaterThan(res.body[1].cex)
  })

  test('GET /api/airports/order/asc returns airports ordered by CEX ascending', async () => {
    supabase._returnValue = { data: mockDataResponses.orderAsc, error: null }

    const res = await request.get('/api/airports/order/asc')

    expect(res.status).toBe(200)
    expect(res.body[0].cex).toBeLessThan(res.body[1].cex)
  })

  test('GET /api/airports/search/:name returns airports matching name', async () => {
    supabase._returnValue = { data: mockDataResponses.searchSão, error: null }

    const res = await request.get('/api/airports/search/São')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].airport).toContain('São')
  })

  test('GET /api/airports/cex/above/:value returns airports with CEX above value', async () => {
    supabase._returnValue = { data: mockDataResponses.cexAbove7_5, error: null }

    const res = await request.get('/api/airports/cex/above/7.5')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].cex).toBeGreaterThan(7.5)
  })

  test('GET /api/airports/cex/below/:value returns airports with CEX below value', async () => {
    supabase._returnValue = { data: mockDataResponses.cexBelow7_5, error: null }

    const res = await request.get('/api/airports/cex/below/7.5')

    expect(res.status).toBe(200)
    expect(res.body.length).toBe(1)
    expect(res.body[0].cex).toBeLessThan(7.5)
  })
})
