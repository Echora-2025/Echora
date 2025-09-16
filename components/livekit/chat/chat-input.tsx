import { useEffect, useRef, useState } from 'react';
import { TextInput, View, type ViewProps } from 'react-native';
import { Icon } from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { SendHorizontal } from 'lucide-react-native';

interface ChatInputProps extends ViewProps {
  onSend?: (message: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, className, disabled, ...props }: ChatInputProps) {
  const inputRef = useRef<TextInput>(null);
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim().length === 0) {
      return;
    }
    onSend?.(message.trim());
    setMessage('');
  };

  const isDisabled = disabled || message.trim().length === 0;

  useEffect(() => {
    if (!disabled) {
      inputRef.current?.focus();
    }
  }, [disabled]);

  return (
    <View className={cn('flex-row items-center gap-2 rounded-md pl-1', className)} {...props}>
      <TextInput
        ref={inputRef}
        value={message}
        editable={!disabled}
        placeholder="Type a message..."
        onSubmitEditing={handleSend}
        onChangeText={setMessage}
        returnKeyType="send"
        className="text-foreground flex-1 text-sm"
      />
      <Button
        size="icon"
        onPress={handleSend}
        variant={isDisabled ? 'secondary' : 'default'}
        disabled={isDisabled}>
        <Icon as={SendHorizontal} className="text-primary-foreground" size={16} />
      </Button>
    </View>
  );
}
