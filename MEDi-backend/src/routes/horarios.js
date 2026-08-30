const express = require('express')
const db = require('../database')
const { verificarToken } = require('../middleware/auth')
const router = express.Router()

// Ver los horarios de un consultorio es público (se muestra en la ficha del
// profesional), pero crear/borrar horarios requiere ser el dueño del consultorio.
router.get('/consultorio/:consultorio_id', async (req, res) => {
  try {
    const resultado = await db.query(
      'SELECT * FROM horarios_atencion WHERE consultorio_id = $1 ORDER BY dia_semana, hora_inicio',
      [req.params.consultorio_id]
    )
    res.json(resultado.rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/', verificarToken, async (req, res) => {
  try {
    const { consultorio_id, dia_semana, hora_inicio, hora_fin } = req.body
    if (consultorio_id == null || dia_semana == null || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'Faltan datos del horario' })
    }
    const check = await db.query('SELECT id FROM consultorios WHERE id = $1 AND profesional_id = $2', [consultorio_id, req.profesional_id])
    if (check.rows.length === 0) return res.status(403).json({ error: 'Este consultorio no te pertenece' })
    const resultado = await db.query(
      'INSERT INTO horarios_atencion (consultorio_id, dia_semana, hora_inicio, hora_fin) VALUES ($1,$2,$3,$4) RETURNING *',
      [consultorio_id, dia_semana, hora_inicio, hora_fin]
    )
    res.json(resultado.rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/:id', verificarToken, async (req, res) => {
  try {
    const check = await db.query(
      `SELECT h.id FROM horarios_atencion h
       JOIN consultorios c ON c.id = h.consultorio_id
       WHERE h.id = $1 AND c.profesional_id = $2`,
      [req.params.id, req.profesional_id]
    )
    if (check.rows.length === 0) return res.status(403).json({ error: 'Este horario no te pertenece' })
    await db.query('DELETE FROM horarios_atencion WHERE id = $1', [req.params.id])
    res.json({ mensaje: '✅ Horario eliminado' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
