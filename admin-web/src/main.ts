// ── Main entry ────────────────────────────────────────────────────────────────
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
  content.innerHTML = `<div class="error-msg">${msg}</div>`;
}

// ── Nav build ─────────────────────────────────────────────────────────────────
function buildNav(): void {
  sidebarNav.innerHTML = '';
  bnavInner.innerHTML  = '';

  for (const item of NAV_ITEMS) {
    // Sidebar item
    const btn = document.createElement('button');
    btn.className = `nav-item${item.id === activePage ? ' active' : ''}`;
    btn.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
    btn.addEventListener('click', () => navigate(item.id));
    sidebarNav.appendChild(btn);

    // Bottom-nav item
    const bBtn = document.createElement('button');
    bBtn.className = `bnav-item${item.id === activePage ? ' active' : ''}`;
    bBtn.innerHTML = `<span class="icon">${item.icon}</span>${item.label}`;
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

// ── Init ──────────────────────────────────────────────────────────────────────
buildNav();
const hash = location.hash.replace('#', '') as PageId;
const startPage: PageId = NAV_ITEMS.some(n => n.id === hash) ? hash : 'dashboard';
navigate(startPage);
