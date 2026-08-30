const express = require('express')
const db = require('../database')
const router = express.Router()

// Búsqueda pública: por especialidad + ubicación del usuario, ordenada por
// cercanía. Devuelve el consultorio más cercano de cada profesional que
// matchea (si tiene varios, se queda con el más próximo al usuario).
router.get('/buscar', async (req, res) => {
  try {
    const lat = Number(req.query.lat)
    const lng = Number(req.query.lng)
    const especialidad_id = Number(req.query.especialidad_id)
    const radio_km = req.query.radio_km ? Number(req.query.radio_km) : 20
    const obra_social_id = req.query.obra_social_id ? Number(req.query.obra_social_id) : null

    if (!lat || !lng || !especialidad_id) {
      return res.status(400).json({ error: 'Se requiere lat, lng y especialidad_id' })
    }

    const query = `
      SELECT * FROM (
        SELECT DISTINCT ON (p.id)
          p.id, p.nombre, p.apellido, p.matricula, p.foto_url, p.whatsapp, p.telefono, p.bio,
          c.id as consultorio_id, c.nombre as consultorio_nombre, c.direccion, c.ciudad, c.provincia, c.lat, c.lng,
          (6371 * acos(LEAST(1, GREATEST(-1,
              cos(radians($1)) * cos(radians(c.lat)) * cos(radians(c.lng) - radians($2)) + sin(radians($1)) * sin(radians(c.lat))
          )))) AS distancia_km
        FROM profesionales p
        JOIN profesional_especialidades pe ON pe.profesional_id = p.id
        JOIN consultorios c ON c.profesional_id = p.id
        WHERE p.activo = true
          AND pe.especialidad_id = $3
          AND c.lat IS NOT NULL AND c.lng IS NOT NULL
          AND ($5::int IS NULL OR EXISTS (
            SELECT 1 FROM profesional_obras_sociales pos
            WHERE pos.profesional_id = p.id AND pos.obra_social_id = $5
          ))
        ORDER BY p.id, distancia_km ASC
      ) resultados
      WHERE distancia_km <= $4
      ORDER BY distancia_km ASC
    `
    const resultado = await db.query(query, [lat, lng, especialidad_id, radio_km, obra_social_id])
    res.json(resultado.rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Ficha completa de un profesional: datos, especialidades, obras sociales y
// consultorios con sus horarios (para la pantalla de detalle).
router.get('/profesional/:id', async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT p.id, p.nombre, p.apellido, p.matricula, p.bio, p.foto_url, p.whatsapp, p.telefono,
        (SELECT json_agg(json_build_object('id', e.id, 'nombre', e.nombre))
          FROM especialidades e JOIN profesional_especialidades pe ON pe.especialidad_id = e.id
          WHERE pe.profesional_id = p.id) as especialidades,
        (SELECT json_agg(json_build_object('id', o.id, 'nombre', o.nombre))
          FROM obras_sociales o JOIN profesional_obras_sociales po ON po.obra_social_id = o.id
          WHERE po.profesional_id = p.id) as obras_sociales,
        (SELECT json_agg(json_build_object(
            'id', c.id, 'nombre', c.nombre, 'direccion', c.direccion, 'ciudad', c.ciudad,
            'provincia', c.provincia, 'lat', c.lat, 'lng', c.lng, 'telefono', c.telefono,
            'horarios', (SELECT json_agg(json_build_object('dia_semana', h.dia_semana, 'hora_inicio', h.hora_inicio, 'hora_fin', h.hora_fin) ORDER BY h.dia_semana, h.hora_inicio)
              FROM horarios_atencion h WHERE h.consultorio_id = c.id)
          )) FROM consultorios c WHERE c.profesional_id = p.id) as consultorios
       FROM profesionales p WHERE p.id = $1 AND p.activo = true`,
      [req.params.id]
    )
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Profesional no encontrado' })
    res.json(resultado.rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
