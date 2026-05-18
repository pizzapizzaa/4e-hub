import { createTeacher, generateOnboardingToken, getSchools, getTeachers, updateTeacher } from '../api.js';
import { esc } from '../escape.js';
import { showToast } from '../main.js';
import type { Teacher } from '../types.js';

export async function renderTeachers(): Promise<void> {
  const content  = document.getElementById('content')!;
  const teachers = await getTeachers();
  const schools = await getSchools();

  content.innerHTML = `
    <div class="list-header">
      <h2>Teachers</h2>
      <button id="create-teacher-btn" class="btn btn-primary ml-auto">Create Teacher</button>
    </div>
    <div id="create-teacher-form" class="form my-16" style="display:none">
      <div class="form-row">
        <div class="form-group">
          <input id="ct-fullname" class="form-input" placeholder="Full name" />
          <div id="ct-fullname-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <input id="ct-email" class="form-input" placeholder="Email" />
          <div id="ct-email-err" class="form-error"></div>
        </div>
        <div class="form-group">
          <input id="ct-password" class="form-input" placeholder="Onboarding password" type="password" />
          <div id="ct-password-err" class="form-error"></div>
        </div>
      </div>
      <div class="mt-8">
        <label class="form-label">Assign to schools (multi-select)</label>
        <select id="ct-schools" multiple class="form-select">
          ${schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
        </select>
      </div>
      <div class="form-actions">
        <button id="ct-submit" class="btn btn-green">Create</button>
        <button id="ct-cancel" class="btn" type="button">Cancel</button>
        <div id="ct-error" class="form-error mt-8"></div>
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
                    <th>Actions</th>
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
    .map(s => `<span class="badge badge-green mr-4">${esc(s)}</span>`)
    .join('');
  return `<tr data-id="${esc(t.id)}">
    <td>
      <div class="d-flex items-center gap-10">
        <div class="fw-700 text-sm" style="width:38px;height:38px;border-radius:50%;background:var(--yellow);display:flex;align-items:center;justify-content:center;flex-shrink:0">
          ${esc(t.id.slice(0, 2).toUpperCase())}
        </div>
        <span class="fw-700">Teacher ${esc(t.id.slice(8, 12))}</span>
      </div>
    </td>
    <td>${subjects}</td>
    <td>${esc(t.classIds.length)}</td>
    <td class="text-sm text-muted">${esc((t.schoolIds && t.schoolIds.length) ? t.schoolIds.join(', ') : t.schoolId)}</td>
    <td>
      <button class="btn" data-action="edit" data-id="${esc(t.id)}">Edit</button>
    </td>
  </tr>`;
}

  // Handle edit actions (modal-based editor)
  const table = content.querySelector('table.data-table tbody');
  if (table) {
    table.addEventListener('click', async (ev) => {
      const target = ev.target as HTMLElement;
      const btn = target.closest('button[data-action="edit"]') as HTMLButtonElement | null;
      if (!btn) return;
      const tid = btn.dataset.id as string;
      const teacher = teachers.find(t => t.id === tid);
      if (!teacher) return alert('Teacher not found');

      // Open modal
      openEditTeacherModal(teacher);
    });
  }

  function openEditTeacherModal(teacher: Teacher): void {
    document.getElementById('edit-teacher-modal')?.remove();
    const modal = document.createElement('div');
    modal.id = 'edit-teacher-modal';
    modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;';
    modal.innerHTML = `
      <div style="background:var(--card);border-radius:var(--radius);box-shadow:0 8px 32px rgba(0,0,0,.18);width:100%;max-width:520px;padding:24px;position:relative;">
        <h3 class="mb-12">Edit Teacher</h3>
        <form id="edit-teacher-form" novalidate>
          <label class="form-label" for="et-fullname">Full name</label>
          <input id="et-fullname" class="form-input" />

          <label class="form-label" for="et-email">Email</label>
          <input id="et-email" class="form-input" type="email" />

          <label class="form-label" for="et-subjects">Subject areas (comma separated)</label>
          <input id="et-subjects" class="form-input" />

          <label class="form-label" for="et-quals">Qualifications</label>
          <textarea id="et-quals" class="form-input" style="min-height:80px"></textarea>

          <label class="form-label" style="white-space:nowrap">Assign to schools (multi-select)</label>
          <select id="et-schools" multiple class="form-select">
            ${schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
          </select>

          <div id="et-error" class="form-error mt-8"></div>

          <div class="form-actions">
            <button type="submit" id="et-save" class="btn btn-green">Save</button>
            <button type="button" id="et-cancel" class="btn">Cancel</button>
          </div>
        </form>
      </div>`;
    document.body.appendChild(modal);

    const form = modal.querySelector<HTMLFormElement>('#edit-teacher-form')!;
    const nameIn = modal.querySelector<HTMLInputElement>('#et-fullname')!;
    const emailIn = modal.querySelector<HTMLInputElement>('#et-email')!;
    const subjectsIn = modal.querySelector<HTMLInputElement>('#et-subjects')!;
    const qualsIn = modal.querySelector<HTMLTextAreaElement>('#et-quals')!;
    const schoolsSel = modal.querySelector<HTMLSelectElement>('#et-schools')!;
    const errBox = modal.querySelector<HTMLDivElement>('#et-error')!;
    const cancelBtn = modal.querySelector<HTMLButtonElement>('#et-cancel')!;

    // Prefill
    nameIn.value = teacher.fullName ?? '';
    emailIn.value = teacher.email ?? '';
    subjectsIn.value = (teacher.subjectAreas || []).join(', ');
    qualsIn.value = teacher.qualifications ?? '';
    if (teacher.schoolIds && teacher.schoolIds.length) {
      for (const opt of Array.from(schoolsSel.options)) {
        if (teacher.schoolIds.includes(opt.value)) opt.selected = true;
      }
    } else if (teacher.schoolId) {
      for (const opt of Array.from(schoolsSel.options)) {
        if (opt.value === teacher.schoolId) opt.selected = true;
      }
    }

    // Close handlers
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
    cancelBtn.addEventListener('click', () => modal.remove());

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      errBox.textContent = '';
      const fullName = nameIn.value.trim();
      const email = emailIn.value.trim();
      const subjectAreas = subjectsIn.value.split(',').map(s => s.trim()).filter(Boolean);
      const qualifications = qualsIn.value.trim() === '' ? null : qualsIn.value.trim();
      const selectedSchoolIds = Array.from(schoolsSel.selectedOptions).map(o => o.value);

      const payload: any = { fullName, email, subjectAreas, qualifications, schoolIds: selectedSchoolIds };

      try {
        await updateTeacher(teacher.id, payload);
        modal.remove();
        showToast('Teacher updated');
        await renderTeachers();
      } catch (err) {
        errBox.textContent = err instanceof Error ? err.message : String(err);
      }
    });
  }
