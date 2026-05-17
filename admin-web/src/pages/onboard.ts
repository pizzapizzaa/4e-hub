import { setOnboardPassword } from '../api.js';

export async function renderOnboard(): Promise<void> {
  const qs = new URLSearchParams(location.search);
  const tokenFromQuery = qs.get('token') ?? '';

  document.title = 'Onboarding — 4E';
  const root = document.getElementById('content')!;
  root.innerHTML = `
    <div style="max-width:480px;margin:40px auto;padding:24px;background:var(--card);border-radius:10px">
      <h2 style="margin-bottom:8px">Set your password</h2>
      <p style="color:var(--muted);margin-bottom:12px">Enter a secure password to finish onboarding.</p>
      <div style="margin-bottom:8px">
        <label style="display:block;font-size:13px">Onboarding token</label>
        <input id="onb-token" value="${tokenFromQuery}" style="width:100%;padding:10px;margin-top:6px" />
      </div>
      <div style="margin-bottom:8px">
        <label style="display:block;font-size:13px">New password</label>
        <input id="onb-password" type="password" style="width:100%;padding:10px;margin-top:6px" />
      </div>
      <div id="onb-error" style="color:var(--danger);min-height:18px;margin-bottom:8px"></div>
      <div>
        <button id="onb-submit" class="btn btn-orange">Set password</button>
      </div>
    </div>`;

  const tokenEl = document.getElementById('onb-token') as HTMLInputElement;
  const passEl = document.getElementById('onb-password') as HTMLInputElement;
  const errEl = document.getElementById('onb-error') as HTMLDivElement;
  const submit = document.getElementById('onb-submit') as HTMLButtonElement;

  submit.addEventListener('click', async () => {
    errEl.textContent = '';
    const token = tokenEl.value.trim();
    const password = passEl.value;
    if (!token) { errEl.textContent = 'Onboarding token is required'; return; }
    if (!password || password.length < 8) { errEl.textContent = 'Password must be at least 8 characters'; return; }
    submit.disabled = true;
    try {
      await setOnboardPassword({ token, password });
      alert('Password set — you may now sign in.');
      location.href = '/';
    } catch (e) {
      errEl.textContent = e instanceof Error ? e.message : String(e);
      submit.disabled = false;
    }
  });
}
