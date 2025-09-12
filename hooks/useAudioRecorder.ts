import * as React from 'react';
import { Platform } from 'react-native';

export type RecordedAudio = {
  data: Uint8Array;
  mimeType: string;
  uri?: string; // native only convenience
};

// Lightweight base64 decoder without relying on atob/Buffer
function base64ToBytes(base64: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  let str = base64.replace(/\s+/g, '');
  let output: number[] = [];
  let p = 0;
  while (p < str.length) {
    const enc1 = chars.indexOf(str.charAt(p++));
    const enc2 = chars.indexOf(str.charAt(p++));
    const enc3 = chars.indexOf(str.charAt(p++));
    const enc4 = chars.indexOf(str.charAt(p++));
    const chr1 = (enc1 << 2) | (enc2 >> 4);
    const chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
    const chr3 = ((enc3 & 3) << 6) | enc4;
    output.push(chr1);
    if (enc3 !== 64) output.push(chr2);
    if (enc4 !== 64) output.push(chr3);
  }
  return new Uint8Array(output);
}

export function useAudioRecorder() {
  const mediaRecorderRef = React.useRef<any | null>(null);
  const webChunksRef = React.useRef<BlobPart[]>([]);
  const [isRecording, setIsRecording] = React.useState(false);

  // Native (Expo) refs
  const recordingRef = React.useRef<any | null>(null);

  const startRecording = React.useCallback(async () => {
    if (isRecording) return;
    if (Platform.OS === 'web') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = 'audio/webm';
      const rec = new MediaRecorder(stream, { mimeType });
      webChunksRef.current = [];
      rec.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) webChunksRef.current.push(e.data);
      };
      rec.start();
      mediaRecorderRef.current = rec;
      setIsRecording(true);
      return;
    }

    const ExpoAudioModule = await import('expo-audio');
    const AudioModule = ExpoAudioModule.Audio;
    const permission = await AudioModule.requestPermissionsAsync();
    if (!permission.granted) throw new Error('Microphone permission denied');
    await AudioModule.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });

    const recording = new AudioModule.Recording();
    await recording.prepareToRecordAsync(
      // @ts-ignore Expo's preset type is not perfect across versions
      AudioModule.RecordingOptionsPresets.HIGH_QUALITY
    );
    await recording.startAsync();
    recordingRef.current = recording;
    setIsRecording(true);
  }, [isRecording]);

  const stopRecording = React.useCallback(async (): Promise<RecordedAudio | null> => {
    if (!isRecording) return null;

    if (Platform.OS === 'web') {
      const rec = mediaRecorderRef.current;
      if (!rec) return null;
      const done = new Promise<RecordedAudio>((resolve) => {
        rec.onstop = async () => {
          const blob = new Blob(webChunksRef.current, { type: 'audio/webm' });
          const arrBuf = await blob.arrayBuffer();
          resolve({ data: new Uint8Array(arrBuf), mimeType: 'audio/webm' });
        };
      });
      rec.stop();
      mediaRecorderRef.current = null;
      setIsRecording(false);
      return await done;
    }

    const { default: FileSystem } = await import('expo-file-system');
    const recording = recordingRef.current;
    if (!recording) return null;
    try {
      await recording.stopAndUnloadAsync();
    } catch (e) {
      // ignore stop errors if already stopped
    }
    const uri = recording.getURI();
    recordingRef.current = null;
    setIsRecording(false);
    if (!uri) return null;
    const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    return { data: base64ToBytes(base64), mimeType: 'audio/m4a', uri: uri ?? undefined };
  }, [isRecording]);

  return { isRecording, startRecording, stopRecording };
}
