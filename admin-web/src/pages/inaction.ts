import { createMemoir, getBroadcastSessions, getClassStudents, getMemoirs, getTeacherClasses, getTeachers, startBroadcast } from '../api.js';
import { esc } from '../escape.js';
import type { Teacher } from '../types.js';

export async function renderInaction(): Promise<void> {
  const content = document.getElementById('content')!;
  const teachers = await getTeachers();

  content.innerHTML = `
    <div class="list-header">
      <h2>Teacher — In-Action (Web)</h2>
      <p class="mt-6 text-muted">Light scaffold of teacher tools: class roster, broadcast, memoir.</p>
    </div>
    ${teachers.length === 0
      ? '<div class="empty">No teachers found.</div>'
      : `<div class="d-grid gap-12" style="grid-template-columns:repeat(auto-fit,minmax(260px,1fr));">
          ${teachers.map(t => teacherCard(t)).join('')}
        </div>`
    }
  `;

  // Attach event handlers
  content.querySelectorAll('.inaction-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      const el = e.currentTarget as HTMLElement;
      const teacherId = el.getAttribute('data-teacher')!;
      const action = el.getAttribute('data-action')!;
      if (action === 'roster') await showRoster(content, teacherId);
      if (action === 'broadcast') showBroadcast(content, teacherId);
      if (action === 'memoir') showMemoir(content, teacherId);
    });
  });
}

function teacherCard(t: Teacher): string {
  return `<div class="card p-12">
    <div class="d-flex items-center gap-12 mb-8">
      <div class="fw-700" style="width:44px;height:44px;border-radius:8px;background:var(--yellow);display:flex;align-items:center;justify-content:center">
        ${esc(t.id.slice(8,12))}
      </div>
      <div>
        <div class="fw-700">Teacher ${esc(t.id.slice(8,12))}</div>
        <div class="text-sm text-muted">${esc(t.schoolId)}</div>
      </div>
    </div>
    <div class="d-flex gap-8 flex-wrap">
      <button class="btn inaction-btn" data-teacher="${esc(t.id)}" data-action="roster">Class roster</button>
      <button class="btn inaction-btn" data-teacher="${esc(t.id)}" data-action="broadcast">Broadcast</button>
      <button class="btn inaction-btn" data-teacher="${esc(t.id)}" data-action="memoir">Memoir</button>
    </div>
  </div>`;
}

async function showRoster(root: HTMLElement, teacherId: string): Promise<void> {
  const teachers = await getTeachers();
  const teacher = teachers.find(t => t.id === teacherId)!;
  const classes = await getTeacherClasses(teacherId);

  root.innerHTML = `
    <div class="d-flex items-center justify-between">
      <h2>Class roster — ${esc(teacher.id)}</h2>
      <div>
        <button id="back-btn" class="btn">Back</button>
        <button id="export-csv" class="btn ml-8">Export CSV</button>
      </div>
    </div>
    <div class="mt-12">
      <label for="class-select">Select class</label>
      <select id="class-select" class="ml-8">
        ${classes.map((c:any) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
      </select>
    </div>
    <div id="roster-area" class="mt-12"></div>
  `;

  document.getElementById('back-btn')!.addEventListener('click', async () => renderInaction());
  const classSelect = document.getElementById('class-select') as HTMLSelectElement;
  const rosterArea = document.getElementById('roster-area')!;

  async function loadForClass(classId: string) {
    const students = await getClassStudents(classId);
    rosterArea.innerHTML = students.length === 0
      ? '<div class="empty">No students found for this class.</div>'
      : `<div style="overflow-x:auto">
          <table class="data-table">
            <thead><tr><th>Present</th><th>ID</th><th>Classes</th></tr></thead>
            <tbody>
              ${students.map(s => `<tr data-id="${esc(s.id)}"><td><input type="checkbox" class="att-checkbox" data-student="${esc(s.id)}" checked></td><td>${esc(s.id)}</td><td>${esc(s.classIds.join(', '))}</td></tr>`).join('')}
            </tbody>
          </table>
          <div class="mt-8"><button id="save-att" class="btn btn-orange">Save attendance</button></div>
        </div>`;

    document.getElementById('save-att')!.addEventListener('click', () => {
      const checked = Array.from(rosterArea.querySelectorAll<HTMLInputElement>('.att-checkbox')).filter(i => i.checked).map(i => i.getAttribute('data-student'));
      const msg = `Saved attendance — present: ${checked.length}`;
      const toast = document.createElement('div'); toast.textContent = msg; toast.className = 'toast'; rosterArea.appendChild(toast);
      setTimeout(() => toast.remove(), 2500);
    });
  }

  classSelect.addEventListener('change', () => loadForClass(classSelect.value));
  // load initial
  if (classSelect.value) await loadForClass(classSelect.value);
  document.getElementById('export-csv')!.addEventListener('click', () => {
    const rows = Array.from((rosterArea.querySelectorAll('tbody tr') || [])).map((tr: any) => {
      const id = tr.querySelector('td:nth-child(2)')?.textContent?.trim() ?? '';
      const classes = tr.querySelector('td:nth-child(3)')?.textContent?.trim() ?? '';
      return `${id},"${classes.replace(/"/g,'""')}"`;
    });
    const csv = ['id,classes', ...rows].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    const a = document.createElement('a'); a.href = url; a.download = `${teacherId}-roster.csv`; a.click(); URL.revokeObjectURL(url);
  });
}

