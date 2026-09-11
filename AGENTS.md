# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

# MEDi — contexto del proyecto

App para Android e iOS donde pacientes buscan profesionales de salud por especialidad, con búsqueda automática por GPS (profesionales cercanos a la ubicación del usuario), y además una vista de mapa con todos los profesionales cercanos sin filtrar por especialidad. Cartilla de prestadores: los profesionales NO se autoregistran — el superadmin (dueño del proyecto) los carga a mano desde un panel de administración web.

Decisiones de producto:
- Proyecto independiente de MED Conectado (repo/carpeta hermana en `Desktop\med-conectado`): base de datos propia, sin compartir backend por ahora. MED Conectado sigue siendo el proyecto principal; MEDi es el secundario.
- Monetización: gratis para profesionales al inicio para sumar volumen. El control de quién paga y quién tiene prueba gratuita lo lleva el dueño del proyecto por fuera de la app (no hay código ni flag en la app para esto, y así se decidió a propósito).
- Sin reserva de turnos online, nunca: el contacto es siempre por WhatsApp/llamada directo al profesional o centro de salud. Esto no es un pendiente de fase 2, quedó descartado como funcionalidad de la app.
- Sin autoregistro de profesionales desde la app: la carga de profesionales, consultorios y especialidades la hace el superadmin desde el panel de administración (`MEDi-backend/admin/`), para mantener control de calidad sobre la cartilla.
- Flujo de pantallas: pantalla de inicio (con dos caminos: "Buscar un profesional" o "Ver mapa de profesionales cerca tuyo") → buscador de especialidad → resultados ordenados por cercanía (con filtro de obra social y filtro de "solo a domicilio") → ficha del profesional (consultorio, horarios, botón de contacto por WhatsApp). El mapa es una vista alternativa que muestra TODOS los profesionales activos cerca, sin pasar primero por el buscador de especialidad.
- Publicación: Google Play (USD 25 único) y App Store (USD 99/año, todavía no contratado).

Estructura del repo:
- Raíz (`C:\Proyectos\MEDi`): frontend Expo/React Native (expo-router con `Stack` navigator, TypeScript).
- `MEDi-backend/`: backend Node/Express/PostgreSQL, mismo stack que MED Conectado pero base de datos y despliegue propios. Ver `MEDi-backend/README.md` para el modelo de datos completo (profesionales, especialidades, consultorios con lat/lng, horarios_atencion, obras_sociales, y las tablas N:N que las relacionan).
- `MEDi-backend/admin/index.html`: panel de administración de una sola página (HTML+JS sin build), protegido por login, donde el superadmin carga profesionales, consultorios, horarios, especialidades asignadas a cada profesional y — desde esta sesión — puede dar de alta especialidades nuevas al catálogo sin tocar código ni la base a mano.

Pantallas del frontend (`src/app/`):
- `index.tsx`: bienvenida, con los dos botones de entrada (buscador por especialidad / mapa).
- `buscador.tsx`: grilla de especialidades con ícono por especialidad (MaterialCommunityIcons de `@expo/vector-icons`, reemplazaron los emojis originales por pedido explícito — se consideraban "muy amateur").
- `mapa.tsx`: mapa (`react-native-maps`, `PROVIDER_GOOGLE` en Android) con un pin por profesional activo cerca de la ubicación del usuario, sin filtrar por especialidad; tocar un pin lleva a `/perfil`. La API key de Google Maps ya está cargada en `app.json` (`android.config.googleMaps.apiKey`), restringida por paquete `com.medi.app` + SHA-1 del keystore de EAS. Probado en una build real (perfil "preview") y confirmado funcionando. NO funciona en Expo Go, necesita build con dev client / EAS. El `Callout` usa `tooltip` (con estilos propios de burbuja) porque sin eso el toque no se registra en Android — bug conocido de `react-native-maps`.
- `resultados.tsx`: lista de profesionales de la especialidad elegida, ordenados por cercanía. Tiene tres filtros: "solo a domicilio" (client-side, sobre los resultados ya traídos), un selector de obra social (chips horizontales, trae el catálogo de `GET /obras-sociales` y re-consulta al backend con `&obra_social_id=` al elegir una) y un selector de distancia (10/25/50 km, controla el `&radio_km=` de la búsqueda — antes estaba fijo en 50).
- `perfil.tsx`: ficha de detalle de un profesional (consultorio, horarios, botón de contacto por WhatsApp).

Endpoints públicos relevantes (`MEDi-backend/src/routes/publico.js`):
- `GET /publico/buscar`: búsqueda por especialidad + GPS (fórmula de haversine), con filtro opcional por `obra_social_id`.
- `GET /publico/mapa`: TODOS los profesionales activos cerca de una ubicación, sin filtrar por especialidad (para `mapa.tsx`). Devuelve el consultorio más cercano de cada profesional y sus especialidades.
- `GET /obras-sociales`: catálogo público de obras sociales.
- `POST /admin/especialidades` (protegido): alta de una especialidad nueva en el catálogo, usado por el panel de administración.

