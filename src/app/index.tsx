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

      <Pressable style={styles.boton} onPress={() => router.push('/buscador')}>
        <Text style={styles.botonTexto}>Buscar un profesional</Text>
      </Pressable>
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
  titulo: { fontSize: 22, fontWeight: '700', color: '#0B3A5C', textAlign: 'center', lineHeight: 28 },
  subtitulo: { fontSize: 14, color: '#64748B', textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  boton: {
    backgroundColor: '#0B8275',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
  },
  botonTexto: { color: '#ffffff', fontWeight: '700', fontSize: 15 },
});
