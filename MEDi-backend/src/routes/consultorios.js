const express = require('express')
const db = require('../database')
const { verificarToken } = require('../middleware/auth')
const router = express.Router()

router.use(verificarToken)

router.get('/', async (req, res) => {
  try {
    const resultado = await db.query('SELECT * FROM consultorios WHERE profesional_id = $1 ORDER BY id', [req.profesional_id])
    res.json(resultado.rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', async (req, res) => {
  try {
    const { nombre, direccion, ciudad, provincia, lat, lng, telefono } = req.body
    if (lat == null || lng == null) return res.status(400).json({ error: 'Falta la ubicación (lat/lng) del consultorio' })
    const resultado = await db.query(
      `INSERT INTO consultorios (profesional_id, nombre, direccion, ciudad, provincia, lat, lng, telefono)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.profesional_id, nombre || null, direccion || null, ciudad || null, provincia || null, lat, lng, telefono || null]
    )
    res.json(resultado.rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/:id', async (req, res) => {
  try {
    const check = await db.query('SELECT id FROM consultorios WHERE id = $1 AND profesional_id = $2', [req.params.id, req.profesional_id])
    if (check.rows.length === 0) return res.status(403).json({ error: 'Este consultorio no te pertenece' })
    const { nombre, direccion, ciudad, provincia, lat, lng, telefono } = req.body
    await db.query(
      `UPDATE consultorios SET nombre=$1, direccion=$2, ciudad=$3, provincia=$4, lat=$5, lng=$6, telefono=$7 WHERE id=$8`,
      [nombre || null, direccion || null, ciudad || null, provincia || null, lat, lng, telefono || null, req.params.id]
    )
    res.json({ mensaje: '✅ Consultorio actualizado' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', async (req, res) => {
  try {
    const check = await db.query('SELECT id FROM consultorios WHERE id = $1 AND profesional_id = $2', [req.params.id, req.profesional_id])
    if (check.rows.length === 0) return res.status(403).json({ error: 'Este consultorio no te pertenece' })
    await db.query('DELETE FROM consultorios WHERE id = $1', [req.params.id])
    res.json({ mensaje: '✅ Consultorio eliminado' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
