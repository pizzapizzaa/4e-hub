import { getTeachers } from '../api.js';
import type { Teacher } from '../types.js';

export async function renderTeachers(): Promise<void> {
  const content  = document.getElementById('content')!;
  const teachers = await getTeachers();

  content.innerHTML = `
    <div class="list-header">
      <h2>Teachers</h2>
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
}

function teacherRow(t: Teacher): string {
  const subjects = t.subjectAreas
    .map(s => `<span class="badge badge-green" style="margin-right:4px">${s}</span>`)
    .join('');
  return `<tr data-id="${t.id}">
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;flex-shrink:0">
          ${t.id.slice(0, 2).toUpperCase()}
        </div>
        <span style="font-weight:600">Teacher ${t.id.slice(8, 12)}</span>
      </div>
    </td>
    <td>${subjects}</td>
    <td>${t.classIds.length}</td>
    <td style="color:var(--muted);font-size:13px">${t.schoolId}</td>
  </tr>`;
}
