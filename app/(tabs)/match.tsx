import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { matchUsers } from '@/lib/ai';
import { USERS } from '@/lib/users';
import * as React from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

export default function MatchScreen() {
  const [aIndex, setAIndex] = React.useState(0);
  const [bIndex, setBIndex] = React.useState(1);
  const [result, setResult] = React.useState<{ score: number; reason: string } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const compute = async () => {
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
        <View className="flex-row gap-3">
          <SelectCard idx={aIndex} onPress={() => setAIndex((a) => (a + 1) % USERS.length)} />
          <SelectCard idx={bIndex} onPress={() => setBIndex((b) => (b + 1) % USERS.length)} />
        </View>

        <Button onPressIn={compute}>
          <Text>Calculate Match</Text>
        </Button>

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
