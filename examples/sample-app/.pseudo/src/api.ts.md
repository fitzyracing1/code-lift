# src/api.ts

- Language: typescript
- Summary: Typed API client. 1 symbol(s): fetchUser

## async FUNCTION fetchUser(id: string, retries: number)  _(line 4)_

1. For each i = 0; i < retries; i++
2. Try
3. Return await get(`/users/${id}`)
4. On error e
5. Note: back off and retry
6. Call sleep
7. Raise new Error('unreachable')
