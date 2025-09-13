import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { matchUsers } from '@/lib/ai';
import { USERS } from '@/lib/users';
import { useAuth } from '@/providers/AuthProvider';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { Redirect } from 'expo-router';

export default function MatchScreen() {
  const { session, loading: authLoading } = useAuth();
  const [aIndex, setAIndex] = React.useState(0);
  const [bIndex, setBIndex] = React.useState(1);
  const [result, setResult] = React.useState<{ score: number; reason: string } | null>(null);
  const [loading, setLoading] = React.useState(false);

  if (authLoading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(tabs)/user" />;
  }

  const compute = async () => {
    if (USERS.length < 2) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await matchUsers(USERS[aIndex], USERS[bIndex]);
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  const SelectCard = ({ idx, onPress }: { idx: number; onPress: () => void }) => {
    const u = USERS[idx];
    return (
      <Pressable onPress={onPress} className="flex-1 rounded-2xl border border-border p-4">
        <Text className="text-lg font-semibold">{u.name}</Text>
        <Text className="mt-1 text-muted-foreground">{u.bio}</Text>
        <Text className="mt-2">Values: {u.values.slice(0, 3).join(', ')}</Text>
      </Pressable>
    );
  };

  return (
    <>
      <View className="flex-1 gap-4 p-4">
        {USERS.length >= 2 ? (
          <>
            <View className="flex-row gap-3">
              <SelectCard idx={aIndex} onPress={() => setAIndex((a) => (a + 1) % USERS.length)} />
              <SelectCard idx={bIndex} onPress={() => setBIndex((b) => (b + 1) % USERS.length)} />
            </View>
            <Button onPressIn={compute}>
              <Text>Calculate Match</Text>
            </Button>
          </>
        ) : (
          <View className="rounded-2xl border border-border p-4">
            <Text className="text-lg font-medium">No sample users available</Text>
            <Text className="mt-2 text-muted-foreground">
              Add users or connect a real user directory to try matching.
            </Text>
          </View>
        )}

        {loading && (
          <View className="items-center py-2">
            <ActivityIndicator />
          </View>
        )}

        {result && (
          <View className="rounded-2xl border border-border p-4">
            <Text className="text-xl font-semibold">Score: {Math.round(result.score)} / 100</Text>
            <Text className="mt-2 text-muted-foreground">{result.reason}</Text>
          </View>
        )}
      </View>
    </>
  );
}
