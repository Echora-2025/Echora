import { type TrackReference, VideoTrack } from '@livekit/components-react';

interface AvatarTileProps {
  videoTrack: TrackReference;
  className?: string;
}

export const AvatarTile = ({ videoTrack, className }: AvatarTileProps) => {
  return (
    <VideoTrack
      trackRef={videoTrack}
      width={videoTrack?.publication.dimensions?.width ?? 0}
      height={videoTrack?.publication.dimensions?.height ?? 0}
      className={className}
    />
  );
};
