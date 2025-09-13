import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import { SignInForm } from '@/components/sign-in-form';
import { SignUpForm } from '@/components/sign-up-form';
import * as React from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function UserScreen() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator />
      </View>
    );
  }

  return <View className="flex-1 p-4">{session ? <AccountView /> : <AuthView />}</View>;
}

function AccountView() {
  const { session } = useAuth();
  const [busy, setBusy] = React.useState(false);
  const email = session?.user?.email ?? '';
  const displayName =
    ((session?.user?.user_metadata as any)?.display_name as string | undefined)?.trim() || '';

  const signOut = async () => {
    setBusy(true);
    try {
      await supabase.auth.signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <View className="gap-6">
      <Text variant="h2">Your Account</Text>
      <View className="gap-2 rounded-2xl border border-border p-4">
        {displayName ? (
          <>
            <Text className="text-muted-foreground">Display Name</Text>
            <Text className="text-lg font-medium">{displayName}</Text>
          </>
        ) : null}
        <Text className="text-muted-foreground mt-3">Email</Text>
        <Text className="text-lg font-medium">{email}</Text>
      </View>

      <Button onPressIn={signOut} disabled={busy}>
        <Text>{busy ? 'Signing out…' : 'Sign Out'}</Text>
      </Button>
    </View>
  );
}

function AuthView() {
  const [mode, setMode] = React.useState<'signin' | 'signup'>('signin');

  return (
    <View className="gap-6">
      {mode === 'signin' ? (
        <SignInForm onRequestSignUp={() => setMode('signup')} />
      ) : (
        <SignUpForm onRequestSignIn={() => setMode('signin')} />)
      }
    </View>
  );
}
