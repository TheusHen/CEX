'use strict'

const { test } = require('node:test')
const assert = require('node:assert')
const { build } = require('../helper')

// Mock Supabase
jest.mock('../../utils/supabase', () => ({
  supabase: {
    from: jest.fn().mockReturnThis(),
    insert: jest.fn().mockResolvedValue({ error: null })
  }
}))

test('POST /api/cex with valid data', async (t) => {
  const app = await build(t)

  const validData = {
    Sp: 8.0, Ac: 7.0, Da: 9.0, Zl: 6.0,  // Comfort
    To: 8.0, Ng: 7.0, Rt: 9.0, Pm: 6.0,  // Efficiency
    Va: 8.0, Id: 7.0, Sc: 9.0, Lu: 6.0,  // Aesthetics
    iata: 'GRU', airport: 'São Paulo/Guarulhos'
  }

  const res = await app.inject({
    method: 'POST',
    url: '/api/cex',
    payload: validData
  })

  assert.equal(res.statusCode, 200)
  
  const result = JSON.parse(res.payload)
  assert.equal(result.iata, 'GRU')
  assert.equal(result.airport, 'São Paulo/Guarulhos')
  
  // Calculate expected values
  const expectedC = (8.0 + 7.0 + 9.0 + 6.0) / 4
  const expectedE = (8.0 + 7.0 + 9.0 + 6.0) / 4
  const expectedX = (8.0 + 7.0 + 9.0 + 6.0) / 4
  const expectedCEX = (expectedC + expectedE + expectedX) / 3
  
  // Check that the calculated values match the expected values
  assert.equal(result.C, parseFloat(expectedC.toFixed(2)))
  assert.equal(result.E, parseFloat(expectedE.toFixed(2)))
  assert.equal(result.X, parseFloat(expectedX.toFixed(2)))
  assert.equal(result.CEX, parseFloat(expectedCEX.toFixed(2)))
})

test('POST /api/cex with missing field', async (t) => {
  const app = await build(t)

  const invalidData = {
    Sp: 8.0, Ac: 7.0, Da: 9.0,  // Missing Zl
    To: 8.0, Ng: 7.0, Rt: 9.0, Pm: 6.0,
    Va: 8.0, Id: 7.0, Sc: 9.0, Lu: 6.0,
    iata: 'GRU', airport: 'São Paulo/Guarulhos'
  }

  const res = await app.inject({
    method: 'POST',
    url: '/api/cex',
    payload: invalidData
  })

  assert.equal(res.statusCode, 400)
  
  const result = JSON.parse(res.payload)
  assert.ok(result.error)
  assert.ok(result.error.includes('Missing field'))
})

test('POST /api/cex with non-numeric field', async (t) => {
  const app = await build(t)

  const invalidData = {
    Sp: 8.0, Ac: 7.0, Da: 9.0, Zl: 'not-a-number',  // Non-numeric Zl
    To: 8.0, Ng: 7.0, Rt: 9.0, Pm: 6.0,
    Va: 8.0, Id: 7.0, Sc: 9.0, Lu: 6.0,
    iata: 'GRU', airport: 'São Paulo/Guarulhos'
  }

  const res = await app.inject({
    method: 'POST',
    url: '/api/cex',
    payload: invalidData
  })

  assert.equal(res.statusCode, 400)
  
  const result = JSON.parse(res.payload)
  assert.ok(result.error)
  assert.ok(result.error.includes('must be a number'))
})

test('POST /api/cex with database error', async (t) => {
  const app = await build(t)

  // Mock Supabase to return an error
  const { supabase } = require('../../utils/supabase')
  supabase.from.mockReturnValueOnce({
    insert: jest.fn().mockResolvedValueOnce({ error: { message: 'Database error' } })
  })

  const validData = {
    Sp: 8.0, Ac: 7.0, Da: 9.0, Zl: 6.0,
    To: 8.0, Ng: 7.0, Rt: 9.0, Pm: 6.0,
    Va: 8.0, Id: 7.0, Sc: 9.0, Lu: 6.0,
    iata: 'GRU', airport: 'São Paulo/Guarulhos'
  }

  const res = await app.inject({
    method: 'POST',
    url: '/api/cex',
    payload: validData
  })

  assert.equal(res.statusCode, 500)
  
  const result = JSON.parse(res.payload)
  assert.ok(result.error)
  assert.equal(result.error, 'Database error')
})