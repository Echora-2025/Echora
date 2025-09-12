import * as React from 'react';
import { Platform } from 'react-native';

export type AudioData = { bytes: Uint8Array; mimeType: string };

function bytesToBase64(bytes: Uint8Array) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let output = '';
  let i = 0;
  while (i < bytes.length) {
    const b1 = bytes[i++] ?? 0;
    const b2 = bytes[i++] ?? 0;
    const b3 = bytes[i++] ?? 0;
    const enc1 = b1 >> 2;
    const enc2 = ((b1 & 3) << 4) | (b2 >> 4);
    const enc3 = ((b2 & 15) << 2) | (b3 >> 6);
    const enc4 = b3 & 63;
    if (i - 1 > bytes.length) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + '==';
    } else if (i > bytes.length) {
      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + '=';
    } else {
      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4);
    }
  }
  // Fix padding for exact length cases
  const mod = bytes.length % 3;
  if (mod === 1) output = output.slice(0, -2) + '==';
  if (mod === 2) output = output.slice(0, -1) + '=';
  return output;
}

export function useAudioPlayer() {
  const audioElRef = React.useRef<HTMLAudioElement | null>(null);
  const soundRef = React.useRef<any | null>(null);
  const [isPlaying, setIsPlaying] = React.useState(false);

  const play = React.useCallback(async (audio: AudioData) => {
    if (Platform.OS === 'web') {
      // Cleanup existing
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = '';
        audioElRef.current = null;
      }
      const blob = new Blob([audio.bytes], { type: audio.mimeType || 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      const AudioCtor: any = (globalThis as any).Audio;
      const el: HTMLAudioElement = AudioCtor ? new AudioCtor(url) : (document.createElement('audio') as HTMLAudioElement);
      if (!AudioCtor) {
        el.src = url;
        el.autoplay = true;
        el.controls = false;
      }
      el.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      el.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
      audioElRef.current = el;
      setIsPlaying(true);
      await el.play();
      return;
    }

    const ExpoAudioModule = await import('expo-audio');
    const AudioModule = ExpoAudioModule.Audio;
    const { default: FileSystem } = await import('expo-file-system');
    // Write to a temp file and play via expo-audio
    const extension = audio.mimeType.includes('mpeg') ? 'mp3' : audio.mimeType.includes('wav') ? 'wav' : 'm4a';
    const fileUri = `${FileSystem.cacheDirectory}tts-reply-${Date.now()}.${extension}`;
    const base64 = bytesToBase64(audio.bytes);
    await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
    if (soundRef.current) {
      await soundRef.current.stopAsync().catch(() => {});
      await soundRef.current.unloadAsync().catch(() => {});
      soundRef.current = null;
    }
    const { sound } = await AudioModule.Sound.createAsync({ uri: fileUri }, { shouldPlay: true });
    sound.setOnPlaybackStatusUpdate((status: any) => {
      if (!status.isLoaded) return;
      setIsPlaying(status.isPlaying === true);
    });
    soundRef.current = sound;
  }, []);

  const stop = React.useCallback(async () => {
    if (Platform.OS === 'web') {
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = '';
        audioElRef.current = null;
      }
      setIsPlaying(false);
      return;
    }
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  React.useEffect(() => {
    return () => {
      // cleanup
      if (audioElRef.current) {
        audioElRef.current.pause();
        audioElRef.current.src = '';
      }
      audioElRef.current = null;
    };
  }, []);

  return { isPlaying, play, stop };
}
