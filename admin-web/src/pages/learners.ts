import { getLearners } from '../api.js';
import { esc } from '../escape.js';
import type { Student } from '../types.js';

export async function renderLearners(): Promise<void> {
  const content  = document.getElementById('content')!;
  const learners = await getLearners();

  content.innerHTML = `
    <div class="list-header">
      <h2>Learners</h2>
    </div>
    ${learners.length === 0
      ? '<div class="empty">No learners found.</div>'
      : `<div style="overflow-x:auto">
          <table class="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>School</th>
                <th>Classes</th>
                <th>Grad Year</th>
              </tr>
            </thead>
            <tbody>
              ${learners.map(l => learnerRow(l)).join('')}
            </tbody>
          </table>
        </div>`
    }`;
}

function learnerRow(l: Student): string {
  return `<tr data-id="${esc(l.id)}">
    <td>
      <div style="display:flex;align-items:center;gap:10px">
        <div style="width:38px;height:38px;border-radius:50%;background:var(--orange);display:flex;align-items:center;justify-content:center;font-weight:700;font-size:12px;color:#fff;flex-shrink:0">
          ${esc(l.graduationYear)}
        </div>
        <span style="font-weight:600">Student ${esc(l.id.slice(8, 12))}</span>
      </div>
    </td>
    <td style="color:var(--muted);font-size:13px">${esc(l.schoolId)}</td>
    <td>${esc(l.classIds.length)}</td>
    <td><span class="badge badge-orange">${esc(l.graduationYear)}</span></td>
  </tr>`;
}
