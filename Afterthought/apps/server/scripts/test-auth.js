/**
 * Endpoint test for auth: signup, signin, GET /me.
 * Run with server up: npm run dev (in apps/server), then:
 *   node scripts/test-auth.js
 * Or from repo root: node apps/server/scripts/test-auth.js
 * Uses BASE_URL=http://localhost:8080 by default.
 */

const BASE_URL = process.env.BASE_URL || 'http://localhost:8080';

const email = `test-${Date.now()}@example.com`;
const password = 'testpass123';

async function request(method, path, body = null, token = null) {
  const opts = { method, headers: {} };
  if (body) {
    opts.headers['Content-Type'] = 'application/json';
    opts.body = JSON.stringify(body);
  }
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${BASE_URL}${path}`, opts);
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

async function main() {
  console.log('Auth endpoint test');
  console.log('Base URL:', BASE_URL);
  console.log('');

  // 1. Sign up
  console.log('1. POST /api/auth/signup');
  const signUpRes = await request('POST', '/api/auth/signup', {
    email,
    password,
    confirm_password: password,
    first_name: 'Test',
  });
  if (!signUpRes.ok) {
    console.error('   FAIL', signUpRes.status, signUpRes.data);
    process.exit(1);
  }
  console.log('   OK', signUpRes.status);
  const accessToken = signUpRes.data?.session?.access_token;
  if (accessToken) console.log('   Got access_token (truncated):', accessToken.slice(0, 20) + '…');
  console.log('');

  // 2. Sign in
  console.log('2. POST /api/auth/signin');
  const signInRes = await request('POST', '/api/auth/signin', { email, password });
  if (!signInRes.ok) {
    console.error('   FAIL', signInRes.status, signInRes.data);
    process.exit(1);
  }
  console.log('   OK', signInRes.status);
  const token = signInRes.data?.session?.access_token;
  if (!token) {
    console.error('   No access_token in response');
    process.exit(1);
  }
  console.log('   Got access_token (truncated):', token.slice(0, 20) + '…');
  console.log('');

  // 3. GET /me
  console.log('3. GET /api/auth/me (Bearer token)');
  const meRes = await request('GET', '/api/auth/me', null, token);
  if (!meRes.ok) {
    console.error('   FAIL', meRes.status, meRes.data);
    process.exit(1);
  }
  console.log('   OK', meRes.status);
  console.log('   User:', JSON.stringify(meRes.data?.user, null, 2));
  console.log('');

  console.log('All auth endpoint checks passed.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
