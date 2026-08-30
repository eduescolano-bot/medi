# MEDi-backend

API para MEDi: app donde pacientes buscan profesionales de salud por especialidad y cercanía (GPS), y los profesionales cargan su ficha (consultorios, horarios, obras sociales).

Proyecto independiente de MED Conectado: base de datos propia, sin compartir backend por ahora.

## Stack

Node / Express / PostgreSQL (mismo stack que MED Conectado, pero proyecto y base de datos aparte).

## Puesta en marcha local

1. Instalar dependencias:
   ```
   npm install
   ```
2. Copiar `.env.example` a `.env` y completar:
   - `DATABASE_URL`: conexión a una base PostgreSQL (local o en la nube, ej. Railway).
   - `JWT_SECRET`: cualquier string largo y random.
   - `PORT`: puerto local (por defecto 4001, distinto del de MED Conectado).
3. Levantar el servidor:
   ```
   npm start
   ```
   Al arrancar corre las migraciones automáticamente (crea las tablas si no existen y carga el catálogo inicial de especialidades y obras sociales).

## Modelo de datos

- `profesionales`: cuenta del profesional (login con email/contraseña).
- `especialidades`: catálogo (Clínica médica, Pediatría, Cardiología, etc.).
- `profesional_especialidades`: qué especialidades tiene cada profesional (N:N).
- `obras_sociales`: catálogo (OSDE, Swiss Medical, PAMI, etc.).
- `profesional_obras_sociales`: qué obras sociales acepta cada profesional (N:N).
- `consultorios`: los consultorios de un profesional, con `lat`/`lng` para la búsqueda por cercanía.
- `horarios_atencion`: días y horarios de atención de cada consultorio.

## Endpoints principales

**Auth** (`/auth`)
- `POST /auth/registro` — crear cuenta de profesional.
- `POST /auth/login` — iniciar sesión, devuelve JWT.
- `GET /auth/perfil` — datos del profesional logueado (requiere token).

**Perfil del profesional** (requieren token)
- `PUT /profesionales/perfil` — editar datos básicos.
- `GET` / `PUT /profesionales/especialidades` — ver/asignar especialidades.
- `GET` / `PUT /profesionales/obras-sociales` — ver/asignar obras sociales.
- `GET` / `POST` / `PUT` / `DELETE /consultorios` — gestionar consultorios propios.
- `GET /horarios/consultorio/:id` (público) / `POST` / `DELETE /horarios` (con token) — gestionar horarios.

**Catálogos públicos**
- `GET /especialidades`
- `GET /obras-sociales`

**Búsqueda pública** (`/publico`, sin login — la usa la app del paciente)
- `GET /publico/buscar?especialidad_id=&lat=&lng=&radio_km=&obra_social_id=` — profesionales cercanos, ordenados por distancia. `radio_km` es opcional (default 20). `obra_social_id` es opcional.
- `GET /publico/profesional/:id` — ficha completa (datos, especialidades, obras sociales, consultorios con horarios).

## Pendiente para fases siguientes

- Reserva de turnos online (el MVP usa contacto directo por WhatsApp/llamada con el `whatsapp`/`telefono` del profesional).
- Cobro a profesionales (comisión o suscripción) — arranca gratis para sumar volumen.
- Integración con MED Conectado si en algún momento hace falta compartir datos entre ambas apps.
