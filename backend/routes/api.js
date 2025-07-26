'use strict'

const express = require('express')
const { supabase } = require('../utils/supabase')

const router = express.Router()

router.get('/airports', async (req, res) => {
  const { data, error } = await supabase.from('airports_cex').select('*')
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/airports/:iata', async (req, res) => {
  const { iata } = req.params
  const { data, error } = await supabase.from('airports_cex').select('*').eq('iata', iata).single()
  if (error) return res.status(404).json({ error: 'Airport not found' })
  res.json(data)
})

// ...existing code for other routes...

module.exports = router
