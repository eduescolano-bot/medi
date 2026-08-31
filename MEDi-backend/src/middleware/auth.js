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

// Para el panel de administración: un solo usuario admin (sin cuenta propia
// en la tabla de profesionales), autenticado con una contraseña compartida
// guardada en ADMIN_PASSWORD. El token lleva { admin: true } en vez de un
// profesional_id.
function verificarAdmin(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) return res.status(401).json({ error: 'Token requerido' })
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    if (!decoded.admin) return res.status(403).json({ error: 'No autorizado' })
    next()
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido o vencido' })
  }
}

module.exports = { verificarToken, verificarAdmin }
