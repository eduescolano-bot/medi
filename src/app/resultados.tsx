import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
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

export default function ResultadosScreen() {
  const params = useLocalSearchParams<{
    especialidadId: string;
    especialidadNombre: string;
    lat: string;
    lng: string;
  }>();
  const [resultados, setResultados] = useState<Resultado[] | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    const url = `${API_BASE}/publico/buscar?especialidad_id=${params.especialidadId}&lat=${params.lat}&lng=${params.lng}&radio_km=50`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelado) setResultados(data);
      })
      .catch(() => {
        if (!cancelado) setError('Error al buscar. Revisá tu conexión e intentá de nuevo.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [params.especialidadId, params.lat, params.lng]);

  const contactar = (whatsapp: string | null, telefono: string | null) => {
    const numero = whatsapp || telefono;
    if (!numero) return;
    Linking.openURL(`https://wa.me/549${numero.replace(/\D/g, '')}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBoton} onPress={() => router.back()}>
          <Text style={styles.iconTexto}>←</Text>
        </Pressable>
        <View style={styles.topBarTitulo}>
          <Text style={styles.especialidadNombre} numberOfLines={1}>
            {params.especialidadNombre ?? 'Resultados'}
          </Text>
          <Text style={styles.resultadosSubtitulo}>Ordenados por cercanía</Text>
        </View>
        <Pressable style={styles.botonInicio} onPress={() => router.replace('/')}>
          <Image
            source={require('@/assets/images/medi-icon.png')}
            style={styles.botonInicioIcono}
            contentFit="contain"
          />
          <Text style={styles.botonInicioTexto}>Inicio</Text>
        </Pressable>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {cargando && <ActivityIndicator style={{ marginTop: 24 }} color="#0B8275" />}
      {resultados && resultados.length === 0 && !cargando && (
        <Text style={styles.vacio}>No encontramos profesionales cerca para esa especialidad todavía.</Text>
      )}

      <FlatList
        data={resultados ?? []}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listaContenido}
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
  botonInicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F7FAFB',
    justifyContent: 'center',
  },
  botonInicioIcono: { width: 14, height: 17 },
  botonInicioTexto: { fontSize: 12, fontWeight: '700', color: '#0B3A5C' },
  topBarTitulo: { flex: 1 },
  especialidadNombre: { fontSize: 17, fontWeight: '700', color: '#0B3A5C' },
  resultadosSubtitulo: { fontSize: 12, color: '#64748B', marginTop: 2 },
  error: { color: '#c0392b', marginHorizontal: 16, marginTop: 12 },
  vacio: { textAlign: 'center', color: '#64748B', marginTop: 24, marginHorizontal: 16 },
  listaContenido: { padding: 16, gap: 12 },
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
