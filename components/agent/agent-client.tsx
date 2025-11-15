import { useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { Room, RoomEvent } from 'livekit-client';
import { RoomAudioRenderer, RoomContext, StartAudio } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { Text } from '@/components/ui/text';
import { PopupView } from '@/components/agent/popup-view';
import useConnectionDetails from '@/hooks/useConnectionDetails';
import { type AppConfig, EmbedErrorDetails } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/providers/AuthProvider';

export type EmbedFixedAgentClientProps = {
  appConfig: AppConfig;
};

function EmbedFixedAgentClient({ appConfig }: EmbedFixedAgentClientProps) {
  const room = useMemo(() => new Room(), []);
  const [currentError, setCurrentError] = useState<EmbedErrorDetails | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const { connectionDetails, refreshConnectionDetails } = useConnectionDetails();
  const { session } = useAuth();

  const handleDismissError = () => {
    room.disconnect();
    setCurrentError(null);
    setIsConnecting(false);
  };

  const setParticipantMetadata = async () => {
    const userId = session?.user?.id;
    if (!userId) {
      return;
    }

    try {
      await room.localParticipant.setMetadata(userId);
    } catch (error) {
      if (error instanceof Error) {
        console.error('Failed to set participant metadata:', error);
      }
    }
  };

  useEffect(() => {
    const onDisconnected = () => {
      setIsConnecting(false);
      refreshConnectionDetails();
    };
    const onConnected = () => {
      setIsConnecting(false);
    };
    const onMediaDevicesError = (error: Error) => {
      setCurrentError({
        title: 'Encountered an error with your media devices',
        description: `${error.name}: ${error.message}`,
      });
    };
    room.on(RoomEvent.MediaDevicesError, onMediaDevicesError);
    room.on(RoomEvent.Connected, onConnected);
    room.on(RoomEvent.Disconnected, onDisconnected);
    return () => {
      room.off(RoomEvent.Disconnected, onDisconnected);
      room.off(RoomEvent.Connected, onConnected);
      room.off(RoomEvent.MediaDevicesError, onMediaDevicesError);
    };
  }, [room, refreshConnectionDetails]);

  const isConnected = room.state !== 'disconnected';

  const connect = async () => {
    if (isConnected) return;
    setIsConnecting(true);
    if (!connectionDetails) {
      // Fetch connection details; connect when ready
      refreshConnectionDetails();
      return;
    }
    try {
      await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken);
      await room.localParticipant.setMicrophoneEnabled(true, undefined, {
        preConnectBuffer: appConfig.isPreConnectBufferEnabled,
      });
      await setParticipantMetadata();
      setIsConnecting(false);
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error('Error connecting to agent:', error);
        setCurrentError({
          title: 'There was an error connecting to the agent',
          description: `${error.name}: ${error.message}`,
        });
      }
      setIsConnecting(false);
    }
  };

  // If user tapped connect before details are ready, connect once they arrive
  useEffect(() => {
    if (isConnecting && !isConnected && connectionDetails) {
      (async () => {
        try {
          await room.connect(connectionDetails.serverUrl, connectionDetails.participantToken);
          await room.localParticipant.setMicrophoneEnabled(true, undefined, {
            preConnectBuffer: appConfig.isPreConnectBufferEnabled,
          });
          await setParticipantMetadata();
          setIsConnecting(false);
        } catch (error: unknown) {
          if (error instanceof Error) {
            console.error('Error connecting to agent:', error);
            setCurrentError({
              title: 'There was an error connecting to the agent',
              description: `${error.name}: ${error.message}`,
            });
          }
          setIsConnecting(false);
        }
      })();
    }
  }, [isConnecting, isConnected, connectionDetails, room, appConfig.isPreConnectBufferEnabled]);

  const disconnect = () => {
    room.disconnect();
    setIsConnecting(false);
  };

  return (
    <RoomContext.Provider value={room}>
      <RoomAudioRenderer />
      <StartAudio label="Start Audio" />
      {/* <Trigger error={!!currentError} popupOpen={popupOpen} onToggle={handleTogglePopup} /> */}

      <View className="w-full flex-1 items-center justify-center p-4">
        <View className="w-full max-w-[360px] rounded-[28px] border border-border bg-card shadow-sm">
          <View className="relative h-[480px] w-full">
            <View
              pointerEvents={currentError === null ? 'none' : 'auto'}
              className={cn(
                'absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-5 rounded-[28px] bg-card/95 p-4 text-center',
                currentError === null ? 'opacity-0' : 'opacity-100'
              )}>
              <View className="flex w-full flex-col items-center justify-center gap-2">
                {currentError?.title ? (
                  <Text className="text-sm font-semibold">{currentError.title}</Text>
                ) : null}
                {currentError?.description ? (
                  <Text className="text-xs text-muted-foreground">{currentError.description}</Text>
                ) : null}
              </View>

              <Button variant="secondary" onPress={handleDismissError}>
                <Text>Dismiss</Text>
              </Button>
            </View>
            <View
              pointerEvents={currentError !== null ? 'none' : 'auto'}
              className={cn(
                'absolute inset-0',
                currentError === null ? 'opacity-100' : 'opacity-0'
              )}>
              <PopupView
                disabled={!isConnected}
                sessionStarted={isConnecting || isConnected}
                onDisplayError={setCurrentError}
              />
            </View>
          </View>
          <View className="flex flex-row items-center justify-end gap-2 p-3">
            {!isConnected ? (
              <Button
                onPress={connect}
                disabled={isConnecting}
                className="transition-transform duration-200 ease-out hover:scale-105 focus:scale-105">
                <Text>
                  {isConnecting ? 'Connecting…' : connectionDetails ? 'Connect' : 'Connect'}
                </Text>
              </Button>
            ) : (
              <Button
                variant="destructive"
                onPress={disconnect}
                className="transition-transform duration-200 ease-out hover:scale-105 focus:scale-105">
                <Text>Disconnect</Text>
              </Button>
            )}
          </View>
        </View>
      </View>
    </RoomContext.Provider>
  );
}

export default EmbedFixedAgentClient;
