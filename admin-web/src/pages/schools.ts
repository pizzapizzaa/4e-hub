import { getSchools } from '../api.js';
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

  document.getElementById('add-school-btn')?.addEventListener('click', () => {
    alert('Add School — connect to your API to enable this.');
  });
}

function schoolRow(s: School): string {
  const badge = s.isActive
    ? '<span class="badge badge-green">Active</span>'
    : '<span class="badge badge-gray">Inactive</span>';
  return `<tr data-id="${s.id}">
    <td style="font-weight:600">${s.name}</td>
    <td style="color:var(--muted)">${s.address}</td>
    <td>${s.teacherCount}</td>
    <td>${s.studentCount}</td>
    <td>${badge}</td>
  </tr>`;
}
