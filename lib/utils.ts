import { clsx, type ClassValue } from 'clsx';
import { Room } from 'livekit-client';
import { type ReceivedChatMessage, type TextStreamData } from '@livekit/components-react';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function transcriptionToChatMessage(
  textStream: TextStreamData,
  room: Room
): ReceivedChatMessage {
  return {
    id: textStream.streamInfo.id,
    timestamp: textStream.streamInfo.timestamp,
    message: textStream.text,
    from:
      textStream.participantInfo.identity === room.localParticipant.identity
        ? room.localParticipant
        : Array.from(room.remoteParticipants.values()).find(
            (participant) => participant.identity === textStream.participantInfo.identity
          ),
  };
}
