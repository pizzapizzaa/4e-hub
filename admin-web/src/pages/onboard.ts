import { setOnboardPassword } from '../api.js';

export async function renderOnboard(): Promise<void> {
  const qs = new URLSearchParams(location.search);
  const tokenFromQuery = qs.get('token') ?? '';

  document.title = 'Onboarding — 4E';
  const root = document.getElementById('content')!;
  root.innerHTML = `
    <div class="card mx-auto my-40 p-24" style="max-width:480px">
      <h2 class="mb-8">Set your password</h2>
      <p class="mb-12 text-muted">Enter a secure password to finish onboarding.</p>
      <div class="mb-8">
        <label class="form-label">Onboarding token</label>
        <input id="onb-token" value="${tokenFromQuery}" class="form-input" />
      </div>
      <div class="mb-8">
        <label class="form-label">New password</label>
        <input id="onb-password" type="password" class="form-input" />
      </div>
      <div id="onb-error" class="mb-8 text-danger" style="min-height:18px"></div>
      <div class="form-actions">
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
