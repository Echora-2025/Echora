import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { voiceAgentRespond, voiceInteraction } from '@/lib/ai';
import { useAuth } from '@/providers/AuthProvider';
import * as React from 'react';
import { ActivityIndicator, Pressable, TextInput, View } from 'react-native';
import { useAudioRecorder } from '@/hooks/useAudioRecorder';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { MicIcon } from 'lucide-react-native';
import { Redirect } from 'expo-router';

export default function VoiceAgentScreen() {
  const { session, loading: authLoading } = useAuth();
  const userName = React.useMemo(() => {
    const dn = (session?.user?.user_metadata as any)?.display_name as string | undefined;
    if (dn && dn.trim()) return dn.trim();
    const email = session?.user?.email;
    if (email) return email.split('@')[0];
    return 'You';
  }, [session]);

  const [input, setInput] = React.useState('');
  const [messages, setMessages] = React.useState<{ role: 'user' | 'assistant'; text: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();
  const player = useAudioPlayer();

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

  const send = async () => {
    if (!input.trim() || loading) return;
    const userText = input.trim();
    setMessages((m) => [...m, { role: 'user', text: userText }]);
    setInput('');
    setLoading(true);
    try {
      const reply = await voiceAgentRespond(userName, userText);
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

  const startPTT = async () => {
    if (loading || isRecording) return;
    try {
      await startRecording();
    } catch (e) {
      // ignore
    }
  };

  const stopPTT = async () => {
    if (loading) return;
    const recorded = await stopRecording();
    if (!recorded) return;
    setLoading(true);
    try {
      const { transcript, replyText, replyAudio } = await voiceInteraction(userName, recorded);
      if (transcript && transcript.trim()) {
        setMessages((m) => [...m, { role: 'user', text: transcript.trim() }]);
      }
      setMessages((m) => [...m, { role: 'assistant', text: replyText }]);
      if (replyAudio) {
        await player.play({ bytes: replyAudio.bytes, mimeType: replyAudio.mimeType });
      }
    } catch (e) {
      setMessages((m) => [
        ...m,
        { role: 'assistant', text: 'Sorry, the voice agent is unavailable right now.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <View className="flex-1 gap-4 p-4">
        <View className="flex-row items-center justify-between">
          <Text className="text-lg">User: {userName}</Text>
        </View>

        <View className="flex-1 gap-3">
          {messages.length === 0 ? (
            <View className="flex-1 items-center justify-center">
              <Text className="text-3xl font-semibold text-center">
                what would you like to reflect on?
              </Text>
              <Text className="mt-2 text-center text-muted-foreground">
                Hold the mic to speak, or type below.
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

        <View className="items-center gap-2 pb-2">
          <Pressable
            onPressIn={startPTT}
            onPressOut={stopPTT}
            disabled={loading}
            className={
              'h-20 w-20 items-center justify-center rounded-full ' +
              (isRecording ? 'bg-red-500' : 'bg-primary')
            }>
            <MicIcon color="white" size={28} />
          </Pressable>
          <Text className="text-muted-foreground">
            {isRecording ? 'Listening… release to send' : player.isPlaying ? 'Assistant speaking…' : 'Hold to talk'}
          </Text>
        </View>

        <View className="flex-row items-center gap-2">
          <TextInput
            placeholder="Type (fallback)…"
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
