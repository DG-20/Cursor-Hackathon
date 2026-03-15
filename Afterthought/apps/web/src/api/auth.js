const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8080';

export async function signUp({ email, password, confirm_password, first_name }) {
  const res = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, confirm_password, first_name }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Sign up failed: ${res.status}`);
  return data;
}

export async function signIn(email, password) {
  const res = await fetch(`${API_BASE}/api/auth/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Sign in failed: ${res.status}`);
  return data;
}

export async function getMe(accessToken) {
  const res = await fetch(`${API_BASE}/api/auth/me`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Auth check failed: ${res.status}`);
  return data;
}
