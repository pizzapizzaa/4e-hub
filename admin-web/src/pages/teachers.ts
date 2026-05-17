import { createTeacher, generateOnboardingToken, getSchools, getTeachers } from '../api.js';
import { esc } from '../escape.js';
import type { Teacher } from '../types.js';

export async function renderTeachers(): Promise<void> {
  const content  = document.getElementById('content')!;
  const teachers = await getTeachers();
  const schools = await getSchools();

  content.innerHTML = `
    <div class="list-header">
      <h2>Teachers</h2>
      <button id="create-teacher-btn" style="margin-left:auto">Create Teacher</button>
    </div>
    <div id="create-teacher-form" style="display:none;margin:16px 0;padding:12px;border:1px solid var(--muted);border-radius:6px">
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <div style="flex:1;min-width:240px">
          <input id="ct-fullname" placeholder="Full name" style="width:100%" />
          <div id="ct-fullname-err" style="color:var(--danger);font-size:12px;height:16px"></div>
        </div>
        <div style="flex:1;min-width:220px">
          <input id="ct-email" placeholder="Email" style="width:100%" />
          <div id="ct-email-err" style="color:var(--danger);font-size:12px;height:16px"></div>
        </div>
        <div style="flex:1;min-width:180px">
          <input id="ct-password" placeholder="Onboarding password" type="password" style="width:100%" />
          <div id="ct-password-err" style="color:var(--danger);font-size:12px;height:16px"></div>
        </div>
      </div>
      <div style="margin-top:8px">
        <label style="font-size:13px">Assign to schools (multi-select)</label><br />
        <select id="ct-schools" multiple style="width:100%;min-height:80px;margin-top:6px">
          ${schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
        </select>
      </div>
      <div style="margin-top:8px">
        <button id="ct-submit">Create</button>
        <button id="ct-cancel" style="margin-left:8px">Cancel</button>
        <div id="ct-error" style="color:var(--danger);margin-top:8px"></div>
      </div>
    </div>
    ${teachers.length === 0
      ? '<div class="empty">No teachers found.</div>'
      : `<div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Subjects</th>
                <th>Classes</th>
                <th>School</th>
              </tr>
            </thead>
            <tbody>
              ${teachers.map(t => teacherRow(t)).join('')}
            </tbody>
          </table>
        </div>`
    }`;

  // Wire create teacher UI
  const btn = document.getElementById('create-teacher-btn') as HTMLButtonElement | null;
  const form = document.getElementById('create-teacher-form') as HTMLDivElement | null;
  // If dashboard requested the create form, show it and clear the flag
  if (form && sessionStorage.getItem('open_create_teacher')) {
    form.style.display = 'block';
    sessionStorage.removeItem('open_create_teacher');
  }
  if (btn && form) {
    btn.addEventListener('click', () => { form.style.display = form.style.display === 'none' ? 'block' : 'none'; });
    const cancel = document.getElementById('ct-cancel') as HTMLButtonElement;
    cancel.addEventListener('click', () => { form.style.display = 'none'; });
    const submit = document.getElementById('ct-submit') as HTMLButtonElement;
    submit.addEventListener('click', async () => {
      const fullNameEl = document.getElementById('ct-fullname') as HTMLInputElement;
      const emailEl = document.getElementById('ct-email') as HTMLInputElement;
      const passwordEl = document.getElementById('ct-password') as HTMLInputElement;
      const fnameErr = document.getElementById('ct-fullname-err') as HTMLDivElement;
      const emailErr = document.getElementById('ct-email-err') as HTMLDivElement;
      const passErr = document.getElementById('ct-password-err') as HTMLDivElement;
      const globalErr = document.getElementById('ct-error') as HTMLDivElement;
      fnameErr.textContent = emailErr.textContent = passErr.textContent = globalErr.textContent = '';

      const fullName = fullNameEl.value.trim();
      const email = emailEl.value.trim();
      const password = passwordEl.value;
      const sel = document.getElementById('ct-schools') as HTMLSelectElement;
      const schoolIds = Array.from(sel.selectedOptions).map(o => o.value);

      let ok = true;
      if (!fullName) { fnameErr.textContent = 'Full name is required'; ok = false; }
      if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { emailErr.textContent = 'Valid email required'; ok = false; }
      if (!password || password.length < 8) { passErr.textContent = 'Password must be at least 8 characters'; ok = false; }
      if (schoolIds.length === 0) { globalErr.textContent = 'Select at least one school'; ok = false; }
      if (!ok) return;

      try {
        const res = await createTeacher({ fullName, email, password, schoolIds });
        form.style.display = 'none';
        const userId = res.userId as string | undefined;
        if (userId && confirm('Generate onboarding link and copy to clipboard?')) {
          try {
            const tokenRes = await generateOnboardingToken({ userId });
            const token = tokenRes?.token;
            const link = `${location.origin}/onboard?token=${encodeURIComponent(token)}`;
            await navigator.clipboard.writeText(link);
            alert('Onboarding link copied to clipboard');
          } catch {
            globalErr.textContent = 'Failed to generate onboarding link';
          }
        }
        renderTeachers();
      } catch (err) {
        globalErr.textContent = (err instanceof Error ? err.message : String(err));
      }
    });
  }
}

function teacherRow(t: Teacher): string {
  const subjects = t.subjectAreas
    .map(s => `<span class="badge badge-green" style="margin-right:4px">${esc(s)}</span>`)
    .join('');
  return `<tr data-id="${esc(t.id)}">
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">
          ${esc(t.id.slice(0, 2).toUpperCase())}
        </div>
        <span style="font-weight:600">Teacher ${esc(t.id.slice(8, 12))}</span>
      </div>
    </td>
    <td>${subjects}</td>
    <td>${esc(t.classIds.length)}</td>
    <td style="color:var(--muted);font-size:13px">${esc((t.schoolIds && t.schoolIds.length) ? t.schoolIds.join(', ') : t.schoolId)}</td>
  </tr>`;
}
