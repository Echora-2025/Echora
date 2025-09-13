import { Redirect } from 'expo-router';
import { useAuth } from '@/providers/AuthProvider';
import { ActivityIndicator, View } from 'react-native';

export default function Index() {
  const { session, loading } = useAuth();
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }
  return <Redirect href={session ? '/(tabs)/voice' : '/(tabs)/user'} />;
}
