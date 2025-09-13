import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';
import type { TriggerRef } from '@rn-primitives/popover';
import { LogOutIcon, PlusIcon, SettingsIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';

export function UserMenu() {
  const { session } = useAuth();
  const popoverTriggerRef = React.useRef<TriggerRef>(null);

  async function onSignOut() {
    popoverTriggerRef.current?.close();
    try {
      await supabase.auth.signOut();
    } catch {}
  }

  const fullName =
    ((session?.user?.user_metadata as any)?.display_name as string | undefined)?.trim() ||
    session?.user?.email ||
    'User';
  const initials = React.useMemo(() => {
    const base = fullName.trim();
    if (!base) return 'U';
    const parts = base.split(/\s+/);
    const letters = parts.length >= 2 ? parts[0][0] + parts[1][0] : base.slice(0, 2);
    return letters.toUpperCase();
  }, [fullName]);
  const username = session?.user?.email ?? '';

  return (
    <Popover>
      <PopoverTrigger asChild ref={popoverTriggerRef}>
        <Button variant="ghost" size="icon" className="size-8 rounded-full">
          <UserAvatar initials={initials} />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" side="bottom" className="w-80 p-0">
        <View className="border-border gap-3 border-b p-3">
          <View className="flex-row items-center gap-3">
            <UserAvatar className="size-10" initials={initials} />
            <View className="flex-1">
              <Text className="font-medium leading-5">{fullName}</Text>
              {fullName?.length ? (
                <Text className="text-muted-foreground text-sm font-normal leading-4">
                  {username}
                </Text>
              ) : null}
            </View>
          </View>
          <View className="flex-row flex-wrap gap-3 py-0.5">
            <Button
              variant="outline"
              size="sm"
              onPress={() => {
                // TODO: Navigate to account settings screen
              }}>
              <Icon as={SettingsIcon} className="size-4" />
              <Text>Manage Account</Text>
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onPress={onSignOut}>
              <Icon as={LogOutIcon} className="size-4" />
              <Text>Sign Out</Text>
            </Button>
          </View>
        </View>
        <Button
          variant="ghost"
          size="lg"
          className="h-16 justify-start gap-3 rounded-none rounded-b-md px-3 sm:h-14"
          onPress={() => {
            // TODO: Navigate to add account screen
          }}>
          <View className="size-10 items-center justify-center">
            <View className="border-border bg-muted/50 size-7 items-center justify-center rounded-full border border-dashed">
              <Icon as={PlusIcon} className="size-5" />
            </View>
          </View>
          <Text>Add account</Text>
        </Button>
      </PopoverContent>
    </Popover>
  );
}

function UserAvatar({ className, initials, ...props }: Omit<React.ComponentProps<typeof Avatar>, 'alt'> & { initials: string }) {
  return (
    <Avatar alt={`User avatar`} className={cn('size-8', className)} {...props}>
      {/* Image source left empty until profile images are implemented */}
      <AvatarImage source={undefined as any} />
      <AvatarFallback>
        <Text>{initials}</Text>
      </AvatarFallback>
    </Avatar>
  );
}
