'use strict'

const express = require('express')
const { supabase } = require('../utils/supabase')

const router = express.Router()

router.post('/', async (req, res) => {
  const data = req.body

  try {
    const requiredFields = ['Sp', 'Ac', 'Da', 'Zl', 'To', 'Ng', 'Rt', 'Pm', 'Va', 'Id', 'Sc', 'Lu', 'iata', 'airport']
    for (const field of requiredFields) {
      if (!(field in data)) {
        return res.status(400).json({ error: `Missing field: ${field}` })
      }
    }

    const numFields = ['Sp', 'Ac', 'Da', 'Zl', 'To', 'Ng', 'Rt', 'Pm', 'Va', 'Id', 'Sc', 'Lu']
    for (const field of numFields) {
      if (typeof data[field] !== 'number' || isNaN(data[field])) {
        return res.status(400).json({ error: `Field ${field} must be a number` })
      }
    }

    const wC = 1, wE = 1, wX = 1
    const C = (data.Sp + data.Ac + data.Da + data.Zl) / 4
    const E = (data.To + data.Ng + data.Rt + data.Pm) / 4
    const X = (data.Va + data.Id + data.Sc + data.Lu) / 4
    const CEX = (wC * C + wE * E + wX * X) / (wC + wE + wX)

    const { error } = await supabase.from('airports_cex').insert([{
      iata: data.iata,
      airport: data.airport,
      comfort: C,
      efficiency: E,
      aesthetics: X,
      cex: CEX
    }])

    if (error) {
      return res.status(500).json({ error: error.message })
    }

    const result = {
      iata: data.iata,
      airport: data.airport,
      C: parseFloat(C.toFixed(2)),
      E: parseFloat(E.toFixed(2)),
      X: parseFloat(X.toFixed(2)),
      CEX: parseFloat(CEX.toFixed(2))
    }

    res.json(result)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

module.exports = router
