import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function BienvenidaScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.contenido}>
        <Image
          source={require('@/assets/images/medi-logo.png')}
          style={styles.logo}
          contentFit="contain"
        />
        <Text style={styles.titulo}>Encontrá al profesional que necesitás, cerca tuyo</Text>
        <Text style={styles.subtitulo}>
          Buscá especialistas de salud por especialidad y contactalos directo por WhatsApp.
        </Text>
      </View>

      <View style={styles.botones}>
        <Pressable style={styles.boton} onPress={() => router.push('/buscador')}>
          <Text style={styles.botonTexto}>Buscar un profesional</Text>
        </Pressable>
        <Pressable style={styles.botonSecundario} onPress={() => router.push('/mapa')}>
          <Text style={styles.botonSecundarioTexto}>🗺️ Ver mapa de profesionales cerca tuyo</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7FAFB',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingBottom: 24,
  },
  contenido: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 },
  logo: { width: 220, height: 145 },
  titulo: {
    fontFamily: 'Poppins-Bold',
    fontSize: 22,
    color: '#0B3A5C',
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitulo: {
    fontFamily: 'WorkSans-Regular',
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 280,
  },
  botones: { gap: 10 },
  boton: {
    backgroundColor: '#0B8275',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botonTexto: { color: '#ffffff', fontFamily: 'Poppins-SemiBold', fontSize: 15 },
  botonSecundario: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#D7E2E8',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  botonSecundarioTexto: { color: '#0B3A5C', fontFamily: 'WorkSans-SemiBold', fontSize: 14 },
});
