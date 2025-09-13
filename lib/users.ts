export type UserProfile = {
  id: string;
  name: string;
  bio: string;
  values: string[];
  goals: string[];
};

// Sample users removed — integrate with real user data instead.
export const USERS: UserProfile[] = [];

export function getUser(id: string) {
  return USERS.find((u) => u.id === id) ?? (USERS[0] as any);
}
