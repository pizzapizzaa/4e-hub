import { createSchool, getSchools } from '../api.js';
import { esc } from '../escape.js';
import { showToast } from '../main.js';
import type { School } from '../types.js';

export async function renderSchools(): Promise<void> {
  const content = document.getElementById('content')!;
  const schools  = await getSchools();

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
              </tr>
            </thead>
            <tbody>
              ${schools.map(s => schoolRow(s)).join('')}
            </tbody>
          </table>
        </div>`
    }`;

  document.getElementById('add-school-btn')?.addEventListener('click', () => openAddSchoolModal(content));
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
      <h3 style="font-size:17px;font-weight:800;margin-bottom:20px">Add School</h3>
      <form id="add-school-form" novalidate>
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="school-name">School Name *</label>
        <input id="school-name" type="text" required placeholder="e.g. Westfield Primary"
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:14px;outline:none;box-sizing:border-box" />

        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="school-address">Address</label>
        <input id="school-address" type="text" placeholder="e.g. 12 Main Street, Lagos"
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:14px;outline:none;box-sizing:border-box" />

        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px" for="school-district">District ID *</label>
        <input id="school-district" type="text" required placeholder="e.g. district-lagos-01"
          style="width:100%;padding:10px 12px;border:1px solid var(--border);border-radius:8px;font-size:14px;margin-bottom:4px;outline:none;box-sizing:border-box" />
        <p style="font-size:12px;color:var(--muted);margin-bottom:20px">The district this school belongs to.</p>

        <div id="school-form-error" role="alert" style="display:none;background:#FEF2F2;color:#DC2626;border-radius:6px;padding:10px 12px;font-size:13px;margin-bottom:16px"></div>

        <div style="display:flex;gap:10px;justify-content:flex-end">
          <button type="button" id="cancel-school-btn" class="btn" style="background:#F3F4F6;color:#374151">Cancel</button>
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

function showFieldError(el: HTMLDivElement, msg: string): void {
  el.textContent = msg;
  el.style.display = 'block';
}

function schoolRow(s: School): string {
  const badge = s.isActive
    ? '<span class="badge badge-green">Active</span>'
    : '<span class="badge badge-gray">Inactive</span>';
  return `<tr data-id="${esc(s.id)}">
    <td style="font-weight:600">${esc(s.name)}</td>
    <td style="color:var(--muted)">${esc(s.address)}</td>
    <td>${esc(s.teacherCount)}</td>
    <td>${esc(s.studentCount)}</td>
    <td>${badge}</td>
  </tr>`;
}
