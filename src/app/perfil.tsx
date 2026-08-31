import { useEffect, useState } from 'react';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Backend desplegado en Railway — funciona desde cualquier red, no hace
// falta estar en la misma WiFi que la PC ni tenerla prendida.
const API_BASE = 'https://medi-backend-production-ab1c.up.railway.app';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

type Horario = { dia_semana: number; hora_inicio: string; hora_fin: string };
type Consultorio = {
  id: number;
  nombre: string | null;
  direccion: string | null;
  ciudad: string | null;
  provincia: string | null;
  telefono: string | null;
  lat: number | null;
  lng: number | null;
  horarios: Horario[] | null;
};
type Perfil = {
  id: number;
  nombre: string;
  apellido: string;
  matricula: string | null;
  bio: string | null;
  whatsapp: string | null;
  telefono: string | null;
  foto_url: string | null;
  atiende_domicilio: boolean;
  especialidades: { id: number; nombre: string }[] | null;
  obras_sociales: { id: number; nombre: string }[] | null;
  consultorios: Consultorio[] | null;
};

const comoLlegar = (lat: number | null, lng: number | null) => {
  if (lat == null || lng == null) return;
  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
};

export default function PerfilScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    setError(null);
    fetch(`${API_BASE}/publico/profesional/${params.id}`)
      .then((r) => {
        if (!r.ok) throw new Error('No se pudo cargar el perfil');
        return r.json();
      })
      .then((data) => {
        if (!cancelado) setPerfil(data);
      })
      .catch(() => {
        if (!cancelado) setError('No pudimos cargar este perfil. Intentá de nuevo.');
      })
      .finally(() => {
        if (!cancelado) setCargando(false);
      });
    return () => {
      cancelado = true;
    };
  }, [params.id]);

  const contactar = () => {
    if (!perfil) return;
    const numero = perfil.whatsapp || perfil.telefono;
    if (!numero) return;
    fetch(`${API_BASE}/publico/registrar-contacto`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profesional_id: perfil.id, medio: 'whatsapp' }),
    }).catch(() => {});
    Linking.openURL(`https://wa.me/549${numero.replace(/\D/g, '')}`);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.topBar}>
        <Pressable style={styles.iconBoton} onPress={() => router.back()}>
          <Text style={styles.iconTexto}>←</Text>
        </Pressable>
        <View style={styles.topBarTitulo}>
          <Text style={styles.topBarTexto} numberOfLines={1}>
            Perfil del profesional
          </Text>
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

      {cargando && <ActivityIndicator style={{ marginTop: 24 }} color="#0B8275" />}
      {error && <Text style={styles.error}>{error}</Text>}

      {perfil && (
        <ScrollView contentContainerStyle={styles.contenido}>
          <View style={styles.encabezado}>
            {perfil.foto_url ? (
              <Image source={{ uri: perfil.foto_url }} style={styles.avatarFoto} contentFit="cover" />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarTexto}>
                  {perfil.nombre[0]}
                  {perfil.apellido[0]}
                </Text>
              </View>
            )}
            <Text style={styles.nombre}>
              {perfil.nombre} {perfil.apellido}
            </Text>
            {!!perfil.matricula && <Text style={styles.matricula}>Matrícula {perfil.matricula}</Text>}

            <View style={styles.chipsFila}>
              {(perfil.especialidades ?? []).map((e) => (
                <View key={e.id} style={styles.chipEspecialidad}>
                  <Text style={styles.chipEspecialidadTexto}>{e.nombre}</Text>
                </View>
              ))}
            </View>

            {perfil.atiende_domicilio && (
              <View style={styles.badgeDomicilio}>
                <Text style={styles.badgeDomicilioTexto}>🏠 Atiende a domicilio</Text>
              </View>
            )}
          </View>

          {!!perfil.bio && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Sobre el profesional</Text>
              <Text style={styles.bio}>{perfil.bio}</Text>
            </View>
          )}

          {(perfil.obras_sociales ?? []).length > 0 && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Obras sociales</Text>
              <View style={styles.chipsFila}>
                {(perfil.obras_sociales ?? []).map((o) => (
                  <View key={o.id} style={styles.chipObraSocial}>
                    <Text style={styles.chipObraSocialTexto}>{o.nombre}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {(perfil.consultorios ?? []).length > 0 && (
            <View style={styles.seccion}>
              <Text style={styles.seccionTitulo}>Consultorios</Text>
              {(perfil.consultorios ?? []).map((c) => (
                <View key={c.id} style={styles.consultorioCard}>
                  {!!c.nombre && <Text style={styles.consultorioNombre}>{c.nombre}</Text>}
                  {!!c.direccion && (
                    <Text style={styles.consultorioDetalle}>
                      {c.direccion}{c.ciudad ? `, ${c.ciudad}` : ''}{c.provincia ? `, ${c.provincia}` : ''}
                    </Text>
                  )}
                  {!!c.telefono && <Text style={styles.consultorioDetalle}>Tel: {c.telefono}</Text>}
                  {(c.horarios ?? []).length > 0 && (
                    <View style={styles.horariosBox}>
                      {(c.horarios ?? [])
                        .slice()
                        .sort((a, b) => a.dia_semana - b.dia_semana || a.hora_inicio.localeCompare(b.hora_inicio))
                        .map((h, i) => (
                          <Text key={i} style={styles.horarioLinea}>
                            {DIAS[h.dia_semana]}: {h.hora_inicio.slice(0, 5)} a {h.hora_fin.slice(0, 5)}
                          </Text>
                        ))}
                    </View>
                  )}
                  {c.lat != null && c.lng != null && (
                    <Pressable style={styles.botonComoLlegar} onPress={() => comoLlegar(c.lat, c.lng)}>
                      <Text style={styles.botonComoLlegarTexto}>📍 Cómo llegar</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          )}

          <Pressable style={styles.botonContacto} onPress={contactar}>
            <Text style={styles.botonContactoTexto}>Contactar por WhatsApp</Text>
          </Pressable>
        </ScrollView>
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
  topBarTitulo: { flex: 1 },
  topBarTexto: { fontSize: 15, fontWeight: '700', color: '#0B3A5C' },
  botonInicio: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7FAFB',
    justifyContent: 'center',
  },
  botonInicioIcono: { width: 17, height: 21 },
  botonInicioTexto: { fontSize: 13, fontWeight: '700', color: '#0B3A5C' },
  error: { color: '#c0392b', marginHorizontal: 16, marginTop: 12 },
  contenido: { padding: 20, paddingBottom: 40 },
  encabezado: { alignItems: 'center', marginBottom: 8 },
  avatar: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#0B3A5C',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarTexto: { color: '#ffffff', fontWeight: '700', fontSize: 22 },
  avatarFoto: { width: 68, height: 68, borderRadius: 34, marginBottom: 12, backgroundColor: '#E4EBF0' },
  nombre: { fontSize: 19, fontWeight: '700', color: '#0B3A5C', textAlign: 'center' },
  matricula: { fontSize: 12.5, color: '#64748B', marginTop: 2 },
  chipsFila: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 6, marginTop: 12 },
  chipEspecialidad: {
    backgroundColor: '#EAF1F5',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipEspecialidadTexto: { fontSize: 12.5, fontWeight: '600', color: '#0B3A5C' },
  chipObraSocial: {
    backgroundColor: '#F1F1EC',
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 999,
  },
  chipObraSocialTexto: { fontSize: 12.5, fontWeight: '600', color: '#52514E' },
  badgeDomicilio: {
    backgroundColor: '#E3F3F0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    marginTop: 14,
  },
  badgeDomicilioTexto: { fontSize: 12.5, fontWeight: '700', color: '#0B8275' },
  seccion: { marginTop: 22 },
  seccionTitulo: { fontSize: 12.5, fontWeight: '700', color: '#64748B', textTransform: 'uppercase', letterSpacing: 0.3, marginBottom: 8 },
  bio: { fontSize: 14, color: '#0B3A5C', lineHeight: 20 },
  consultorioCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#E4EBF0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  consultorioNombre: { fontSize: 14.5, fontWeight: '700', color: '#0B3A5C', marginBottom: 3 },
  consultorioDetalle: { fontSize: 13, color: '#52514E', marginTop: 2 },
  horariosBox: { marginTop: 8, gap: 2 },
  horarioLinea: { fontSize: 12.5, color: '#64748B' },
  botonComoLlegar: {
    alignSelf: 'flex-start',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    backgroundColor: '#EAF1F5',
  },
  botonComoLlegarTexto: { fontSize: 12.5, fontWeight: '700', color: '#0B3A5C' },
  botonContacto: {
    backgroundColor: '#0B8275',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    marginTop: 26,
  },
  botonContactoTexto: { color: '#ffffff', fontWeight: '700', fontSize: 14.5 },
});
