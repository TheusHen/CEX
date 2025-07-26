'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
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

test('GET /api/airports returns all airports', async (t) => {
  const app = await build(t)

  // Mock Supabase response
  const { supabase } = require('../../utils/supabase')
  supabase.select.mockReturnValueOnce({
    data: [
      { iata: 'GRU', airport: 'São Paulo/Guarulhos', comfort: 7.5, efficiency: 8.0, aesthetics: 6.5, cex: 7.33 },
      { iata: 'JFK', airport: 'New York/JFK', comfort: 8.0, efficiency: 7.5, aesthetics: 8.5, cex: 8.0 }
    ],
    error: null
  })

  const res = await app.inject({
    method: 'GET',
    url: '/api/airports'
  })

  assert.equal(res.statusCode, 200)
  
  const result = JSON.parse(res.payload)
  assert.equal(result.length, 2)
  assert.equal(result[0].iata, 'GRU')
  assert.equal(result[1].iata, 'JFK')
})

test('GET /api/airports/:iata returns a specific airport', async (t) => {
  const app = await build(t)

  // Mock Supabase response
  const { supabase } = require('../../utils/supabase')
  supabase.eq.mockReturnValueOnce({
    single: jest.fn().mockReturnValueOnce({
      data: { iata: 'GRU', airport: 'São Paulo/Guarulhos', comfort: 7.5, efficiency: 8.0, aesthetics: 6.5, cex: 7.33 },
      error: null
    })
  })

  const res = await app.inject({
    method: 'GET',
    url: '/api/airports/GRU'
  })

  assert.equal(res.statusCode, 200)
  
  const result = JSON.parse(res.payload)
  assert.equal(result.iata, 'GRU')
  assert.equal(result.airport, 'São Paulo/Guarulhos')
})

test('GET /api/airports/:iata returns 404 for non-existent airport', async (t) => {
  const app = await build(t)

  // Mock Supabase response
  const { supabase } = require('../../utils/supabase')
  supabase.eq.mockReturnValueOnce({
    single: jest.fn().mockReturnValueOnce({
      data: null,
      error: { message: 'Not found' }
    })
  })

  const res = await app.inject({
    method: 'GET',
    url: '/api/airports/XXX'
  })

  assert.equal(res.statusCode, 404)
  
  const result = JSON.parse(res.payload)
  assert.ok(result.error)
  assert.equal(result.error, 'Airport not found')
})

test('GET /api/airports/order/desc returns airports in descending order', async (t) => {
  const app = await build(t)

  // Mock Supabase response
  const { supabase } = require('../../utils/supabase')
  supabase.order.mockReturnValueOnce({
    data: [
      { iata: 'JFK', airport: 'New York/JFK', comfort: 8.0, efficiency: 7.5, aesthetics: 8.5, cex: 8.0 },
      { iata: 'GRU', airport: 'São Paulo/Guarulhos', comfort: 7.5, efficiency: 8.0, aesthetics: 6.5, cex: 7.33 }
    ],
    error: null
  })

  const res = await app.inject({
    method: 'GET',
    url: '/api/airports/order/desc'
  })

  assert.equal(res.statusCode, 200)
  
  const result = JSON.parse(res.payload)
  assert.equal(result.length, 2)
  assert.equal(result[0].iata, 'JFK')
  assert.equal(result[1].iata, 'GRU')
})

test('GET /api/airports/search/:name returns airports matching the search', async (t) => {
  const app = await build(t)

  // Mock Supabase response
  const { supabase } = require('../../utils/supabase')
  supabase.ilike.mockReturnValueOnce({
    data: [
      { iata: 'GRU', airport: 'São Paulo/Guarulhos', comfort: 7.5, efficiency: 8.0, aesthetics: 6.5, cex: 7.33 }
    ],
    error: null
  })

  const res = await app.inject({
    method: 'GET',
    url: '/api/airports/search/Paulo'
  })

  assert.equal(res.statusCode, 200)
  
  const result = JSON.parse(res.payload)
  assert.equal(result.length, 1)
  assert.equal(result[0].iata, 'GRU')
  assert.equal(result[0].airport, 'São Paulo/Guarulhos')
})

test('GET /api/airports/cex/above/:value returns airports with CEX above value', async (t) => {
  const app = await build(t)

  // Mock Supabase response
  const { supabase } = require('../../utils/supabase')
  supabase.order.mockReturnValueOnce({
    data: [
      { iata: 'JFK', airport: 'New York/JFK', comfort: 8.0, efficiency: 7.5, aesthetics: 8.5, cex: 8.0 }
    ],
    error: null
  })

  const res = await app.inject({
    method: 'GET',
    url: '/api/airports/cex/above/7.5'
  })

  assert.equal(res.statusCode, 200)
  
  const result = JSON.parse(res.payload)
  assert.equal(result.length, 1)
  assert.equal(result[0].iata, 'JFK')
  assert.equal(result[0].cex, 8.0)
})