# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# MEDi — contexto del proyecto

App para Android e iOS donde pacientes buscan profesionales de salud por especialidad, con búsqueda automática por GPS (profesionales cercanos a la ubicación del usuario). Cartilla de prestadores: profesionales independientes se suman cargando su perfil, consultorio(s) y especialidad.

Decisiones de producto:
- Proyecto independiente de MED Conectado (repo/carpeta hermana en `Desktop\med-conectado`): base de datos propia, sin compartir backend por ahora.
- Monetización: gratis para profesionales al inicio para sumar volumen; se evaluará cobrar (comisión o suscripción) más adelante.
- MVP: contacto por WhatsApp/llamada en vez de reserva de turno online (la reserva online queda para fase 2).
- Flujo de pantallas: onboarding con permiso de ubicación → buscador de especialidad → resultados ordenados por cercanía (con filtros de obra social/distancia) → ficha del profesional (consultorio, horarios, botón de contacto).
- Publicación: Google Play (USD 25 único) y App Store (USD 99/año).

Estructura del repo:
- Raíz (`C:\Proyectos\MEDi`): frontend Expo/React Native (expo-router, TypeScript).
- `MEDi-backend/`: backend Node/Express/PostgreSQL, mismo stack que MED Conectado pero base de datos y despliegue propios. Ver `MEDi-backend/README.md` para endpoints y modelo de datos completo (profesionales, especialidades, consultorios con lat/lng, horarios_atencion, obras_sociales, y las tablas N:N que las relacionan). Probado end-to-end (registro, login, alta de consultorio/horario, búsqueda pública por especialidad+GPS con fórmula de haversine, filtro por obra social).

Estado de despliegue:
- Backend en producción en Railway (servicio "MEDi-backend"), conectado a un Postgres propio del mismo proyecto Railway por red privada. El frontend (`src/app/index.tsx`, constante `API_BASE`) ya apunta a esa URL pública, así que la app funciona desde cualquier red sin depender de la PC.
- Repo completo (frontend + `MEDi-backend/`) en GitHub, `eduescolano-bot/medi`, privado, rama `main`.

Diseño visual:
- Marca: logo MEDi + tagline "La salud más cerca tuyo". Paleta extraída del logo: navy `#0B3A5C` (títulos/texto principal), teal `#0A6E63`→`#0B8275` (acento/gradiente de botones), gris `#64748B` (texto secundario), fondo `#F7FAFB`.
- Hay un prototipo cliqueable del flujo completo (onboarding → buscador → resultados → ficha) hecho con Claude Design, usado como referencia visual antes de tocar el código real.
- `src/app/index.tsx` (la pantalla real, hoy única pantalla) ya está alineada a esa paleta: usa el logo real (`assets/images/medi-logo.png`), un ícono por especialidad, y muestra la `bio` del profesional (columna `profesionales.bio`, ya soportada por el backend) en cada resultado.
- El flujo ya está separado en pantallas propias: `index.tsx` (bienvenida) → `buscador.tsx` (grilla de especialidades) → `resultados.tsx` (lista de profesionales, con volver e Inicio). Pendiente si se quiere llevar más lejos: ficha de detalle individual del profesional (hoy el contacto se hace directo desde la card de resultados).

Camino a la APK:
- Íconos reales de MEDi ya en `assets/images/` (icon.png, adaptive icon de Android con foreground/background/monochrome, favicon, splash), reemplazando los genéricos de Expo.
- `app.json` tiene `android.package` / `ios.bundleIdentifier` = `com.medi.app` (placeholder, fácil de cambiar antes de la primera subida a Google Play / App Store).
- Pendiente: cuenta de Expo/EAS + `eas build -p android` para generar la APK de prueba. Para iOS hace falta antes inscribirse en el Apple Developer Program (USD 99/año) — sin eso no se puede ni firmar una build de prueba.
