/**
 * Dev-only auth bootstrap: on first load (no auth_token in localStorage),
 * mints a JWT for the seeded "dev@localhost" user via POST /api/auth/dev-login
 * and stores it. Disabled in production via import.meta.env.DEV.
 */

const AUTH_TOKEN_KEY = 'auth_token';

interface DevLoginResponse {
  success: boolean;
  data?: { token: string; userId: string; email: string; name: string };
  message?: string;
}

function resolveApiRoot(): string {
  // `||` (not `??`) so an empty-string env var falls back to /api.
  // Vite reads `VITE_CANVAS_API_URL=` in .env as "", and ?? would keep it.
  const explicit = import.meta.env.VITE_CANVAS_API_URL;
  return (explicit || '/api').replace(/\/$/, '');
}

async function fetchDevToken(): Promise<string | null> {
  try {
    const response = await fetch(`${resolveApiRoot()}/auth/dev-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      console.warn(`[devAuth] dev-login responded ${response.status}`);
      return null;
    }
    const payload = (await response.json()) as DevLoginResponse;
    if (!payload.success || !payload.data?.token) {
      console.warn('[devAuth] dev-login payload missing token', payload.message);
      return null;
    }
    return payload.data.token;
  } catch (error) {
    console.warn('[devAuth] dev-login request failed', error);
    return null;
  }
}

export async function ensureDevAuthToken(): Promise<void> {
  if (!import.meta.env.DEV) return;
  if (localStorage.getItem(AUTH_TOKEN_KEY)) return;
  const token = await fetchDevToken();
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    console.info('[devAuth] stashed dev auth token');
  }
}
