import '@/global.css';
import 'react-native-url-polyfill/auto';
import 'react-native-get-random-values';

import { NAV_THEME } from '@/lib/theme';
import { AuthProvider } from '@/providers/AuthProvider';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <AuthProvider>
        <Stack />
        <PortalHost />
      </AuthProvider>
    </ThemeProvider>
  );
}
