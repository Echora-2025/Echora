import { generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;

// Prefer a small/fast model for demo usage
const defaultModel = 'gpt-4o-mini';

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

