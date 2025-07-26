'use strict'

const { supabase } = require('../utils/supabase')

module.exports = async function (fastify, opts) {
  // Get all ratings for all airports
  fastify.get('/airports', async (request, reply) => {
    const { data, error } = await supabase
      .from('airports_cex')
      .select('*')
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  // Get ratings for a specific airport by IATA
  fastify.get('/airports/:iata', async (request, reply) => {
    const { iata } = request.params
    const { data, error } = await supabase
      .from('airports_cex')
      .select('*')
      .eq('iata', iata)
      .single()
    if (error) return reply.code(404).send({ error: 'Airport not found' })
    return reply.send(data)
  })

  // Get all airports ordered by CEX score (highest to lowest)
  fastify.get('/airports/order/desc', async (request, reply) => {
    const { data, error } = await supabase
      .from('airports_cex')
      .select('*')
      .order('cex', { ascending: false })
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  // Get all airports ordered by CEX score (lowest to highest)
  fastify.get('/airports/order/asc', async (request, reply) => {
    const { data, error } = await supabase
      .from('airports_cex')
      .select('*')
      .order('cex', { ascending: true })
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  // Search airports by (partial) name
  fastify.get('/airports/search/:name', async (request, reply) => {
    const { name } = request.params
    const { data, error } = await supabase
      .from('airports_cex')
      .select('*')
      .ilike('airport', `%${name}%`)
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  // Get airports with CEX score above a value
  fastify.get('/airports/cex/above/:value', async (request, reply) => {
    const value = parseFloat(request.params.value)
    const { data, error } = await supabase
      .from('airports_cex')
      .select('*')
      .gt('cex', value)
      .order('cex', { ascending: false })
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })

  // Get airports with CEX score below a value
  fastify.get('/airports/cex/below/:value', async (request, reply) => {
    const value = parseFloat(request.params.value)
    const { data, error } = await supabase
      .from('airports_cex')
      .select('*')
      .lt('cex', value)
      .order('cex', { ascending: true })
    if (error) return reply.code(500).send({ error: error.message })
    return reply.send(data)
  })
}
