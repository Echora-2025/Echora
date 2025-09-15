import { useCallback, useEffect, useState } from 'react';

// Prefer `EXPO_PUBLIC_SANDBOX_ID` for Expo projects. Fallback to `SANDBOX_ID`.
const sandboxID =
  (process.env.EXPO_PUBLIC_SANDBOX_ID as string | undefined) ||
  (process.env.SANDBOX_ID as string | undefined) ||
  '';

const tokenEndpoint = 'https://cloud-api.livekit.io/api/sandbox/connection-details';

// Optional: supply a hardcoded URL/token when not using Sandbox
// NOTE: Do not embed API secrets in the client app.
const hardcodedUrl = (process.env.LIVEKIT_URL as string | undefined) || '';
const hardcodedToken =
  (process.env.EXPO_PUBLIC_LIVEKIT_PARTICIPANT_TOKEN as string | undefined) || '';

export type ConnectionDetails = {
  serverUrl: string;
  participantToken: string;
};

export default function useConnectionDetails() {
  const [connectionDetails, setConnectionDetails] = useState<ConnectionDetails | null>(null);

  const fetchConnectionDetails = useCallback(() => {
    setConnectionDetails(null);
    fetchToken()
      .then((details) => {
        if (details) setConnectionDetails(details);
      })
      .catch((error) => {
        console.error('Error fetching connection details:', error);
      });
  }, []);

  useEffect(() => {
    fetchConnectionDetails();
  }, [fetchConnectionDetails]);

  return { connectionDetails, refreshConnectionDetails: fetchConnectionDetails };
}

export async function fetchToken(): Promise<ConnectionDetails | undefined> {
  // If no Sandbox ID is configured, fall back to hardcoded values
  if (!sandboxID) {
    if (hardcodedUrl && hardcodedToken) {
      return { serverUrl: hardcodedUrl, participantToken: hardcodedToken };
    }
    return undefined;
  }

  try {
    const response = await fetch(tokenEndpoint, {
      headers: { 'X-Sandbox-ID': sandboxID },
    });

    if (!response.ok) {
      console.error('Failed to fetch sandbox connection details:', response.statusText);
      return undefined;
    }

    const json = await response.json();
    if (json.serverUrl && json.participantToken) {
      const details: ConnectionDetails = {
        serverUrl: json.serverUrl,
        participantToken: json.participantToken,
      };
      return details;
    }
    return undefined;
  } catch (e) {
    console.error('Error fetching sandbox token:', e);
    return undefined;
  }
}
