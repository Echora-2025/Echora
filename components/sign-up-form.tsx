import { SocialConnections } from '@/components/social-connections';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Text } from '@/components/ui/text';
import { supabase } from '@/lib/supabase';
import * as React from 'react';
import { Pressable, TextInput, View } from 'react-native';

export function SignUpForm({ onRequestSignIn }: { onRequestSignIn?: () => void }) {
  const passwordInputRef = React.useRef<TextInput>(null);
  const displayNameInputRef = React.useRef<TextInput>(null);
  const [email, setEmail] = React.useState('');
  const [displayName, setDisplayName] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  function onEmailSubmitEditing() {
    displayNameInputRef.current?.focus();
  }

  async function onSubmit() {
    if (!email || !password || !displayName || busy) {
      if (!displayName) setError('Display name is required');
      return;
    }
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: displayName.trim() } },
      });
      if (error) throw error;
      // If email confirmation is on, session may be null until confirmed
      if (!data.session) {
        setInfo('Sign up successful. Check your email to confirm.');
      }
    } catch (e: any) {
      setError(e?.message ?? 'Sign up failed');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="border-border/0 sm:border-border shadow-none sm:shadow-sm sm:shadow-black/5">
        <CardHeader>
          <CardTitle className="text-center text-xl sm:text-left">Create your account</CardTitle>
          <CardDescription className="text-center sm:text-left">
            Welcome! Please fill in the details to get started.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-6">
          <View className="gap-6">
            <View className="gap-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                placeholder="m@example.com"
                keyboardType="email-address"
                autoComplete="email"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onSubmitEditing={onEmailSubmitEditing}
                returnKeyType="next"
                submitBehavior="submit"
              />
            </View>
            <View className="gap-1.5">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                ref={displayNameInputRef}
                id="displayName"
                placeholder="e.g. Alex"
                autoComplete="name"
                value={displayName}
                onChangeText={setDisplayName}
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                returnKeyType="next"
                submitBehavior="submit"
              />
            </View>
            <View className="gap-1.5">
              <View className="flex-row items-center">
                <Label htmlFor="password">Password</Label>
              </View>
              <Input
                ref={passwordInputRef}
                id="password"
                secureTextEntry
                returnKeyType="send"
                value={password}
                onChangeText={setPassword}
                onSubmitEditing={onSubmit}
              />
            </View>
            {error ? (
              <View className="rounded-md bg-destructive/10 p-3">
                <Text className="text-destructive text-sm">{error}</Text>
              </View>
            ) : null}
            {info ? (
              <View className="rounded-md bg-secondary p-3">
                <Text className="text-sm">{info}</Text>
              </View>
            ) : null}
            <Button className="w-full" onPress={onSubmit} disabled={busy}>
              <Text>{busy ? 'Creating…' : 'Continue'}</Text>
            </Button>
          </View>
          <Text className="text-center text-sm">
            Already have an account?{' '}
            <Pressable onPress={() => onRequestSignIn?.()}>
              <Text className="text-sm underline underline-offset-4">Sign in</Text>
            </Pressable>
          </Text>
          <View className="flex-row items-center">
            <Separator className="flex-1" />
            <Text className="text-muted-foreground px-4 text-sm">or</Text>
            <Separator className="flex-1" />
          </View>
          <SocialConnections />
        </CardContent>
      </Card>
    </View>
  );
}
