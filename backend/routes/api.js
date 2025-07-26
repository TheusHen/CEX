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

router.get('/airports/order/desc', async (req, res) => {
  const { data, error } = await supabase.from('airports_cex').select('*').order('cex', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/airports/order/asc', async (req, res) => {
  const { data, error } = await supabase.from('airports_cex').select('*').order('cex', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/airports/search/:name', async (req, res) => {
  const { name } = req.params
  const { data, error } = await supabase.from('airports_cex').select('*').ilike('airport', `%${name}%`)
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/airports/cex/above/:value', async (req, res) => {
  const value = parseFloat(req.params.value)
  const { data, error } = await supabase.from('airports_cex').select('*').gt('cex', value).order('cex', { ascending: false })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

router.get('/airports/cex/below/:value', async (req, res) => {
  const value = parseFloat(req.params.value)
  const { data, error } = await supabase.from('airports_cex').select('*').lt('cex', value).order('cex', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})

module.exports = router
