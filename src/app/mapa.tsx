import { useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Callout, Marker, PROVIDER_GOOGLE } from 'react-native-maps';

// Backend desplegado en Railway — funciona desde cualquier red, no hace
// falta estar en la misma WiFi que la PC ni tenerla prendida.
const API_BASE = 'https://medi-backend-production-ab1c.up.railway.app';

type ProfesionalMapa = {
  id: number;
  nombre: string;
  apellido: string;
  atiende_domicilio: boolean;
  consultorio_nombre: string | null;
  ciudad: string | null;
  lat: number;
  lng: number;
  especialidades: string[] | null;
  distancia_km: number;
};

export default function MapaScreen() {
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [profesionales, setProfesionales] = useState<ProfesionalMapa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        if (!cancelado) {
          setError('Necesitamos tu ubicación para mostrarte los profesionales cercanos en el mapa');
          setCargando(false);
        }
        return;
      }
      try {
        const pos = await Location.getCurrentPositionAsync({});
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        if (cancelado) return;
        setUbicacion(loc);
        const r = await fetch(`${API_BASE}/publico/mapa?lat=${loc.lat}&lng=${loc.lng}&radio_km=50`);
        const data = await r.json();
        // El backend puede devolver un objeto de error (ej. si esta ruta
        // todavía no está desplegada) en vez de una lista — nunca asumimos
        // que la respuesta es un array.
        if (!cancelado) {
          if (Array.isArray(data)) {
            setProfesionales(data);
          } else {
            setError('No pudimos cargar los profesionales cercanos. Probá de nuevo en un rato.');
          }
        }
      } catch {
        if (!cancelado) setError('No pudimos obtener tu ubicación. Activá el GPS e intentá de nuevo.');
      } finally {
        if (!cancelado) setCargando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBoton} onPress={() => router.back()}>
          <Text style={styles.iconTexto}>←</Text>
        </Pressable>
        <Text style={styles.topBarTitulo}>Profesionales cerca tuyo</Text>
      </View>

      {cargando && <ActivityIndicator style={{ marginTop: 24 }} color="#0B8275" />}
      {error && <Text style={styles.error}>{error}</Text>}

      {ubicacion && !cargando && (
        <MapView
          style={styles.mapa}
          provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
          initialRegion={{
            latitude: ubicacion.lat,
            longitude: ubicacion.lng,
            latitudeDelta: 0.1,
            longitudeDelta: 0.1,
          }}
          showsUserLocation
        >
          {profesionales.map((p) => (
            <Marker key={p.id} coordinate={{ latitude: p.lat, longitude: p.lng }} pinColor="#0B8275">
              <Callout onPress={() => router.push({ pathname: '/perfil', params: { id: String(p.id) } })}>
                <View style={styles.callout}>
                  <Text style={styles.calloutNombre}>
                    {p.nombre} {p.apellido}
                  </Text>
                  {!!p.especialidades?.length && (
                    <Text style={styles.calloutDetalle}>{p.especialidades.join(', ')}</Text>
                  )}
                  <Text style={styles.calloutDetalle}>
                    {p.distancia_km.toFixed(1)} km{p.ciudad ? ` · ${p.ciudad}` : ''}
                  </Text>
                  {p.atiende_domicilio && <Text style={styles.calloutDetalle}>🏠 Atiende a domicilio</Text>}
                  <Text style={styles.calloutLink}>Ver perfil completo →</Text>
                </View>
              </Callout>
            </Marker>
          ))}
        </MapView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFB' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#E4EBF0',
  },
  iconBoton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F7FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTexto: { fontSize: 18, color: '#0B3A5C' },
  topBarTitulo: { fontSize: 17, fontWeight: '700', color: '#0B3A5C' },
  error: { color: '#c0392b', marginHorizontal: 16, marginTop: 12 },
  mapa: { flex: 1 },
  callout: { minWidth: 180, padding: 4 },
  calloutNombre: { fontSize: 14, fontWeight: '700', color: '#0B3A5C' },
  calloutDetalle: { fontSize: 12, color: '#64748B', marginTop: 2 },
  calloutLink: { fontSize: 12, color: '#0B8275', fontWeight: '700', marginTop: 4 },
});
