import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, type ViewProps, useColorScheme } from 'react-native';
import { Track } from 'livekit-client';
import { type AgentState, BarVisualizer, useVoiceAssistant } from '@livekit/components-react';
import { AvatarTile } from '@/components/livekit/avatar-tile';
import { ChatEntry } from '@/components/livekit/chat/chat-entry';
import { ChatInput } from '@/components/livekit/chat/chat-input';
import { DeviceSelect } from '@/components/livekit/device-select';
import { TrackToggle } from '@/components/livekit/track-toggle';
import { useAgentControlBar } from '@/hooks/useAgentControlBar';
import useChatAndTranscription from '@/hooks/useChatAndTranscription';
import { useDebugMode } from '@/hooks/useDebug';
import type { EmbedErrorDetails } from '@/lib/types';
import { cn } from '@/lib/utils';

function isAgentAvailable(agentState: AgentState) {
  return agentState === 'listening' || agentState === 'thinking' || agentState === 'speaking';
}

const DOT_SEQUENCE_INTERVALS: Partial<Record<AgentState, number>> = {
  connecting: 2000,
  initializing: 2000,
  listening: 1200,
  thinking: 600,
};

const DEFAULT_DOT_INTERVAL = 600;

const createDotSequenceForState = (state: AgentState | undefined, dotCount: number): number[][] => {
  if (state === 'connecting' || state === 'initializing') {
    return generateConnectingDotSequence(dotCount);
  }

  if (state === 'listening' || state === 'thinking') {
    return generateListeningDotSequence(dotCount);
  }

  if (state === 'speaking') {
    return [Array.from({ length: dotCount }, (_, index) => index)];
  }

  return [[]];
};

const generateConnectingDotSequence = (dotCount: number): number[][] => {
  const sequence: number[][] = [[]];

  for (let index = 0; index < dotCount; index += 1) {
    const mirrored = dotCount - 1 - index;
    if (mirrored === index) {
      sequence.push([index]);
    } else {
      sequence.push([index, mirrored]);
    }
  }

  return sequence;
};

const generateListeningDotSequence = (dotCount: number): number[][] => {
  if (dotCount % 2 === 0) {
    const rightCenter = dotCount / 2;
    const leftCenter = rightCenter - 1;
    return [[leftCenter, rightCenter], []];
  }

  const center = Math.floor(dotCount / 2);
  return [[center], []];
};

const getDotInterval = (state: AgentState | undefined, dotCount: number) => {
  const baseInterval = state
    ? (DOT_SEQUENCE_INTERVALS[state] ?? DEFAULT_DOT_INTERVAL)
    : DEFAULT_DOT_INTERVAL;

  if (state === 'connecting' || state === 'initializing') {
    return Math.max(150, Math.floor(baseInterval / Math.max(dotCount, 1)));
  }

  return baseInterval;
};

const useDotSequence = (state: AgentState | undefined, dotCount: number) => {
  const [sequence, setSequence] = useState<number[][]>([[]]);
  const [position, setPosition] = useState(0);

  useEffect(() => {
    setSequence(createDotSequenceForState(state, dotCount));
    setPosition(0);
  }, [state, dotCount]);

  useEffect(() => {
    if (sequence.length <= 1) {
      return;
    }

    const interval = getDotInterval(state, dotCount);
    const timer = setInterval(() => {
      setPosition((prev) => (prev + 1) % sequence.length);
    }, interval);

    return () => clearInterval(timer);
  }, [sequence, state, dotCount]);

  return sequence[position % sequence.length] ?? [];
};

const DotVisualizer = ({ state, dotCount = 5 }: { state?: AgentState; dotCount?: number }) => {
  const colorScheme = useColorScheme();
  const activeColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.95)' : 'rgba(32, 32, 32, 0.92)';
  const inactiveColor = colorScheme === 'dark' ? 'rgba(255,255,255,0.35)' : 'rgba(0, 0, 0, 0.18)';

  const highlights = useDotSequence(state, dotCount);
  const activeIndices = useMemo(() => highlights.filter((idx) => idx >= 0), [highlights]);

  return (
    <View className="flex-row items-center justify-center px-3 py-3">
      {Array.from({ length: dotCount }).map((_, index) => {
        const isActive = activeIndices.includes(index);
        return (
          <View
            key={index}
            className="mx-1 size-3 rounded-full"
            style={{
              backgroundColor: isActive ? activeColor : inactiveColor,
              opacity: isActive ? 1 : 0.35,
              transform: [{ scale: isActive ? 1 : 0.85 }],
            }}
          />
        );
      })}
    </View>
  );
};

type SessionViewProps = {
  disabled: boolean;
  sessionStarted: boolean;
  onDisplayError: (err: EmbedErrorDetails) => void;
};

