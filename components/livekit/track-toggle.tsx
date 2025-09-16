import * as React from 'react';
import { Track } from 'livekit-client';
import { LoaderCircle, Mic, MicOff, MonitorUp, Video, VideoOff } from 'lucide-react-native';
import { Icon } from '../ui/icon';
import { Toggle } from '../ui/toggle';
import { cn } from '@/lib/utils';

export type TrackToggleProps = Omit<React.ComponentProps<typeof Toggle>, 'children'> & {
  children?: React.ReactNode;
  source: Track.Source;
  pending?: boolean;
};

function getSourceIcon(source: Track.Source, enabled: boolean, pending?: boolean) {
  if (pending) {
    return LoaderCircle;
  }

  switch (source) {
    case Track.Source.Microphone:
      return enabled ? Mic : MicOff;
    case Track.Source.Camera:
      return enabled ? Video : VideoOff;
    case Track.Source.ScreenShare:
      return MonitorUp;
    default:
      return enabled ? Mic : MicOff;
  }
}

export function TrackToggle({ source, pressed, pending, className, children, ...props }: TrackToggleProps) {
  const IconComponent = React.useMemo(() => getSourceIcon(source, pressed ?? false, pending), [
    source,
    pressed,
    pending,
  ]);

  return (
    <Toggle pressed={pressed} className={cn('gap-1 px-3', className)} {...props}>
      <Icon as={IconComponent} className={cn(pending && 'animate-spin')} size={16} />
      {children}
    </Toggle>
  );
}
