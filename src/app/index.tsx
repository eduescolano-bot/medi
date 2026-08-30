import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Backend desplegado en Railway — funciona desde cualquier red, no hace
// falta estar en la misma WiFi que la PC ni tenerla prendida.
const API_BASE = 'https://medi-backend-production-ab1c.up.railway.app';

type Especialidad = { id: number; nombre: string };

type Resultado = {
  id: number;
  nombre: string;
  apellido: string;
  whatsapp: string | null;
  telefono: string | null;
  consultorio_nombre: string;
  ciudad: string;
  distancia_km: number;
};

export default function HomeScreen() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [especialidadId, setEspecialidadId] = useState<number | null>(null);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/especialidades`)
      .then((r) => r.json())
      .then(setEspecialidades)
      .catch(() => setError('No se pudo conectar con el servidor. Revisá que el backend esté corriendo y la IP en API_BASE.'));
  }, []);

  const pedirUbicacion = useCallback(async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setError('Necesitamos tu ubicación para buscar profesionales cercanos');
      return null;
    }
    const pos = await Location.getCurrentPositionAsync({});
    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
    setUbicacion(loc);
    return loc;
  }, []);

  const buscar = useCallback(
    async (id: number) => {
      setEspecialidadId(id);
      setError(null);
      setCargando(true);
      setResultados(null);
      try {
        const loc = ubicacion ?? (await pedirUbicacion());
        if (!loc) {
          setCargando(false);
          return;
        }
        const url = `${API_BASE}/publico/buscar?especialidad_id=${id}&lat=${loc.lat}&lng=${loc.lng}&radio_km=50`;
        const r = await fetch(url);
        const data = await r.json();
        setResultados(data);
      } catch {
        setError('Error al buscar. Revisá que el backend esté corriendo y accesible desde el celular.');
      } finally {
        setCargando(false);
      }
    },
    [ubicacion, pedirUbicacion]
  );

  const contactar = (whatsapp: string | null, telefono: string | null) => {
    const numero = whatsapp || telefono;
    if (!numero) return;
    Linking.openURL(`https://wa.me/549${numero.replace(/\D/g, '')}`);
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.titulo}>MEDi</Text>
      <Text style={styles.subtitulo}>Buscá un profesional cerca tuyo</Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <FlatList
        horizontal
        data={especialidades}
        keyExtractor={(item) => String(item.id)}
        style={styles.chipsRow}
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <Pressable
            style={[styles.chip, especialidadId === item.id && styles.chipActivo]}
            onPress={() => buscar(item.id)}
          >
            <Text style={[styles.chipTexto, especialidadId === item.id && styles.chipTextoActivo]}>
              {item.nombre}
            </Text>
          </Pressable>
        )}
      />

      {cargando && <ActivityIndicator style={{ marginTop: 24 }} />}

      {resultados && resultados.length === 0 && !cargando && (
        <Text style={styles.vacio}>No encontramos profesionales cerca para esa especialidad todavía.</Text>
      )}

      <FlatList
        data={resultados ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.nombreProfesional}>
              {item.nombre} {item.apellido}
            </Text>
            <Text style={styles.detalle}>
              {item.consultorio_nombre} · {item.ciudad}
            </Text>
            <Text style={styles.distancia}>{item.distancia_km.toFixed(1)} km de vos</Text>
            <Pressable style={styles.botonContacto} onPress={() => contactar(item.whatsapp, item.telefono)}>
              <Text style={styles.botonContactoTexto}>Contactar por WhatsApp</Text>
            </Pressable>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  titulo: { fontSize: 32, fontWeight: '700', color: '#208AEF' },
  subtitulo: { fontSize: 15, color: '#666', marginBottom: 12 },
  error: { color: '#c0392b', marginBottom: 8 },
  chipsRow: { flexGrow: 0, marginBottom: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, backgroundColor: '#eef2f6', marginRight: 8 },
  chipActivo: { backgroundColor: '#208AEF' },
  chipTexto: { color: '#2d3a4a', fontSize: 13 },
  chipTextoActivo: { color: '#fff', fontWeight: '600' },
  vacio: { textAlign: 'center', color: '#888', marginTop: 24 },
  card: { padding: 16, borderRadius: 12, backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0' },
  nombreProfesional: { fontSize: 17, fontWeight: '700', color: '#2d3a4a' },
  detalle: { fontSize: 13, color: '#666', marginTop: 2 },
  distancia: { fontSize: 13, color: '#208AEF', fontWeight: '600', marginTop: 4 },
  botonContacto: { marginTop: 10, backgroundColor: '#1D9E75', paddingVertical: 10, borderRadius: 8, alignItems: 'center' },
  botonContactoTexto: { color: '#fff', fontWeight: '600' },
});
