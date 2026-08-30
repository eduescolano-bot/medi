import { useCallback, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import { Image } from 'expo-image';
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

type Resultado = {
  id: number;
  nombre: string;
  apellido: string;
  whatsapp: string | null;
  telefono: string | null;
  bio: string | null;
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
        setError('Error al buscar. Revisá tu conexión e intentá de nuevo.');
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

  const especialidadSeleccionada = useMemo(
    () => especialidades.find((e) => e.id === especialidadId) ?? null,
    [especialidades, especialidadId]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <Image
          source={require('@/assets/images/medi-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.subtitulo}>Buscá un profesional cerca tuyo</Text>
      </View>

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
            <Text style={styles.chipIcono}>{iconoDe(item.nombre)}</Text>
            <Text style={[styles.chipTexto, especialidadId === item.id && styles.chipTextoActivo]}>
              {item.nombre}
            </Text>
          </Pressable>
        )}
      />

      {cargando && <ActivityIndicator style={{ marginTop: 24 }} color="#0B8275" />}

      {resultados && (
        <View style={styles.resultadosHeader}>
          <Text style={styles.resultadosTitulo}>{especialidadSeleccionada?.nombre ?? 'Resultados'}</Text>
          <Text style={styles.resultadosSubtitulo}>Ordenados por cercanía</Text>
        </View>
      )}

      {resultados && resultados.length === 0 && !cargando && (
        <Text style={styles.vacio}>No encontramos profesionales cerca para esa especialidad todavía.</Text>
      )}

      <FlatList
        data={resultados ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ gap: 12, paddingVertical: 12 }}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardFila}>
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>
                  {item.nombre[0]}
                  {item.apellido[0]}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <View style={styles.cardEncabezado}>
                  <Text style={styles.nombreProfesional} numberOfLines={1}>
                    {item.nombre} {item.apellido}
                  </Text>
                  <Text style={styles.distancia}>{item.distancia_km.toFixed(1)} km</Text>
                </View>
                {!!item.bio && <Text style={styles.bio}>{item.bio}</Text>}
                <Text style={styles.detalle}>
                  {item.consultorio_nombre} · {item.ciudad}
                </Text>
              </View>
            </View>
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
  container: { flex: 1, paddingHorizontal: 16, paddingTop: 8, backgroundColor: '#F7FAFB' },
  header: { alignItems: 'center', marginBottom: 12, gap: 2 },
  logo: { width: 120, height: 79 },
  subtitulo: { fontSize: 14, color: '#64748B' },
  error: { color: '#c0392b', marginBottom: 8 },
  chipsRow: { flexGrow: 0, marginBottom: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E4EBF0',
    marginRight: 8,
  },
  chipActivo: { backgroundColor: '#0B3A5C', borderColor: '#0B3A5C' },
  chipIcono: { fontSize: 14 },
  chipTexto: { color: '#0B3A5C', fontSize: 13, fontWeight: '600' },
  chipTextoActivo: { color: '#fff' },
  resultadosHeader: { marginTop: 12 },
  resultadosTitulo: { fontSize: 18, fontWeight: '700', color: '#0B3A5C' },
  resultadosSubtitulo: { fontSize: 12, color: '#64748B', marginTop: 2 },
  vacio: { textAlign: 'center', color: '#64748B', marginTop: 24 },
  card: {
    padding: 16,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E4EBF0',
    gap: 12,
  },
  cardFila: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0B3A5C',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
  cardInfo: { flex: 1 },
  cardEncabezado: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', gap: 8 },
  nombreProfesional: { fontSize: 15, fontWeight: '700', color: '#0B3A5C', flexShrink: 1 },
  bio: { fontSize: 12, color: '#64748B', fontStyle: 'italic', marginTop: 2 },
  detalle: { fontSize: 12, color: '#64748B', marginTop: 4 },
  distancia: { fontSize: 12, color: '#0B8275', fontWeight: '700' },
  botonContacto: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#D7E2E8',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  botonContactoTexto: { color: '#0B3A5C', fontWeight: '600', fontSize: 14 },
});
