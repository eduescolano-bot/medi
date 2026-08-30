const jwt = require('jsonwebtoken')

function verificarToken(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Token requerido' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.profesional_id = decoded.profesional_id
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o vencido' })
  }
}

module.exports = { verificarToken }
