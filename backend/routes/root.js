'use strict'

const express = require('express')
const router = express.Router()

router.get('/', (req, res) => {
  res.json({ online: true })
})

module.exports = router
