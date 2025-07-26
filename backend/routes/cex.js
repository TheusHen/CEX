'use strict'

const { supabase } = require('../utils/supabase')

module.exports = async function (fastify, opts) {
  fastify.post('/cex', async (request, reply) => {
    const data = request.body
    fastify.log.info({ data }, '[POST] /cex - Payload received')

    try {
      const requiredFields = ['Sp', 'Ac', 'Da', 'Zl', 'To', 'Ng', 'Rt', 'Pm', 'Va', 'Id', 'Sc', 'Lu', 'iata', 'airport']
      for (const field of requiredFields) {
        if (!(field in data)) {
          fastify.log.warn({ missing: field }, `Missing field: ${field}`)
          return reply.code(400).send({ error: `Missing field: ${field}` })
        }
      }

      // Numeric type validation
      const numFields = ['Sp', 'Ac', 'Da', 'Zl', 'To', 'Ng', 'Rt', 'Pm', 'Va', 'Id', 'Sc', 'Lu']
      for (const field of numFields) {
        if (typeof data[field] !== 'number' || isNaN(data[field])) {
          fastify.log.warn({ field, value: data[field] }, `Field is not a number: ${field}`)
          return reply.code(400).send({ error: `Field ${field} must be a number` })
        }
      }

      // Weights
      const wC = 1, wE = 1, wX = 1

      // Comfort (C)
      const C = (data.Sp + data.Ac + data.Da + data.Zl) / 4

      // Efficiency (E)
      const E = (data.To + data.Ng + data.Rt + data.Pm) / 4

      // Aesthetics (X)
      const X = (data.Va + data.Id + data.Sc + data.Lu) / 4

      // CEX score
      const CEX = (wC * C + wE * E + wX * X) / (wC + wE + wX)

      // Save to Supabase
      const { error } = await supabase.from('airports_cex').insert([{
        iata: data.iata,
        airport: data.airport,
        comfort: C,
        efficiency: E,
        aesthetics: X,
        cex: CEX
      }])

      if (error) {
        fastify.log.error({ error }, 'Error saving to Supabase')
        return reply.code(500).send({ error: error.message })
      }

      const result = {
        iata: data.iata,
        airport: data.airport,
        C: parseFloat(C.toFixed(2)),
        E: parseFloat(E.toFixed(2)),
        X: parseFloat(X.toFixed(2)),
        CEX: parseFloat(CEX.toFixed(2))
      }

      fastify.log.info({ result }, '[POST] /cex - Result calculated and saved')
      return reply.send(result)
    } catch (err) {
      fastify.log.error({ err }, 'Unexpected error in /cex endpoint')
      return reply.code(500).send({ error: err.message })
    }
  })
}