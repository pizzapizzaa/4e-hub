import { createProgram, createProgramWithSchools, getCurrentUser, getPrograms, getSchools } from '../api.js';
import { esc } from '../escape.js';
import { showToast } from '../main.js';
import type { LearningProgram } from '../types.js';

const SUBJECT_BADGE: Record<string, string> = {
  english:    'badge-green',
  maths:      'badge-orange',
  science:    'badge-gray',
  bouldering: 'badge-blue',
};

export async function renderPrograms(): Promise<void> {
  const content  = document.getElementById('content')!;
  const programs = await getPrograms();

  content.innerHTML = `
    <div class="list-header">
      <h2>Learning Programs</h2>
      <button class="btn btn-orange" id="add-prog-btn">+ New Program</button>
    </div>
    ${programs.length === 0
      ? '<div class="empty">No programs yet. Add one to get started.</div>'
      : `<div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Subject</th>
                <th>Level</th>
                <th>Method</th>
                <th>Schools</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${programs.map(p => programRow(p)).join('')}
            </tbody>
          </table>
        </div>`
    }`;

  document.getElementById('add-prog-btn')?.addEventListener('click', () => openAddProgramModal());
}

function openAddProgramModal(): void {
  document.getElementById('add-program-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'add-program-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="
      background:var(--card);border-radius:var(--radius);box-shadow:0 8px 32px rgba(0,0,0,.18);
      width:100%;max-width:460px;padding:32px 28px;position:relative;max-height:90dvh;overflow-y:auto;
    ">
      <h3 style="font-size:17px;font-weight:800;margin-bottom:20px">New Program</h3>
      <form id="add-program-form" novalidate>
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="prog-name">Program Name *</label>
        <input id="prog-name" type="text" required placeholder="e.g. Foundation English"
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:14px;outline:none;box-sizing:border-box" />

        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="prog-subject">Subject *</label>
        <select id="prog-subject" required
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:14px;outline:none;box-sizing:border-box;background:#fff">
          <option value="">Select subject…</option>
          <option value="english">English</option>
          <option value="maths">Maths</option>
          <option value="science">Science</option>
          <option value="bouldering">Bouldering</option>
        </select>

        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="prog-level">Level *</label>
        <input id="prog-level" type="text" required placeholder="e.g. beginner, intermediate, JSS1"
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:14px;outline:none;box-sizing:border-box" />

        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="prog-method">Teaching Method *</label>
        <select id="prog-method" required
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:14px;outline:none;box-sizing:border-box;background:#fff">
          <option value="">Select method…</option>
          <option value="direct_instruction">Direct Instruction</option>
          <option value="inquiry_based">Inquiry Based</option>
          <option value="flipped_classroom">Flipped Classroom</option>
          <option value="blended">Blended</option>
        </select>

        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="prog-desc">Description</label>
        <textarea id="prog-desc" rows="3" placeholder="Brief description of the program…"
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:20px;outline:none;box-sizing:border-box;resize:vertical"></textarea>

        <div id="prog-schools-wrap" style="margin-bottom:12px;display:none">
          <label style="font-size:13px">Link to schools (multi-select)</label><br />
          <select id="prog-schools" multiple style="width:100%;min-height:80px;margin-top:6px"></select>
        </div>

        <div id="prog-form-error" role="alert" style="display:none;background:#FEF2F2;color:#DC2626;border-radius:6px;padding:10px 12px;font-size:13px;margin-bottom:16px"></div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button type="button" id="cancel-prog-btn" class="btn" style="background:#F3F4F6;color:#374151">Cancel</button>
          <button type="submit" id="save-prog-btn" class="btn btn-orange">Save Program</button>
        </div>
      </form>
    </div>`;

  document.body.appendChild(modal);

  const form     = modal.querySelector<HTMLFormElement>('#add-program-form')!;
  const nameIn   = modal.querySelector<HTMLInputElement>('#prog-name')!;
  const subjIn   = modal.querySelector<HTMLSelectElement>('#prog-subject')!;
  const levelIn  = modal.querySelector<HTMLInputElement>('#prog-level')!;
  const methodIn = modal.querySelector<HTMLSelectElement>('#prog-method')!;
  const descIn   = modal.querySelector<HTMLTextAreaElement>('#prog-desc')!;
  const errorBox = modal.querySelector<HTMLDivElement>('#prog-form-error')!;
  const saveBtn  = modal.querySelector<HTMLButtonElement>('#save-prog-btn')!;

  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#cancel-prog-btn')?.addEventListener('click', () => modal.remove());
  nameIn.focus();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    errorBox.style.display = 'none';
    const name           = nameIn.value.trim();
    const subject        = subjIn.value;
    const level          = levelIn.value.trim();
    const teachingMethod = methodIn.value;
    const description    = descIn.value.trim();

    if (!name)           { showFieldError(errorBox, 'Program name is required.'); return; }
    if (!subject)        { showFieldError(errorBox, 'Please select a subject.'); return; }
    if (!level)          { showFieldError(errorBox, 'Level is required.'); return; }
    if (!teachingMethod) { showFieldError(errorBox, 'Please select a teaching method.'); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      const current = getCurrentUser();
      if (current?.role === 'teacher') {
        const sel = modal.querySelector<HTMLSelectElement>('#prog-schools')!;
        const schoolIds = Array.from(sel.selectedOptions).map(o => o.value);
        await createProgramWithSchools({ name, subject, level, description, teachingMethod, schoolIds });
      } else {
        await createProgram({ name, subject, level, description, teachingMethod });
      }
      modal.remove();
      showToast('Program created successfully');
      await renderPrograms();
    } catch (err) {
      showFieldError(errorBox, err instanceof Error ? err.message : 'Failed to create program.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Program';
    }
  });

  // If teacher, show schools multi-select populated with their schools
  (async () => {
    const current = getCurrentUser();
    if (current?.role === 'teacher') {
      const schools = await getSchools();
      const sel = modal.querySelector<HTMLSelectElement>('#prog-schools')!;
      sel.innerHTML = schools
        .filter(s => (current.schoolIds ?? []).includes(s.id))
        .map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`)
        .join('');
      (document.getElementById('prog-schools-wrap') as HTMLElement).style.display = 'block';
    }
  })();
}

function showFieldError(el: HTMLDivElement, msg: string): void {
  el.textContent = msg;
  el.style.display = 'block';
}

function programRow(p: LearningProgram): string {
  const subjectBadge = `<span class="badge ${esc(SUBJECT_BADGE[p.subject] ?? 'badge-gray')}">${esc(p.subject)}</span>`;
  const statusBadge  = p.isActive
    ? '<span class="badge badge-green">Active</span>'
    : '<span class="badge badge-gray">Inactive</span>';
  const method = esc(p.teachingMethod.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
  return `<tr data-id="${esc(p.id)}">
    <td style="font-weight:600">${esc(p.name)}</td>
    <td>${subjectBadge}</td>
    <td style="text-transform:capitalize">${esc(p.level)}</td>
    <td style="color:var(--muted);font-size:13px">${method}</td>
    <td>${esc(p.schoolIds.length)}</td>
    <td>${statusBadge}</td>
  </tr>`;
}
