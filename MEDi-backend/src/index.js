require('dotenv').config()
const express = require('express')
const cors = require('cors')
const db = require('./database')

const app = express()
app.use(cors())
// Límite más alto que el default (100kb): las fotos de perfil viajan como
// data URL en base64 dentro del JSON, ya comprimidas del lado del panel.
app.use(express.json({ limit: '2mb' }))

app.get('/health', (req, res) => res.json({ ok: true, servicio: 'MEDi-backend' }))

app.use('/auth', require('./routes/auth'))
app.use('/profesionales', require('./routes/profesionales'))
app.use('/consultorios', require('./routes/consultorios'))
app.use('/horarios', require('./routes/horarios'))
app.use('/especialidades', require('./routes/especialidades'))
app.use('/obras-sociales', require('./routes/obras-sociales'))
app.use('/publico', require('./routes/publico'))
app.use('/admin', require('./routes/admin'))

app.use((req, res) => res.status(404).json({ error: 'Ruta no encontrada' }))

const PORT = process.env.PORT || 4001

db.migrar()
  .then(() => {
    app.listen(PORT, () => console.log(`🚀 MEDi-backend escuchando en el puerto ${PORT}`))
  })
  .catch((e) => {
    console.error('❌ Error al migrar la base de datos:', e.message || e)
    if (Array.isArray(e.errors)) {
      e.errors.forEach((sub) => console.error('   →', sub.message || sub))
    }
    console.error('   Revisá que DATABASE_URL en tu .env apunte a una base de datos real y accesible.')
    process.exit(1)
  })
