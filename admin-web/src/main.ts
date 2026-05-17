// ── Main entry ────────────────────────────────────────────────────────────────
import {
    IS_MOCK,
    attemptTokenRefresh,
    clearAuth,
    getCurrentUser,
    getRefreshToken,
    getToken,
    isTokenExpired,
    setExpiresAt,
    setRefreshToken,
    setToken,
} from './api.js';
import { NAV_ITEMS, getPageRenderer, type PageId } from './router.js';

// ── DOM refs ─────────────────────────────────────────────────────────────────
const sidebar     = document.getElementById('sidebar')!;
const overlay     = document.getElementById('overlay')!;
const hamburger   = document.getElementById('hamburger')!;
const sidebarNav  = document.getElementById('sidebar-nav')!;
const bnavInner   = document.getElementById('bnav-inner')!;
const content     = document.getElementById('content')!;
const topbarTitle = document.getElementById('topbar-title')!;
const toast       = document.getElementById('toast')!;

// ── State ─────────────────────────────────────────────────────────────────────
let activePage: PageId = 'dashboard';

// ── Toast helper ──────────────────────────────────────────────────────────────
export function showToast(msg: string, duration = 2500): void {
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ── Loader helper ─────────────────────────────────────────────────────────────
export function setLoading(): void {
  content.innerHTML = '<div class="loader">Loading…</div>';
}

export function setError(msg: string): void {
  const div = document.createElement('div');
  div.className = 'error-msg';
  div.textContent = msg;
  content.innerHTML = '';
  content.appendChild(div);
}

// ── Nav build ─────────────────────────────────────────────────────────────────
function buildNav(): void {
  sidebarNav.innerHTML = '';
  bnavInner.innerHTML  = '';
  const current = getCurrentUser();
  const role = current?.role || 'admin';
  const allowedForTeacher = new Set(['schools','programs','learners','materials','inaction']);

  for (const item of NAV_ITEMS) {
    if (role === 'teacher' && !allowedForTeacher.has(item.id)) continue;
    // Sidebar item
    const btn = document.createElement('button');
    btn.className = `nav-item${item.id === activePage ? ' active' : ''}`;
    btn.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
    // ensure active press handling on touch devices
    btn.setAttribute('ontouchstart', '');
    attachPressHandlers(btn);
    btn.addEventListener('click', () => navigate(item.id));
    sidebarNav.appendChild(btn);

    // Bottom-nav item
    const bBtn = document.createElement('button');
    bBtn.className = `bnav-item${item.id === activePage ? ' active' : ''}`;
    bBtn.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
    bBtn.setAttribute('ontouchstart', '');
    attachPressHandlers(bBtn);
    bBtn.addEventListener('click', () => navigate(item.id));
    bnavInner.appendChild(bBtn);
  }
}

// ── Navigate ──────────────────────────────────────────────────────────────────
async function navigate(page: PageId): Promise<void> {
  activePage = page;

  // Update active state in both navs
  buildNav();

  // Update top-bar title
  topbarTitle.textContent = NAV_ITEMS.find(n => n.id === page)?.label ?? page;

  // Close mobile sidebar
  sidebar.classList.remove('open');
  overlay.classList.remove('open');

  // Update URL hash
  history.replaceState(null, '', `#${page}`);

  // Render page
  setLoading();
  try {
    await getPageRenderer(page)();
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Unexpected error');
  }
}

// ── Mobile sidebar toggle ─────────────────────────────────────────────────────
hamburger.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  overlay.classList.toggle('open');
});
overlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  overlay.classList.remove('open');
});

// ── Auth gate ─────────────────────────────────────────────────────────────────
function startApp(): void {
  const app = document.getElementById('app')!;
  app.style.display = '';
  addLogoutButton();
  buildNav();
  const hash = location.hash.replace('#', '') as PageId;
  const startPage: PageId = NAV_ITEMS.some(n => n.id === hash) ? hash : 'dashboard';
  navigate(startPage);
}