function showBroadcast(root: HTMLElement, teacherId: string): void {
  root.innerHTML = `
    <div class="d-flex items-center justify-between">
      <h2>Broadcast — ${esc(teacherId)}</h2>
      <button id="back-btn" class="btn">Back</button>
    </div>
    <div class="mt-12">
      <p class="text-muted">Start a broadcast session to one of your classes.</p>
      <div class="mt-8">
        <label for="bc-class">Class</label>
        <select id="bc-class" class="ml-8"></select>
      </div>
      <label style="display:block" class="mt-8">Message</label>
      <textarea id="bc-message" class="form-input" style="height:90px"></textarea>
      <div class="mt-10">
        <button id="bc-start" class="btn btn-orange">Start broadcast</button>
      </div>
      <div id="bc-result" class="mt-12"></div>
      <h3 class="mt-16">Recent sessions</h3>
      <div id="bc-sessions"></div>
    </div>
  `;

  document.getElementById('back-btn')!.addEventListener('click', async () => renderInaction());

  (async () => {
    const classes = await getTeacherClasses(teacherId);
    const sel = document.getElementById('bc-class') as HTMLSelectElement;
    sel.innerHTML = classes.map((c:any) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('');

    async function refreshSessions() {
      const sessions = await getBroadcastSessions(teacherId);
      const wrap = document.getElementById('bc-sessions')!;
      wrap.innerHTML = sessions.length === 0 ? '<div class="empty">No sessions</div>' : `<ul>${sessions.map((s:any)=>`<li>${esc(s.id)} — ${esc(s.classId)} — ${esc(s.message)}</li>`).join('')}</ul>`;
    }

    document.getElementById('bc-start')!.addEventListener('click', async () => {
      const classId = (document.getElementById('bc-class') as HTMLSelectElement).value;
      const msg = (document.getElementById('bc-message') as HTMLTextAreaElement).value.trim();
      if (!msg) { (document.getElementById('bc-result')!).textContent = 'Enter a message.'; return; }
      const res = await startBroadcast(classId, msg);
      (document.getElementById('bc-result')!).textContent = `Started ${res.id} for ${res.classId}`;
      await refreshSessions();
    });

    await refreshSessions();
  })();
}

function showMemoir(root: HTMLElement, teacherId: string): void {
  root.innerHTML = `
    <div class="d-flex items-center justify-between">
      <h2>Memoir — ${esc(teacherId)}</h2>
      <button id="back-btn" class="btn">Back</button>
    </div>
    <div class="mt-12">
      <div class="d-flex gap-8">
        <div class="flex-1">
          <label>New entry</label>
          <textarea id="memoir-note" class="form-input" style="height:90px"></textarea>
          <div class="mt-8"><button id="memoir-add" class="btn btn-orange">Add entry</button></div>
        </div>
        <div style="width:360px">
          <h4>Recent entries</h4>
          <div id="memoir-list"></div>
        </div>
      </div>
    </div>
  `;
  document.getElementById('back-btn')!.addEventListener('click', async () => renderInaction());

  async function refresh() {
    const list = document.getElementById('memoir-list')!;
    const entries = await getMemoirs(teacherId);
    list.innerHTML = entries.length === 0 ? '<div class="empty">No entries</div>' : `<ul>${entries.map((e:any)=>`<li><strong>${esc(e.studentId ?? '—')}</strong>: ${esc(e.note)} <div class="text-xs text-muted">${esc(e.createdAt)}</div></li>`).join('')}</ul>`;
  }

  document.getElementById('memoir-add')!.addEventListener('click', async () => {
    const note = (document.getElementById('memoir-note') as HTMLTextAreaElement).value.trim();
    if (!note) return;
    await createMemoir({ teacherId, note });
    (document.getElementById('memoir-note') as HTMLTextAreaElement).value = '';
    await refresh();
  });

  refresh();
}
