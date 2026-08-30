const express = require('express')
const db = require('../database')
const { verificarToken } = require('../middleware/auth')
const router = express.Router()

router.use(verificarToken)

router.put('/perfil', async (req, res) => {
  try {
    const { nombre, apellido, telefono, whatsapp, matricula, bio, foto_url } = req.body
    await db.query(
      `UPDATE profesionales SET nombre=$1, apellido=$2, telefono=$3, whatsapp=$4, matricula=$5, bio=$6, foto_url=$7
       WHERE id=$8`,
      [nombre, apellido, telefono || null, whatsapp || null, matricula || null, bio || null, foto_url || null, req.profesional_id]
    )
    res.json({ mensaje: '✅ Perfil actualizado' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/especialidades', async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT e.id, e.nombre FROM especialidades e
       JOIN profesional_especialidades pe ON pe.especialidad_id = e.id
       WHERE pe.profesional_id = $1 ORDER BY e.nombre`,
      [req.profesional_id]
    )
    res.json(resultado.rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/especialidades', async (req, res) => {
  const client = await db.pool.connect()
  try {
    const especialidad_ids = Array.isArray(req.body.especialidad_ids) ? req.body.especialidad_ids : []
    await client.query('BEGIN')
    await client.query('DELETE FROM profesional_especialidades WHERE profesional_id = $1', [req.profesional_id])
    for (const id of especialidad_ids) {
      await client.query('INSERT INTO profesional_especialidades (profesional_id, especialidad_id) VALUES ($1,$2)', [req.profesional_id, id])
    }
    await client.query('COMMIT')
    res.json({ mensaje: '✅ Especialidades actualizadas' })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

router.get('/obras-sociales', async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT o.id, o.nombre FROM obras_sociales o
       JOIN profesional_obras_sociales po ON po.obra_social_id = o.id
       WHERE po.profesional_id = $1 ORDER BY o.nombre`,
      [req.profesional_id]
    )
    res.json(resultado.rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/obras-sociales', async (req, res) => {
  const client = await db.pool.connect()
  try {
    const obra_social_ids = Array.isArray(req.body.obra_social_ids) ? req.body.obra_social_ids : []
    await client.query('BEGIN')
    await client.query('DELETE FROM profesional_obras_sociales WHERE profesional_id = $1', [req.profesional_id])
    for (const id of obra_social_ids) {
      await client.query('INSERT INTO profesional_obras_sociales (profesional_id, obra_social_id) VALUES ($1,$2)', [req.profesional_id, id])
    }
    await client.query('COMMIT')
    res.json({ mensaje: '✅ Obras sociales actualizadas' })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

module.exports = router
