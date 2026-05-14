require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });
const API = 'https://4e-hub-cf.4e-hub.workers.dev';
const ORIGIN = 'https://admin-web-gamma-lime.vercel.app';

async function test() {
  // 1. Login
  const loginRes = await fetch(`${API}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({ email: '4e-admin@proton.me', password: '4e-admin123?' }),
  });
  const login = await loginRes.json();
  console.log('[1] Login:', loginRes.status, login.user ? `role=${login.user.role}` : JSON.stringify(login));
  if (!login.accessToken) return;

  // 2. Logout (with access + refresh token)
  const logoutRes = await fetch(`${API}/api/auth/logout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Origin': ORIGIN,
      'Authorization': `Bearer ${login.accessToken}`,
    },
    body: JSON.stringify({ refreshToken: login.refreshToken }),
  });
  const logout = await logoutRes.json();
  console.log('[2] Logout:', logoutRes.status, JSON.stringify(logout));

  // 3. Try refresh (should fail — token was deleted)
  const refreshRes = await fetch(`${API}/api/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Origin': ORIGIN },
    body: JSON.stringify({ refreshToken: login.refreshToken }),
  });
  const refresh = await refreshRes.json();
  console.log('[3] Refresh after logout:', refreshRes.status, JSON.stringify(refresh));
}

test().catch(e => { console.error(e.message); process.exit(1); });
