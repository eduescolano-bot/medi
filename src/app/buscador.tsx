import { useCallback, useEffect, useState } from 'react';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { router } from 'expo-router';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Backend desplegado en Railway — funciona desde cualquier red, no hace
// falta estar en la misma WiFi que la PC ni tenerla prendida.
const API_BASE = 'https://medi-backend-production-ab1c.up.railway.app';

type IconoEspecialidad = keyof typeof MaterialCommunityIcons.glyphMap;

// Un ícono de línea (no emoji) por especialidad, para que el buscador se vea
// más sobrio y profesional en vez de amateur. Coincide en color con la
// paleta de marca (se pinta con el teal de acento al renderizarlo).
const ICONOS_ESPECIALIDAD: Record<string, IconoEspecialidad> = {
  'Clínica médica': 'stethoscope',
  Pediatría: 'baby-face-outline',
  Ginecología: 'human-female',
  Cardiología: 'heart-pulse',
  Dermatología: 'water-outline',
  Traumatología: 'bone',
  Oftalmología: 'eye-outline',
  Otorrinolaringología: 'ear-hearing',
  Psiquiatría: 'pill',
  Psicología: 'chat-outline',
  Nutrición: 'food-apple-outline',
  Kinesiología: 'run',
  Odontología: 'tooth-outline',
  Neurología: 'brain',
  Urología: 'water',
  Endocrinología: 'flask-outline',
  Gastroenterología: 'silverware-fork-knife',
  'Alergia e inmunología': 'shield-outline',
  Fonoaudiología: 'microphone-outline',
  Reumatología: 'hand-back-left-outline',
};

const iconoDe = (nombre: string): IconoEspecialidad => ICONOS_ESPECIALIDAD[nombre] ?? 'stethoscope';

type Especialidad = { id: number; nombre: string };

export default function BuscadorScreen() {
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
    try {
      const pos = await Location.getCurrentPositionAsync({});
      const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      setUbicacion(loc);
      return loc;
    } catch {
      setError('No pudimos obtener tu ubicación. Activá el GPS (o salí a un lugar con mejor señal) e intentá de nuevo.');
      return null;
    }
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
      } catch {
        setError('Algo salió mal buscando tu ubicación. Intentá de nuevo.');
      } finally {
        setCargandoUbicacion(false);
      }
    },
    [ubicacion, pedirUbicacion]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBoton} onPress={() => router.back()}>
          <Text style={styles.iconTexto}>←</Text>
        </Pressable>
        <Text style={styles.topBarTitulo}>¿Qué especialidad buscás?</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContenido} showsVerticalScrollIndicator={false}>
        {error && <Text style={styles.error}>{error}</Text>}

        <View style={styles.chipsGrid}>
          {especialidades.map((item) => (
            <Pressable
              key={item.id}
              style={styles.chip}
              disabled={cargandoUbicacion}
              onPress={() => seleccionarEspecialidad(item)}
            >
              <View style={styles.chipIconoBox}>
                <MaterialCommunityIcons name={iconoDe(item.nombre)} size={19} color="#0B8275" />
              </View>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  iconBoton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E4EBF0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTexto: { fontSize: 18, color: '#0B3A5C' },
  topBarTitulo: { fontFamily: 'Poppins-Bold', fontSize: 17, color: '#0B3A5C' },
  scrollContenido: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 32 },
  error: { fontFamily: 'WorkSans-Regular', color: '#c0392b', marginBottom: 8 },
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
  chipIconoBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#E3F3F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipTexto: { color: '#0B3A5C', fontSize: 13, fontFamily: 'WorkSans-SemiBold', flexShrink: 1 },
});
