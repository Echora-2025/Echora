import * as React from 'react';
import { LogLevel, setLogLevel } from 'livekit-client';
import { useRoomContext } from '@livekit/components-react';

export const useDebugMode = ({ logLevel }: { logLevel?: LogLevel } = {}) => {
  const room = useRoomContext();

  React.useEffect(() => {
    setLogLevel(logLevel ?? 'debug');

    if (typeof window !== 'undefined') {
      // @ts-expect-error - expose room for debugging tools
      window.__lk_room = room;
    }

    return () => {
      if (typeof window !== 'undefined') {
        // @ts-expect-error - cleanup debug handle
        window.__lk_room = undefined;
      }
    };
  }, [room, logLevel]);
};
