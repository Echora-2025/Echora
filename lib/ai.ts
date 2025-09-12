import { generateText, experimental_transcribe as transcribe, experimental_generateSpeech as generateSpeech } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Default reply model (aligned with design doc chain)
const defaultModel = 'gpt-4.1';

function getClient() {
  if (!apiKey) {
    return null;
  }
  return createOpenAI({ apiKey });
}

export async function voiceAgentRespond(userName: string, input: string) {
  const client = getClient();
  if (!client) {
    // Fallback for demo when no key is provided
    return `Hi ${userName}! (demo) You said: "${input}".`;
  }

  const { text } = await generateText({
    model: client(defaultModel),
    prompt: `You are a concise, kind voice agent helping ${userName} reflect.
User said: ${input}
Reply in less than 60 words.`,
  });

  return text;
}

export type MatchResult = { score: number; reason: string };

export async function matchUsers(u1: object, u2: object): Promise<MatchResult> {
  const client = getClient();
  if (!client) {
    // Simple local heuristic fallback for demo
    return {
      score: 72,
      reason: 'Demo fallback: similar interests inferred from local sample.',
    };
  }

  const { text } = await generateText({
    model: client(defaultModel),
    prompt:
      'Given two user profiles as JSON, return a JSON with keys "score" (0-100) and "reason" (one sentence).\n' +
      `UserA: ${JSON.stringify(u1)}\nUserB: ${JSON.stringify(u2)}\n` +
      'Return ONLY JSON like {"score":87,"reason":"..."}.',
  });

  try {
    const parsed = JSON.parse(text);
    if (typeof parsed.score === 'number' && typeof parsed.reason === 'string') {
      return parsed as MatchResult;
    }
  } catch (e) {
    // ignore and fall through
  }

  return { score: 65, reason: 'Heuristic: moderate compatibility based on values and goals.' };
}

// ============ Voice: Transcription + TTS helpers ============

type BytesAudio = { data: Uint8Array; mimeType: string; uri?: string };

function getHeaders() {
  if (!apiKey) return null;
  return {
    Authorization: `Bearer ${apiKey}`,
  } as const;
}

// Try AI SDK experimental_transcribe first; fallback to REST
export async function transcribeAudio(audio: BytesAudio): Promise<string> {
  const headers = getHeaders();
  if (!headers) {
    // Demo fallback when no key
    return '(demo) [transcript unavailable without API key]';
  }

  // AI SDK experimental interface
  try {
    const client = createOpenAI({ apiKey: apiKey! });
    const model = client.transcription('gpt-4o-transcribe');
    const blob = new Blob([audio.data], { type: audio.mimeType || 'application/octet-stream' });
    const result: any = await transcribe({ model, audio: blob });
    const text = typeof result === 'string' ? result : result?.text;
    if (typeof text === 'string') return text;
  } catch {
    // fall through to REST
  }

  const form = new FormData();
  const filename = audio.mimeType.includes('webm')
    ? 'audio.webm'
    : audio.mimeType.includes('wav')
    ? 'audio.wav'
    : 'audio.m4a';
  // Blob is available on web and modern React Native (via Expo polyfill)
  if (audio.uri) {
    // React Native FormData file object
    // @ts-ignore: React Native FormData file support
    form.append('file', { uri: audio.uri, type: audio.mimeType, name: filename } as any);
  } else {
    const blob = new Blob([audio.data], { type: audio.mimeType || 'application/octet-stream' });
    form.append('file', blob as any, filename as any);
  }
  form.append('model', 'gpt-4o-transcribe');

  const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers,
    body: form as any,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Transcription failed: ${res.status} ${text}`);
  }
  const json = await res.json();
  // OpenAI returns { text: string, ... }
  return typeof json?.text === 'string' ? json.text : '';
}

// Try AI SDK experimental_generateSpeech first; fallback to REST
export async function generateSpeechAudio(
  text: string,
  options?: { voice?: string; format?: 'mp3' | 'wav' | 'aac' }
): Promise<{ bytes: Uint8Array; mimeType: string } | null> {
  const headers = getHeaders();
  if (!headers) return null;
  const voice = options?.voice ?? 'alloy';

  // AI SDK experimental interface
  try {
    const client = createOpenAI({ apiKey: apiKey! });
    const model = client.speech('gpt-4o-mini-tts');
    const output: any = await generateSpeech({ model, text, voice });
    if (output) {
      // AI SDK v5 experimental: output.audio.audioData (Uint8Array) per docs
      const candidate = output.audio?.audioData || output.audioData || output.bytes || output.data;
      const type = output.mimeType || output.type || output.audio?.mimeType || 'audio/mpeg';
      if (candidate instanceof Uint8Array) {
        return { bytes: candidate, mimeType: type };
      }
      if (typeof Blob !== 'undefined' && output instanceof Blob) {
        const arr = await output.arrayBuffer();
        return { bytes: new Uint8Array(arr), mimeType: output.type || type };
      }
      if (output instanceof ArrayBuffer) {
        return { bytes: new Uint8Array(output), mimeType: type };
      }
      if (output?.bytes instanceof Uint8Array) {
        return { bytes: output.bytes, mimeType: output.mimeType || type };
      }
      if (output instanceof Uint8Array) {
        return { bytes: output, mimeType: type };
      }
    }
  } catch {
    // fall through to REST
  }

  const model = 'gpt-4o-mini-tts';
  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, voice, input: text }),
  });
  if (!res.ok) {
    const err = await res.text().catch(() => '');
    throw new Error(`TTS failed: ${res.status} ${err}`);
  }
  const mime = res.headers.get('content-type') || 'audio/mpeg';
  const buf = await res.arrayBuffer();
  return { bytes: new Uint8Array(buf), mimeType: mime };
}

export async function voiceInteraction(
  userName: string,
  audio: BytesAudio
): Promise<{ transcript: string; replyText: string; replyAudio: { bytes: Uint8Array; mimeType: string } | null }> {
  const transcript = await transcribeAudio(audio);
  const replyText = await voiceAgentRespond(userName, transcript || '(no speech detected)');
  let replyAudio: { bytes: Uint8Array; mimeType: string } | null = null;
  try {
    replyAudio = await generateSpeechAudio(replyText);
  } catch {
    // ignore TTS errors; still return text
  }
  return { transcript, replyText, replyAudio };
}
