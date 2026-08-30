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
