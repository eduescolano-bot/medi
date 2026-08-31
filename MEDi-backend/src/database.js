const { Pool } = require('pg')

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
})

const ESPECIALIDADES_INICIALES = [
  'Clínica médica', 'Pediatría', 'Ginecología', 'Cardiología', 'Dermatología',
  'Traumatología', 'Oftalmología', 'Otorrinolaringología', 'Psiquiatría',
  'Psicología', 'Nutrición', 'Kinesiología', 'Odontología', 'Neurología',
  'Urología', 'Endocrinología', 'Gastroenterología', 'Alergia e inmunología',
  'Fonoaudiología', 'Reumatología'
]

const OBRAS_SOCIALES_INICIALES = [
  'Particular', 'OSDE', 'Swiss Medical', 'Galeno', 'Medife', 'IOMA',
  'PAMI', 'Unión Personal', 'OSDEPYM', 'Sancor Salud', 'Accord Salud'
]

async function migrar() {
  const client = await pool.connect()
  try {
    await client.query(`CREATE TABLE IF NOT EXISTS profesionales (
      id SERIAL PRIMARY KEY,
      nombre TEXT NOT NULL,
      apellido TEXT NOT NULL,
      dni TEXT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      telefono TEXT,
      whatsapp TEXT,
      matricula TEXT,
      bio TEXT,
      foto_url TEXT,
      activo BOOLEAN DEFAULT true,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)

    await client.query(`CREATE TABLE IF NOT EXISTS especialidades (
      id SERIAL PRIMARY KEY,
      nombre TEXT UNIQUE NOT NULL
    )`)

    await client.query(`CREATE TABLE IF NOT EXISTS profesional_especialidades (
      profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
      especialidad_id INTEGER NOT NULL REFERENCES especialidades(id) ON DELETE CASCADE,
      PRIMARY KEY (profesional_id, especialidad_id)
    )`)

    await client.query(`CREATE TABLE IF NOT EXISTS obras_sociales (
      id SERIAL PRIMARY KEY,
      nombre TEXT UNIQUE NOT NULL
    )`)

    await client.query(`CREATE TABLE IF NOT EXISTS profesional_obras_sociales (
      profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
      obra_social_id INTEGER NOT NULL REFERENCES obras_sociales(id) ON DELETE CASCADE,
      PRIMARY KEY (profesional_id, obra_social_id)
    )`)

    await client.query(`CREATE TABLE IF NOT EXISTS consultorios (
      id SERIAL PRIMARY KEY,
      profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
      nombre TEXT,
      direccion TEXT,
      ciudad TEXT,
      provincia TEXT,
      lat DOUBLE PRECISION,
      lng DOUBLE PRECISION,
      telefono TEXT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)

    await client.query(`CREATE TABLE IF NOT EXISTS horarios_atencion (
      id SERIAL PRIMARY KEY,
      consultorio_id INTEGER NOT NULL REFERENCES consultorios(id) ON DELETE CASCADE,
      dia_semana INTEGER NOT NULL,
      hora_inicio TIME NOT NULL,
      hora_fin TIME NOT NULL
    )`)

    // Marca si el profesional atiende a domicilio, además de (u opcionalmente
    // en vez de) en consultorio. Se muestra como distintivo en los resultados.
    await client.query(`ALTER TABLE profesionales ADD COLUMN IF NOT EXISTS atiende_domicilio BOOLEAN DEFAULT false`)

    // Métricas para el panel de administración: un renglón por cada búsqueda
    // pública y por cada clic en "Contactar", para poder ver qué especialidad
    // se busca más y con qué profesionales interactúan más.
    await client.query(`CREATE TABLE IF NOT EXISTS eventos_busqueda (
      id SERIAL PRIMARY KEY,
      especialidad_id INTEGER REFERENCES especialidades(id) ON DELETE SET NULL,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)

    await client.query(`CREATE TABLE IF NOT EXISTS eventos_contacto (
      id SERIAL PRIMARY KEY,
      profesional_id INTEGER REFERENCES profesionales(id) ON DELETE SET NULL,
      medio TEXT,
      creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`)

    // Catálogos iniciales: se insertan una sola vez, no pisan lo que el
    // usuario haya editado (ON CONFLICT DO NOTHING sobre el nombre único).
    for (const nombre of ESPECIALIDADES_INICIALES) {
      await client.query('INSERT INTO especialidades (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', [nombre])
    }
    for (const nombre of OBRAS_SOCIALES_INICIALES) {
      await client.query('INSERT INTO obras_sociales (nombre) VALUES ($1) ON CONFLICT (nombre) DO NOTHING', [nombre])
    }

    console.log('✅ Migraciones de MEDi-backend aplicadas')
  } finally {
    client.release()
  }
}

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
  migrar
}
