import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { voiceAgentRespond } from '@/lib/ai';
import { USERS } from '@/lib/users';
import * as React from 'react';
import { ActivityIndicator, TextInput, View } from 'react-native';

export default function VoiceAgentScreen() {
  const [currentUserIndex, setCurrentUserIndex] = React.useState(0);
  const user = USERS[currentUserIndex];

  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [loading, setLoading] = React.useState(false);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      const reply = await voiceAgentRespond(user.name, userText);
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Sorry, the agent is unavailable right now.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View className="flex-1 gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg">User: {user.name}</Text>
          <Button
            variant="ghost"
            onPressIn={() => setCurrentUserIndex((i) => (i + 1) % USERS.length)}>
            <Text>Switch</Text>
          </Button>
        </View>

        <View className="flex-1 gap-3">
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-3xl font-semibold text-center">
                what would you like to reflect on?
              </Text>
              <Text className="mt-2 text-center text-muted-foreground">
                Type a message below to start.
              </Text>
            </View>
          ) : (
            <View className="flex-1 gap-3">
              {messages.map((m, idx) => (
                <View
                  key={idx}
                  className={
                    m.role === 'user'
                      ? 'self-end max-w-[85%] rounded-2xl bg-primary/10 p-3'
                      : 'self-start max-w-[85%] rounded-2xl bg-muted p-3'
                  }>
                  <Text>{m.text}</Text>
                </View>
              ))}
            </View>
          )}
          {loading && (
            <View className="items-center py-2">
              <ActivityIndicator />
            </View>
          )}
        </View>

        <View className="flex-row items-center gap-2">
          <TextInput
            placeholder="Type…"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={send}
            className="flex-1 rounded-xl border border-border px-4 py-3 ios:text-foreground"
          />
          <Button onPressIn={send}>
            <Text>Send</Text>
          </Button>
        </View>
      </View>
    </>
  );
}