function addLogoutButton(): void {
  const topbarUser = document.getElementById('topbar-user')!;
  topbarUser.textContent = '';
  const btn = document.createElement('button');
  btn.textContent = 'Logout';
  btn.className = 'btn btn-orange';
  btn.setAttribute('ontouchstart', '');
  attachPressHandlers(btn);
  btn.addEventListener('click', async () => {
    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (apiUrl) {
      try {
        await fetch(`${apiUrl}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}),
          },
          body: JSON.stringify({ refreshToken: getRefreshToken() }),
        });
      } catch { /* best effort — clear session regardless */ }
    }
    clearAuth();
    window.location.replace('#login');
    window.location.reload();
  });
  topbarUser.appendChild(btn);
}

// Add small press handlers so mobile/touch devices get the 3D "press" animation
function attachPressHandlers(el: HTMLElement): void {
  let held = false;
  const down = (): void => {
    held = true;
    el.classList.add('pressed');
  };
  const up = (): void => {
    if (!held) return;
    held = false;
    el.classList.remove('pressed');
  };
  el.addEventListener('pointerdown', down);
  el.addEventListener('pointerup', up);
  el.addEventListener('pointercancel', up);
  el.addEventListener('pointerleave', up);
}

function showLoginPage(): void {
  const app = document.getElementById('app')!;
  app.style.display = 'none';

  const page = document.createElement('div');
  page.id = 'login-page';
  // Static developer-authored HTML — safe to use innerHTML here
  page.innerHTML = `
    <div style="
      min-height:100dvh;display:flex;align-items:center;justify-content:center;
      background:var(--bg);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      padding:20px;
    ">
      <div style="
        background:var(--card);border-radius:var(--radius);box-shadow:var(--shadow);
        padding:40px 36px;width:100%;max-width:380px;
      ">
        <h1 style="font-size:20px;font-weight:800;color:var(--green);margin-bottom:4px">4E Global</h1>
        <p style="font-size:13px;color:var(--muted);margin-bottom:28px">Admin Portal — Sign in</p>
        <form id="login-form" novalidate>
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="login-email">Email</label>
          <input id="login-email" type="email" required autocomplete="username"
            style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:16px;outline:none" />
          <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="login-password">Password</label>
          <input id="login-password" type="password" required autocomplete="current-password"
            style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:20px;outline:none" />
          <div id="login-error" role="alert" style="
            display:none;background:#FEF2F2;color:#DC2626;border-radius:6px;
            padding:10px 12px;font-size:13px;margin-bottom:16px;
          "></div>
          <button type="submit" id="login-submit" class="btn btn-orange" style="
            width:100%;font-size:15px;
          ">Sign in</button>
        </form>
      </div>
    </div>`;
  document.body.appendChild(page);

  const form      = page.querySelector<HTMLFormElement>('#login-form')!;
  const emailIn   = page.querySelector<HTMLInputElement>('#login-email')!;
  const passIn    = page.querySelector<HTMLInputElement>('#login-password')!;
  const errorBox  = page.querySelector<HTMLDivElement>('#login-error')!;
  const submitBtn = page.querySelector<HTMLButtonElement>('#login-submit')!;

  function setLoginError(msg: string): void {
    errorBox.textContent = msg;  // textContent — no XSS
    errorBox.style.display = msg ? 'block' : 'none';
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    setLoginError('');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing in…';

    const apiUrl = import.meta.env.VITE_API_URL as string | undefined;
    if (!apiUrl) { setLoginError('API URL not configured.'); submitBtn.disabled = false; submitBtn.textContent = 'Sign in'; return; }

    try {
      const res = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: emailIn.value.trim().toLowerCase(), password: passIn.value }),
      });
      if (!res.ok) {
        setLoginError('Invalid email or password. Please try again.');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign in';
        return;
      }
      const data = await res.json() as { accessToken: string; refreshToken: string; expiresAt: number };
      setToken(data.accessToken);
      setRefreshToken(data.refreshToken);
      setExpiresAt(data.expiresAt);
      page.remove();
      startApp();
    } catch {
      setLoginError('Network error. Please try again.');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Sign in';
    }
  });
}

// ── Init ──────────────────────────────────────────────────────────────────────
(async function init() {
  // If user is opening the onboarding link, render onboarding page (public)
  if (location.pathname.startsWith('/onboard')) {
    const { renderOnboard } = await import('./pages/onboard.js');
    renderOnboard();
    return;
  }
  if (IS_MOCK) {
    // Dev / mock mode — no auth required
    startApp();
    return;
  }
  const token = getToken();
  if (token && !isTokenExpired()) {
    startApp();
    return;
  }
  if (token && isTokenExpired()) {
    const ok = await attemptTokenRefresh();
    if (ok) { startApp(); return; }
  }
  showLoginPage();
})();
