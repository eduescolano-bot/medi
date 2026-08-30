import { useCallback, useEffect, useState } from 'react';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Backend desplegado en Railway — funciona desde cualquier red, no hace
// falta estar en la misma WiFi que la PC ni tenerla prendida.
const API_BASE = 'https://medi-backend-production-ab1c.up.railway.app';

// Un ícono acorde por especialidad, para que el buscador sea más fácil de
// escanear de un vistazo (coincide con el prototipo de diseño de MEDi).
const ICONOS_ESPECIALIDAD: Record<string, string> = {
  'Clínica médica': '🩺',
  Pediatría: '👶',
  Ginecología: '🌸',
  Cardiología: '❤️',
  Dermatología: '💧',
  Traumatología: '🦴',
  Oftalmología: '👁️',
  Otorrinolaringología: '👂',
  Psiquiatría: '💭',
  Psicología: '💬',
  Nutrición: '🍎',
  Kinesiología: '🤸',
  Odontología: '🦷',
  Neurología: '🧠',
  Urología: '🫘',
  Endocrinología: '🧪',
  Gastroenterología: '🍽️',
  'Alergia e inmunología': '🤧',
  Fonoaudiología: '🗣️',
  Reumatología: '🦿',
};

const iconoDe = (nombre: string) => ICONOS_ESPECIALIDAD[nombre] ?? '🩺';

type Especialidad = { id: number; nombre: string };

export default function HomeScreen() {
  const [especialidades, setEspecialidades] = useState<Especialidad[]>([]);
  const [ubicacion, setUbicacion] = useState<{ lat: number; lng: number } | null>(null);
  const [cargandoUbicacion, setCargandoUbicacion] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_BASE}/especialidades`)
      .then((r) => r.json())
      .then(setEspecialidades)
      .catch(() => setError('No se pudo conectar con el servidor. Revisá tu conexión e intentá de nuevo.'));
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

  const seleccionarEspecialidad = useCallback(
    async (especialidad: Especialidad) => {
      setError(null);
      setCargandoUbicacion(true);
      try {
        const loc = ubicacion ?? (await pedirUbicacion());
        if (!loc) return;
        router.push({
          pathname: '/resultados',
          params: {
            especialidadId: String(especialidad.id),
            especialidadNombre: especialidad.nombre,
            lat: String(loc.lat),
            lng: String(loc.lng),
          },
        });
      } finally {
        setCargandoUbicacion(false);
      }
    },
    [ubicacion, pedirUbicacion]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Image
            source={require('@/assets/images/medi-logo.png')}
            style={styles.logo}
            contentFit="contain"
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Text style={styles.chipsTitulo}>¿Qué especialidad buscás?</Text>
        <View style={styles.chipsGrid}>
          {especialidades.map((item) => (
            <Pressable
              key={item.id}
              style={styles.chip}
              disabled={cargandoUbicacion}
              onPress={() => seleccionarEspecialidad(item)}
            >
              <Text style={styles.chipIcono}>{iconoDe(item.nombre)}</Text>
              <Text style={styles.chipTexto} numberOfLines={2}>
                {item.nombre}
              </Text>
            </Pressable>
          ))}
        </View>

        {cargandoUbicacion && <ActivityIndicator style={{ marginTop: 20 }} color="#0B8275" />}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFB' },
  scrollContenido: { paddingHorizontal: 16, paddingTop: 24, paddingBottom: 32 },
  header: { alignItems: 'center', marginBottom: 20 },
  logo: { width: 200, height: 132 },
  error: { color: '#c0392b', marginBottom: 8 },
  chipsTitulo: { fontSize: 13, fontWeight: '600', color: '#0B3A5C', marginBottom: 8 },
  chipsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: 10,
  },
  chip: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E4EBF0',
  },
  chipIcono: { fontSize: 16 },
  chipTexto: { color: '#0B3A5C', fontSize: 13, fontWeight: '600', flexShrink: 1 },
});
