// Typed API client.
export interface User { id: string; name: string }

export async function fetchUser<T>(id: string, retries: number): Promise<User> {
  for (let i = 0; i < retries; i++) {
    try {
      return await get(`/users/${id}`);
    } catch (e) {
      // back off and retry
      await sleep(100 * i);
    }
  }
  throw new Error('unreachable');
}