export type PopupViewProps = ViewProps & SessionViewProps;

export const PopupView = ({
  disabled,
  sessionStarted,
  onDisplayError,
  className,
  ...props
}: PopupViewProps) => {
  const transcriptRef = useRef<ScrollView>(null);
  const { state: agentState, videoTrack: agentVideoTrack } = useVoiceAssistant();
  const agentHasAvatar = agentVideoTrack !== undefined;

  const { micTrackRef, visibleControls, microphoneToggle, handleAudioDeviceChange } =
    useAgentControlBar({
      controls: { microphone: true },
      saveUserChoices: true,
    });

  const { messages, send } = useChatAndTranscription();
  const onSend = (message: string) => send(message);

  useDebugMode();

  useEffect(() => {
    if (!sessionStarted) {
      return;
    }

    const timeout = setTimeout(() => {
      if (!isAgentAvailable(agentState)) {
        const reason =
          agentState === 'connecting'
            ? 'Agent did not join the room.'
            : 'Agent connected but did not finish initializing.';

        onDisplayError({
          title: 'Session ended',
          description: reason,
        });
      }
    }, 10_000);

    return () => clearTimeout(timeout);
  }, [agentState, sessionStarted, onDisplayError]);

  useEffect(() => {
    if (!transcriptRef.current) {
      return;
    }
    const scrollView = transcriptRef.current;
    scrollView.scrollToEnd({ animated: true });
  }, [messages]);

  const agentHasConnected = useMemo(() => {
    return (
      agentState !== 'disconnected' && agentState !== 'connecting' && agentState !== 'initializing'
    );
  }, [agentState]);

  const inputDisabled = disabled || !sessionStarted;

  return (
    <View
      pointerEvents={disabled ? 'none' : 'auto'}
      className={cn(
        'flex h-full w-full flex-col overflow-hidden rounded-[32px] border border-border/40 bg-muted/50 shadow-2xl shadow-black/15 dark:bg-background/95',
        className
      )}
      {...props}>
      <View className="relative flex-1 px-5 py-6">
        <View
          className={cn(
            'pointer-events-none absolute left-1/2 top-1/2 z-30 w-64 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-border/30 bg-background px-6 py-4 shadow-xl shadow-black/20',
            agentHasConnected && 'top-6 w-52 -translate-y-0 border-border/40 shadow-lg'
          )}>
          <DotVisualizer state={agentState} />
        </View>

        {agentHasAvatar ? (
          <View className="pointer-events-none absolute inset-x-4 bottom-32 top-4 z-10 overflow-hidden rounded-[28px] border border-border/40">
            <AvatarTile videoTrack={agentVideoTrack} className="h-full w-full object-cover" />
          </View>
        ) : null}

        <ScrollView
          ref={transcriptRef}
          contentContainerStyle={{
            flexGrow: 1,
            justifyContent: 'flex-end',
            paddingTop: 96,
            paddingBottom: 120,
          }}
          showsVerticalScrollIndicator={false}
          className="relative z-20 flex-1">
          <View className="flex flex-1 flex-col justify-end gap-3">
            {messages.map((message) => (
              <ChatEntry hideName key={message.id} entry={message} />
            ))}
          </View>
        </ScrollView>

        <View className="relative z-30 mt-4 flex flex-row">
          <View className="flex w-full flex-row items-center gap-2 rounded-full border border-border/40 bg-background px-2 py-1 shadow-xl shadow-black/15">
            {visibleControls.microphone ? (
              <View className="flex flex-row items-center gap-1 rounded-full border border-border/30 bg-background/95 px-1 py-1">
                <TrackToggle
                  source={Track.Source.Microphone}
                  pressed={microphoneToggle.enabled}
                  pending={microphoneToggle.pending}
                  disabled={microphoneToggle.pending}
                  onPressedChange={microphoneToggle.toggle}
                  className="pl-3 pr-3">
                  <BarVisualizer
                    barCount={3}
                    trackRef={micTrackRef}
                    options={{ minHeight: 4 }}
                    className="flex h-full w-auto items-center justify-center gap-1">
                    <View className="h-full w-0.5 rounded bg-foreground/80" />
                  </BarVisualizer>
                </TrackToggle>
                {/* FIXME: DeviceSelect is not showing well */}
                {/* <DeviceSelect
                  kind="audioinput"
                  onActiveDeviceChange={handleAudioDeviceChange}
                  className="px-2"
                /> */}
              </View>
            ) : null}

            <ChatInput
              className="flex-1 rounded-full bg-muted/40 px-3 py-1"
              onSend={onSend}
              disabled={inputDisabled}
            />
          </View>
        </View>
      </View>
    </View>
  );
};
