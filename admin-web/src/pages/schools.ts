import { createSchool, getCurrentUser, getSchools, updateSchool } from '../api.js';
import { esc } from '../escape.js';
import { showToast } from '../main.js';
import type { School } from '../types.js';

export async function renderSchools(): Promise<void> {
  const content = document.getElementById('content')!;
  const schools  = await getSchools();

  const currentUser = getCurrentUser();

  content.innerHTML = `
    <div class="list-header">
      <h2>Schools</h2>
      <button class="btn btn-green" id="add-school-btn">+ Add School</button>
    </div>
    ${schools.length === 0
      ? '<div class="empty">No schools registered yet.</div>'
      : `<div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Address</th>
                <th>Teachers</th>
                <th>Students</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              ${schools.map(s => schoolRow(s, currentUser)).join('')}
            </tbody>
          </table>
        </div>`
    }`;

  document.getElementById('add-school-btn')?.addEventListener('click', () => openAddSchoolModal(content));

  // Delegate edit button clicks
  const tableBody = content.querySelector('tbody');
  tableBody?.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    const btn = target.closest('button[data-action="edit"]') as HTMLButtonElement | null;
    if (!btn) return;
    const id = btn.dataset.id as string;
    const school = schools.find(s => s.id === id);
    if (!school) return;
    openEditSchoolModal(content, school);
  });
}

