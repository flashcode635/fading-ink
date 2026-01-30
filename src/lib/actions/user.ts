export interface UserData {
  id: string;
  username: string;
  createdAt: string;
}

/**
 * Find an existing user by username or create a new one if not found
 */
export async function findOrCreateUser(username: string): Promise<UserData> {
  const response = await fetch('/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username }),
  });

  if (!response.ok) {
    throw new Error('Failed to find or create user');
  }

  return response.json();
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<UserData | null> {
  const response = await fetch(`/api/users/${userId}`);

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    throw new Error('Failed to get user');
  }

  return response.json();
}
