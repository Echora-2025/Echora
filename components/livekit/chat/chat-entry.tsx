import type { MessageFormatter, ReceivedChatMessage } from '@livekit/components-react';
import { View, type ViewProps } from 'react-native';
import { Text } from '@/components/ui/text';
import { cn } from '@/lib/utils';
import { useChatMessage } from './hooks/utils';

export interface ChatEntryProps extends ViewProps {
  entry: ReceivedChatMessage;
  hideName?: boolean;
  hideTimestamp?: boolean;
  messageFormatter?: MessageFormatter;
}

export const ChatEntry = ({
  entry,
  messageFormatter,
  hideName,
  hideTimestamp,
  className,
  ...props
}: ChatEntryProps) => {
  const { message, hasBeenEdited, time, locale, name } = useChatMessage(entry, messageFormatter);

  const isUser = entry.from?.isLocal ?? false;

  return (
    <View className={cn('flex flex-col gap-1', className)} {...props}>
      {(!hideTimestamp || !hideName || hasBeenEdited) && (
        <View className="flex flex-row items-center gap-2">
          {!hideName && name ? (
            <Text className="text-xs font-semibold text-foreground">{name}</Text>
          ) : null}

          {!hideTimestamp ? (
            <Text className="ml-auto text-[10px] text-muted-foreground">
              {hasBeenEdited ? '* ' : ''}
              {time.toLocaleTimeString(locale, {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>
          ) : null}
        </View>
      )}

      <View
        className={cn(
          'max-w-[90%] rounded-3xl px-3 py-2',
          isUser ? 'ml-auto bg-secondary' : 'mr-auto bg-muted'
        )}>
        <Text className="text-sm text-foreground">{message}</Text>
      </View>
    </View>
  );
};
