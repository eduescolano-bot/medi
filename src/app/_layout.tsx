import { Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import {
  WorkSans_400Regular,
  WorkSans_500Medium,
  WorkSans_600SemiBold,
  WorkSans_700Bold,
} from '@expo-google-fonts/work-sans';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';

SplashScreen.preventAutoHideAsync();

// Tipografías de marca: Poppins para títulos, Work Sans para el resto del
// texto. Se cargan acá, una sola vez, y las pantallas las referencian por
// estos nombres (ej. fontFamily: 'Poppins-Bold').
export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [fuentesListas, errorFuentes] = useFonts({
    'Poppins-SemiBold': Poppins_600SemiBold,
    'Poppins-Bold': Poppins_700Bold,
    'WorkSans-Regular': WorkSans_400Regular,
    'WorkSans-Medium': WorkSans_500Medium,
    'WorkSans-SemiBold': WorkSans_600SemiBold,
    'WorkSans-Bold': WorkSans_700Bold,
  });

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {(fuentesListas || errorFuentes) && (
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="buscador" />
          <Stack.Screen name="resultados" />
          <Stack.Screen name="perfil" />
          <Stack.Screen name="mapa" />
        </Stack>
      )}
    </ThemeProvider>
  );
}
