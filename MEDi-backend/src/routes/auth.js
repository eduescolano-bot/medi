const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../database')
const { verificarToken } = require('../middleware/auth')
const router = express.Router()

router.post('/registro', async (req, res) => {
  try {
    const { nombre, apellido, dni, email, password, telefono, whatsapp, matricula } = req.body
    if (!nombre || !apellido || !email || !password) {
      return res.status(400).json({ error: 'Nombre, apellido, email y contraseña son obligatorios' })
    }
    const existente = await db.query('SELECT id FROM profesionales WHERE email = $1', [email.toLowerCase()])
    if (existente.rows.length > 0) {
      return res.status(409).json({ error: 'Ya existe un profesional registrado con ese email' })
    }
    const password_hash = await bcrypt.hash(password, 10)
    const resultado = await db.query(
      `INSERT INTO profesionales (nombre, apellido, dni, email, password_hash, telefono, whatsapp, matricula)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id, nombre, apellido, email`,
      [nombre, apellido, dni || null, email.toLowerCase(), password_hash, telefono || null, whatsapp || null, matricula || null]
    )
    const profesional = resultado.rows[0]
    const token = jwt.sign({ profesional_id: profesional.id }, process.env.JWT_SECRET, { expiresIn: '30d' })
    res.json({ mensaje: '✅ Cuenta creada', token, profesional })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) return res.status(400).json({ error: 'Email y contraseña son obligatorios' })
    const resultado = await db.query('SELECT * FROM profesionales WHERE email = $1', [email.toLowerCase()])
    if (resultado.rows.length === 0) return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    const profesional = resultado.rows[0]
    const coincide = await bcrypt.compare(password, profesional.password_hash)
    if (!coincide) return res.status(401).json({ error: 'Email o contraseña incorrectos' })
    const token = jwt.sign({ profesional_id: profesional.id }, process.env.JWT_SECRET, { expiresIn: '30d' })
    delete profesional.password_hash
    res.json({ mensaje: '✅ Sesión iniciada', token, profesional })
  } catch (e) { res.status(500).json({ error: e.message }) }
})

router.get('/perfil', verificarToken, async (req, res) => {
  try {
    const resultado = await db.query(
      'SELECT id, nombre, apellido, dni, email, telefono, whatsapp, matricula, bio, foto_url, activo FROM profesionales WHERE id = $1',
      [req.profesional_id]
    )
    if (resultado.rows.length === 0) return res.status(404).json({ error: 'Profesional no encontrado' })
    res.json(resultado.rows[0])
  } catch (e) { res.status(500).json({ error: e.message }) }
})

module.exports = router
