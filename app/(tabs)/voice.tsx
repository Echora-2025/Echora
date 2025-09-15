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
import EmbedFixedAgentClient from '@/components/agent/agent-client';
import { APP_CONFIG_DEFAULTS } from '@/app-config';

export default function VoiceAgentScreen() {
  const { session, loading: authLoading } = useAuth();
  const userName = React.useMemo(() => {
    const dn = (session?.user?.user_metadata as any)?.display_name as string | undefined;
    if (dn && dn.trim()) return dn.trim();
    const email = session?.user?.email;
    if (email) return email.split('@')[0];
    return 'You';
  }, [session]);

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

  return <EmbedFixedAgentClient appConfig={APP_CONFIG_DEFAULTS} />;
}
