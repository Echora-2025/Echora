export type UserProfile = {
  id: string;
  name: string;
  bio: string;
  values: string[];
  goals: string[];
};

export const USERS: UserProfile[] = [
  {
    id: 'u1',
    name: 'Alice',
    bio: 'Product designer who loves journaling, hiking, and chai.',
    values: ['empathy', 'growth', 'creativity', 'authenticity'],
    goals: ['improve communication', 'build meaningful relationships'],
  },
  {
    id: 'u2',
    name: 'Bob',
    bio: 'Software engineer into indie games, meditation, and coffee.',
    values: ['curiosity', 'stability', 'honesty', 'kindness'],
    goals: ['find better work-life balance', 'deepen friendships'],
  },
];

export function getUser(id: string) {
  return USERS.find((u) => u.id === id) ?? USERS[0];
}

