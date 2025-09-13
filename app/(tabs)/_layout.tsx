import { THEME } from '@/lib/theme';
import { Tabs } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { MicIcon, SparklesIcon, UserIcon } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const backgroundColor = isDark ? THEME.dark.background : THEME.light.background;
  const { session } = useAuth();
  const signedIn = !!session;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#fff' : '#111827',
        tabBarInactiveTintColor: isDark ? '#9CA3AF' : '#6B7280',
        tabBarStyle: {
          backgroundColor,
        },
      }}>
      <Tabs.Screen
        name="voice"
        options={{
          title: 'Voice Agent',
          tabBarIcon: ({ color, size }) => <MicIcon color={color} size={size} />,
          href: signedIn ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="match"
        options={{
          title: 'Match',
          tabBarIcon: ({ color, size }) => <SparklesIcon color={color} size={size} />,
          href: signedIn ? undefined : null,
        }}
      />
      <Tabs.Screen
        name="user"
        options={{
          title: 'Account',
          tabBarIcon: ({ color, size }) => <UserIcon color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}
