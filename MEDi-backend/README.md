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
- `GET /publico/buscar?especialidad_id=&lat=&lng=&radio_km=&obra_social_id=` — profesionales cercanos, ordenados por distancia. `radio_km` es opcional (default 20). `obra_social_id` es opcional. Cada búsqueda queda registrada (`eventos_busqueda`) para las métricas del panel.
- `GET /publico/profesional/:id` — ficha completa (datos, especialidades, obras sociales, consultorios con horarios).
- `POST /publico/registrar-contacto` (`{ profesional_id, medio }`) — la app lo llama cuando el paciente toca "Contactar"; queda registrado en `eventos_contacto` para las métricas.

**Panel de administración** (`/admin`, protegido con contraseña — no requiere cuenta de profesional)
- `POST /admin/login` (`{ password }`, compara contra `ADMIN_PASSWORD`) — devuelve un token para el resto de `/admin`.
- `GET /admin/profesionales` / `GET /admin/profesionales/:id` — listado y ficha completa para editar.
- `POST /admin/profesionales` — alta de un profesional nuevo (datos, especialidades, y opcionalmente un consultorio con sus horarios).
- `PUT /admin/profesionales/:id` / `PUT /admin/profesionales/:id/especialidades` — edición de datos básicos, `atiende_domicilio`, `activo`, y especialidades.
- `POST/PUT/DELETE /admin/consultorios` y `/admin/horarios` — gestión de consultorios y horarios de cualquier profesional.
- `GET /admin/metricas` — búsquedas por especialidad y contactos por profesional.

## Panel de administración (cómo abrirlo)

El panel vive como un único archivo HTML en `admin/index.html`, dentro de esta
misma carpeta (`MEDi-backend`). No es una web publicada: es un archivo que se
abre localmente con doble clic (se abre en el navegador) y desde ahí habla
directo con la API de Railway. Pide la contraseña de `ADMIN_PASSWORD` para
entrar. Desde el panel se pueden cargar y editar profesionales (incluidos
odontólogos u otras especialidades nuevas), marcar "atiende a domicilio", y
ver las métricas de búsquedas y contactos.

## Pendiente para fases siguientes

- Reserva de turnos online (el MVP usa contacto directo por WhatsApp/llamada con el `whatsapp`/`telefono` del profesional).
- Cobro a profesionales (comisión o suscripción) — arranca gratis para sumar volumen.
- Integración con MED Conectado si en algún momento hace falta compartir datos entre ambas apps.
- Autoregistro real de profesionales desde la app (hoy la carga la hace el admin desde el panel).