function openAddSchoolModal(content: HTMLElement): void {
  // Remove any existing modal
  document.getElementById('add-school-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'add-school-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="
      background:var(--card);border-radius:var(--radius);box-shadow:0 8px 32px rgba(0,0,0,.18);
      width:100%;max-width:420px;padding:32px 28px;position:relative;
    ">
      <h3 class="mb-20 text-lg fw-800">Add School</h3>
      <form id="add-school-form" novalidate>
          <label class="form-label" for="school-name">School Name *</label>
        <input id="school-name" type="text" required placeholder="e.g. Westfield Primary" class="form-input" />

          <label class="form-label" for="school-address">Address</label>
        <input id="school-address" type="text" placeholder="e.g. 12 Main Street, Lagos" class="form-input" />

          <label class="form-label" for="school-district">District ID *</label>
        <input id="school-district" type="text" required placeholder="e.g. district-lagos-01" class="form-input" />
          <p class="mb-20 text-sm text-muted">The district this school belongs to.</p>

          <div id="school-form-error" role="alert" class="mb-16 text-sm text-danger" style="display:none;background:#FEF2F2;border-radius:6px;padding:10px 12px"></div>

          <div class="d-flex gap-10 justify-end">
          <button type="button" id="cancel-school-btn" class="btn btn-muted">Cancel</button>
          <button type="submit" id="save-school-btn" class="btn btn-orange">Save School</button>
        </div>
      </form>
    </div>`;

  document.body.appendChild(modal);

  const form      = modal.querySelector<HTMLFormElement>('#add-school-form')!;
  const nameIn    = modal.querySelector<HTMLInputElement>('#school-name')!;
  const addrIn    = modal.querySelector<HTMLInputElement>('#school-address')!;
  const distIn    = modal.querySelector<HTMLInputElement>('#school-district')!;
  const errorBox  = modal.querySelector<HTMLDivElement>('#school-form-error')!;
  const saveBtn   = modal.querySelector<HTMLButtonElement>('#save-school-btn')!;

  // Close on backdrop click
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#cancel-school-btn')?.addEventListener('click', () => modal.remove());

  nameIn.focus();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name       = nameIn.value.trim();
    const address    = addrIn.value.trim();
    const districtId = distIn.value.trim();

    errorBox.style.display = 'none';

    if (!name) { showFieldError(errorBox, 'School name is required.'); return; }
    if (!districtId) { showFieldError(errorBox, 'District ID is required.'); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      await createSchool({ name, address, districtId });
      modal.remove();
      showToast('School added successfully');
      await renderSchools();
    } catch (err) {
      showFieldError(errorBox, err instanceof Error ? err.message : 'Failed to add school.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save School';
    }
  });
}

function openEditSchoolModal(content: HTMLElement, school: School): void {
  // Remove any existing modal
  document.getElementById('edit-school-modal')?.remove();

  const modal = document.createElement('div');
  modal.id = 'edit-school-modal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;
    display:flex;align-items:center;justify-content:center;padding:20px;
  `;
  modal.innerHTML = `
    <div style="
      background:var(--card);border-radius:var(--radius);box-shadow:0 8px 32px rgba(0,0,0,.18);
      width:100%;max-width:420px;padding:32px 28px;position:relative;
    ">
      <h3 class="mb-20 text-lg fw-800">Edit School</h3>
      <form id="edit-school-form" novalidate>
          <label class="form-label" for="school-name">School Name *</label>
        <input id="school-name" type="text" required placeholder="e.g. Westfield Primary" class="form-input" />

          <label class="form-label" for="school-address">Address</label>
        <input id="school-address" type="text" placeholder="e.g. 12 Main Street, Lagos" class="form-input" />

          <label class="form-label" for="school-district">District ID *</label>
        <input id="school-district" type="text" required placeholder="e.g. district-lagos-01" class="form-input" />
          <p class="mb-20 text-sm text-muted">The district this school belongs to.</p>

          <label class="form-label" for="school-active">Status</label>
        <select id="school-active" class="form-select">
          <option value="1">Active</option>
          <option value="0">Inactive</option>
        </select>

          <div id="school-form-error" role="alert" class="mb-16 text-sm text-danger" style="display:none;background:#FEF2F2;border-radius:6px;padding:10px 12px"></div>

          <div class="d-flex gap-10 justify-end">
          <button type="button" id="cancel-school-btn" class="btn btn-muted">Cancel</button>
          <button type="submit" id="save-school-btn" class="btn btn-orange">Save Changes</button>
        </div>
      </form>
    </div>`;

  document.body.appendChild(modal);

  const form      = modal.querySelector<HTMLFormElement>('#edit-school-form')!;
  const nameIn    = modal.querySelector<HTMLInputElement>('#school-name')!;
  const addrIn    = modal.querySelector<HTMLInputElement>('#school-address')!;
  const distIn    = modal.querySelector<HTMLInputElement>('#school-district')!;
  const activeSel = modal.querySelector<HTMLSelectElement>('#school-active')!;
  const errorBox  = modal.querySelector<HTMLDivElement>('#school-form-error')!;
  const saveBtn   = modal.querySelector<HTMLButtonElement>('#save-school-btn')!;

  // Prefill
  nameIn.value = school.name;
  addrIn.value = school.address ?? '';
  distIn.value = school.districtId ?? '';
  activeSel.value = school.isActive ? '1' : '0';

  // Close on backdrop click
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#cancel-school-btn')?.addEventListener('click', () => modal.remove());

  nameIn.focus();

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const name       = nameIn.value.trim();
    const address    = addrIn.value.trim();
    const districtId = distIn.value.trim();
    const isActive   = activeSel.value === '1';

    errorBox.style.display = 'none';

    if (!name) { showFieldError(errorBox, 'School name is required.'); return; }
    if (!districtId) { showFieldError(errorBox, 'District ID is required.'); return; }

    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving…';
    try {
      await updateSchool(school.id, { name, address, districtId, isActive });
      modal.remove();
      showToast('School updated successfully');
      await renderSchools();
    } catch (err) {
      showFieldError(errorBox, err instanceof Error ? err.message : 'Failed to update school.');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Changes';
    }
  });
}

function showFieldError(el: HTMLDivElement, msg: string): void {
  el.textContent = msg;
  el.style.display = 'block';
}

function schoolRow(s: School, currentUser: { email?: string; role?: string; userId?: string; schoolIds?: string[] } | null): string {
  const badge = s.isActive
    ? '<span class="badge badge-green">Active</span>'
    : '<span class="badge badge-gray">Inactive</span>';
  const canEdit = currentUser?.role === 'super_admin' || currentUser?.email === '4e-admin@proton.me';
  const editBtn = canEdit ? `<button class="btn" data-action="edit" data-id="${esc(s.id)}">Edit</button>` : '';
  return `<tr data-id="${esc(s.id)}">
    <td class="fw-700">${esc(s.name)}</td>
    <td class="text-muted">${esc(s.address)}</td>
    <td>${esc(s.teacherCount)}</td>
    <td>${esc(s.studentCount)}</td>
    <td>${badge}</td>
    <td>${editBtn}</td>
  </tr>`;
}
