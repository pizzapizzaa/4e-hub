import { getPrograms } from '../api.js';
import type { LearningProgram } from '../types.js';

const SUBJECT_BADGE: Record<string, string> = {
  english: 'badge-green',
  maths:   'badge-orange',
  science: 'badge-gray',
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

  document.getElementById('add-prog-btn')?.addEventListener('click', () => {
    alert('New Program — connect to your API to enable this.');
  });
}

function programRow(p: LearningProgram): string {
  const subjectBadge = `<span class="badge ${SUBJECT_BADGE[p.subject] ?? 'badge-gray'}">${p.subject}</span>`;
  const statusBadge  = p.isActive
    ? '<span class="badge badge-green">Active</span>'
    : '<span class="badge badge-gray">Inactive</span>';
  const method = p.teachingMethod.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return `<tr data-id="${p.id}">
    <td style="font-weight:600">${p.name}</td>
    <td>${subjectBadge}</td>
    <td style="text-transform:capitalize">${p.level}</td>
    <td style="color:var(--muted);font-size:13px">${method}</td>
    <td>${p.schoolIds.length}</td>
    <td>${statusBadge}</td>
  </tr>`;
}
