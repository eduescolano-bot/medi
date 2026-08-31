const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const crypto = require('crypto')
const db = require('../database')
const { verificarAdmin } = require('../middleware/auth')
const router = express.Router()

// Login del panel de administración: una sola contraseña compartida
// (ADMIN_PASSWORD en las variables de entorno), no hay usuarios admin en la
// base de datos.
router.post('/login', async (req, res) => {
  const { password } = req.body
  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Contraseña incorrecta' })
  }
  const token = jwt.sign({ admin: true }, process.env.JWT_SECRET, { expiresIn: '30d' })
  res.json({ token })
})

router.use(verificarAdmin)

// Listado resumido de profesionales para la tabla del panel.
router.get('/profesionales', async (req, res) => {
  try {
    const resultado = await db.query(`
      SELECT p.id, p.nombre, p.apellido, p.email, p.telefono, p.whatsapp, p.matricula,
        p.activo, p.atiende_domicilio,
        (SELECT json_agg(json_build_object('id', e.id, 'nombre', e.nombre) ORDER BY e.nombre)
          FROM especialidades e JOIN profesional_especialidades pe ON pe.especialidad_id = e.id
          WHERE pe.profesional_id = p.id) as especialidades,
        (SELECT count(*)::int FROM consultorios c WHERE c.profesional_id = p.id) as cantidad_consultorios
      FROM profesionales p
      ORDER BY p.creado_en DESC
    `)
    res.json(resultado.rows)
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Ficha completa de un profesional para editar (incluye consultorios y horarios).
router.get('/profesionales/:id', async (req, res) => {
  try {
    const resultado = await db.query(
      `SELECT p.id, p.nombre, p.apellido, p.email, p.dni, p.telefono, p.whatsapp, p.matricula,
        p.bio, p.activo, p.atiende_domicilio, p.foto_url,
        (SELECT json_agg(json_build_object('id', e.id, 'nombre', e.nombre) ORDER BY e.nombre)
          FROM especialidades e JOIN profesional_especialidades pe ON pe.especialidad_id = e.id
          WHERE pe.profesional_id = p.id) as especialidades,
        (SELECT json_agg(json_build_object('id', o.id, 'nombre', o.nombre) ORDER BY o.nombre)
          FROM obras_sociales o JOIN profesional_obras_sociales po ON po.obra_social_id = o.id
          WHERE po.profesional_id = p.id) as obras_sociales,
        (SELECT json_agg(json_build_object(
            'id', c.id, 'nombre', c.nombre, 'direccion', c.direccion, 'ciudad', c.ciudad,
            'provincia', c.provincia, 'lat', c.lat, 'lng', c.lng, 'telefono', c.telefono,
            'horarios', (SELECT json_agg(json_build_object(
                'id', h.id, 'dia_semana', h.dia_semana, 'hora_inicio', h.hora_inicio, 'hora_fin', h.hora_fin
              ) ORDER BY h.dia_semana, h.hora_inicio)
              FROM horarios_atencion h WHERE h.consultorio_id = c.id)
          ) ORDER BY c.id) FROM consultorios c WHERE c.profesional_id = p.id) as consultorios
       FROM profesionales p WHERE p.id = $1`,
      [req.params.id]
    )
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Profesional no encontrado' })
    res.json(resultado.rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Alta de un profesional nuevo. El admin lo carga en nombre del profesional
// (todavía no hay autoregistro desde la app), así que la contraseña de login
// se genera sola — no se usa en ningún lado por ahora.
router.post('/profesionales', async (req, res) => {
  const client = await db.pool.connect()
  try {
    const {
      nombre, apellido, email, telefono, whatsapp, matricula, bio,
      atiende_domicilio, especialidad_ids, consultorio, horarios, foto_url
    } = req.body
    if (!nombre || !apellido) {
      return res.status(400).json({ error: 'Nombre y apellido son obligatorios' })
    }
    const emailFinal = (email && email.trim()) || `sinemail+${crypto.randomBytes(6).toString('hex')}@medi.local`
    const passwordAleatoria = crypto.randomBytes(12).toString('hex')
    const password_hash = await bcrypt.hash(passwordAleatoria, 10)

    await client.query('BEGIN')

    const resultado = await client.query(
      `INSERT INTO profesionales (nombre, apellido, email, password_hash, telefono, whatsapp, matricula, bio, atiende_domicilio, foto_url)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING id`,
      [nombre, apellido, emailFinal.toLowerCase(), password_hash, telefono || null, whatsapp || null, matricula || null, bio || null, !!atiende_domicilio, foto_url || null]
    )
    const profesional_id = resultado.rows[0].id

    for (const especialidad_id of Array.isArray(especialidad_ids) ? especialidad_ids : []) {
      await client.query('INSERT INTO profesional_especialidades (profesional_id, especialidad_id) VALUES ($1,$2)', [profesional_id, especialidad_id])
    }

    if (consultorio && consultorio.lat != null && consultorio.lng != null) {
      const consultorioResultado = await client.query(
        `INSERT INTO consultorios (profesional_id, nombre, direccion, ciudad, provincia, lat, lng, telefono)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [profesional_id, consultorio.nombre || null, consultorio.direccion || null, consultorio.ciudad || null,
         consultorio.provincia || null, consultorio.lat, consultorio.lng, consultorio.telefono || null]
      )
      const consultorio_id = consultorioResultado.rows[0].id
      for (const h of Array.isArray(horarios) ? horarios : []) {
        await client.query(
          'INSERT INTO horarios_atencion (consultorio_id, dia_semana, hora_inicio, hora_fin) VALUES ($1,$2,$3,$4)',
          [consultorio_id, h.dia_semana, h.hora_inicio, h.hora_fin]
        )
      }
    }

    await client.query('COMMIT')
    res.json({ mensaje: '✅ Profesional creado', id: profesional_id })
  } catch (e) {
    await client.query('ROLLBACK')
    res.status(500).json({ error: e.message })
  } finally {
    client.release()
  }
})

// Edición de datos básicos de un profesional ya existente.
router.put('/profesionales/:id', async (req, res) => {
  try {
    const { nombre, apellido, telefono, whatsapp, matricula, bio, atiende_domicilio, activo, foto_url } = req.body
    // foto_url es opcional en este endpoint: si no viene en el body (undefined),
    // no tocamos la que ya estaba guardada — así el formulario puede mandar
    // solo los datos básicos sin borrar sin querer la foto ya cargada.
    await db.query(
      `UPDATE profesionales SET nombre=$1, apellido=$2, telefono=$3, whatsapp=$4, matricula=$5, bio=$6,
        atiende_domicilio=$7, activo=$8, foto_url=COALESCE($9, foto_url)
       WHERE id=$10`,
      [nombre, apellido, telefono || null, whatsapp || null, matricula || null, bio || null,
       !!atiende_domicilio, activo !== false, foto_url === undefined ? null : foto_url, req.params.id]
    )
    res.json({ mensaje: '✅ Profesional actualizado' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/profesionales/:id/especialidades', async (req, res) => {
  const client = await db.pool.connect()
  try {
    const especialidad_ids = Array.isArray(req.body.especialidad_ids) ? req.body.especialidad_ids : []
    await client.query('BEGIN')
    await client.query('DELETE FROM profesional_especialidades WHERE profesional_id = $1', [req.params.id])
    for (const id of especialidad_ids) {
      await client.query('INSERT INTO profesional_especialidades (profesional_id, especialidad_id) VALUES ($1,$2)', [req.params.id, id])
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

router.post('/profesionales/:id/consultorios', async (req, res) => {
  try {
    const { nombre, direccion, ciudad, provincia, lat, lng, telefono } = req.body
    if (lat == null || lng == null) return res.status(400).json({ error: 'Falta la ubicación (lat/lng) del consultorio' })
    const resultado = await db.query(
      `INSERT INTO consultorios (profesional_id, nombre, direccion, ciudad, provincia, lat, lng, telefono)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.params.id, nombre || null, direccion || null, ciudad || null, provincia || null, lat, lng, telefono || null]
    )
    res.json(resultado.rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.put('/consultorios/:id', async (req, res) => {
  try {
    const { nombre, direccion, ciudad, provincia, lat, lng, telefono } = req.body
    await db.query(
      `UPDATE consultorios SET nombre=$1, direccion=$2, ciudad=$3, provincia=$4, lat=$5, lng=$6, telefono=$7 WHERE id=$8`,
      [nombre || null, direccion || null, ciudad || null, provincia || null, lat, lng, telefono || null, req.params.id]
    )
    res.json({ mensaje: '✅ Consultorio actualizado' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/consultorios/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM consultorios WHERE id = $1', [req.params.id])
    res.json({ mensaje: '✅ Consultorio eliminado' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/horarios', async (req, res) => {
  try {
    const { consultorio_id, dia_semana, hora_inicio, hora_fin } = req.body
    if (consultorio_id == null || dia_semana == null || !hora_inicio || !hora_fin) {
      return res.status(400).json({ error: 'Faltan datos del horario' })
    }
    const resultado = await db.query(
      'INSERT INTO horarios_atencion (consultorio_id, dia_semana, hora_inicio, hora_fin) VALUES ($1,$2,$3,$4) RETURNING *',
      [consultorio_id, dia_semana, hora_inicio, hora_fin]
    )
    res.json(resultado.rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.delete('/horarios/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM horarios_atencion WHERE id = $1', [req.params.id])
    res.json({ mensaje: '✅ Horario eliminado' })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

// Métricas: qué especialidades se buscan más y con qué profesionales
// interactúan más (clics en "Contactar").
router.get('/metricas', async (req, res) => {
  try {
    const [busquedas, contactos, totales] = await Promise.all([
      db.query(`
        SELECT e.nombre as especialidad, count(*)::int as total
        FROM eventos_busqueda eb JOIN especialidades e ON e.id = eb.especialidad_id
        GROUP BY e.nombre ORDER BY total DESC
      `),
      db.query(`
        SELECT (p.nombre || ' ' || p.apellido) as profesional, count(*)::int as total
        FROM eventos_contacto ec JOIN profesionales p ON p.id = ec.profesional_id
        GROUP BY p.nombre, p.apellido ORDER BY total DESC
      `),
      db.query(`
        SELECT
          (SELECT count(*)::int FROM eventos_busqueda) as busquedas,
          (SELECT count(*)::int FROM eventos_contacto) as contactos,
          (SELECT count(*)::int FROM profesionales WHERE activo = true) as profesionales_activos
      `)
    ])
    res.json({
      busquedasPorEspecialidad: busquedas.rows,
      contactosPorProfesional: contactos.rows,
      totales: totales.rows[0]
    })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
