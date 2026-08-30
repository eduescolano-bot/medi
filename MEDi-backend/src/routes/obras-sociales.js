const express = require('express')
const db = require('../database')
const router = express.Router()

// Catálogo público de obras sociales (para el buscador y el alta de perfil)
router.get('/', async (req, res) => {
  try {
    const resultado = await db.query('SELECT id, nombre FROM obras_sociales ORDER BY nombre')
    res.json(resultado.rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