Estado de despliegue:
- Backend en producción en Railway (servicio "MEDi-backend"), conectado a un Postgres propio del mismo proyecto Railway por red privada. El frontend apunta a esa URL pública (constante `API_BASE` en cada pantalla), así que la app funciona desde cualquier red sin depender de la PC.
- Repo completo (frontend + `MEDi-backend/`) en GitHub, `eduescolano-bot/medi`, privado, rama `main`.
- ⚠️ El servicio de Railway NO está conectado a auto-deploy por GitHub — hay que desplegar a mano con `railway up` desde `MEDi-backend/` (elegir el servicio "MEDi-backend", no "Postgres", en el prompt interactivo) después de cada `git push` que afecte al backend. Pendiente: conectar el repo en Railway → Settings → Source → "Connect Repo" para que esto sea automático.

Diseño visual:
- Marca: logo MEDi + tagline "La salud más cerca tuyo". Paleta: navy `#0B3A5C` (títulos/texto principal), teal `#0B8275`→`#3DD9C4` (acento/gradiente de botones y pines), gris `#64748B` (texto secundario), fondo `#F7FAFB`.
- Íconos de especialidad: `MaterialCommunityIcons` (mapeo curado por especialidad en `buscador.tsx`), no emojis. Verificado que los 20 nombres de ícono existen en el catálogo real y que no hay ninguno repetido entre especialidades.
- Tipografías de marca ya aplicadas al código real: Poppins (`Poppins-SemiBold`/`Poppins-Bold`) para títulos y nombres, Work Sans (`WorkSans-Regular`/`Medium`/`SemiBold`) para el resto, cargadas con `useFonts` en `_layout.tsx` (paquetes `@expo-google-fonts/poppins` y `@expo-google-fonts/work-sans`). El `Stack` no se monta hasta que las fuentes terminan de cargar, para evitar el parpadeo de fuente del sistema.
- Hay mockups estáticos de las 5 pantallas principales (Inicio, Buscador, Mapa, Resultados, Perfil) hechos con Claude Design, usados como referencia visual.

Camino a la Play Store:
- Íconos reales de MEDi ya en `assets/images/` (icon.png, adaptive icon de Android con foreground/background/monochrome, favicon, splash), reemplazando los genéricos de Expo.
- `app.json` tiene `android.package` / `ios.bundleIdentifier` = `com.medi.app` (placeholder, fácil de cambiar antes de la primera subida a Google Play / App Store).
- Cuenta de Expo/EAS: `eduescolano26`. Se generaron y probaron con éxito dos builds de Android de perfil "preview" (APK, instalado directo en el celular): la primera con el flujo de búsqueda por especialidad, la segunda ya con la API key de Google Maps cargada — el mapa también quedó confirmado funcionando end-to-end.
- Para generar builds de iOS todavía falta inscribirse en el Apple Developer Program (USD 99/año).
- Política de privacidad ya redactada y publicada (URL pública lista para pegar en Play Console / App Store Connect); contacto público: appmedisgo@gmail.com.
- `eas.json` ya está preparado para el día de la publicación: perfil `production` con `autoIncrement: true` (usa `appVersionSource: "remote"`, así que EAS maneja el versionCode solo, sin tocar `app.json`) y genera AAB por default. `submit.production.android` ya apunta a `./google-play-service-account.json` (ese archivo todavía no existe — se genera recién cuando haya cuenta de Play Console, ver más abajo — y ya está en `.gitignore` para no commitearlo por error) con `track: "internal"`.
- Cuenta de Play Console (USD 25 pago único, sin renovación) todavía no creada/confirmada. Una vez creada: las cuentas de desarrollador personales nuevas tienen que pasar 14 días seguidos de prueba cerrada (pista **Closed testing** en Play Console, no la de Internal testing) con al menos 12 testers anotados de forma continua, antes de poder pedir acceso a producción. Conviene arrancar esa prueba lo antes posible porque suma tiempo al cronograma.
- Falta: build de perfil `production` (hoy solo se probó `preview`, que genera APK en vez de AAB), y la ficha de la tienda (capturas, descripción, clasificación de contenido).
- Pendiente cosmético (no urgente): hay archivos boilerplate del template de Expo sin usar (pantallas de ejemplo, componentes themed-*, ícono de React) que se pueden borrar para reducir el tamaño del bundle — ya identificados, sólo falta ejecutarlo.

Flujo de trabajo con git:
- El usuario hace él mismo los `git add` / `commit` / `push` desde su notebook — no hace falta darle los comandos de git a menos que los pida.
