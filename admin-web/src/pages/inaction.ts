import { createMemoir, getBroadcastSessions, getClassStudents, getMemoirs, getTeacherClasses, getTeachers, startBroadcast } from '../api.js';
import { esc } from '../escape.js';
import type { Teacher } from '../types.js';

export async function renderInaction(): Promise<void> {
  const content = document.getElementById('content')!;
  const teachers = await getTeachers();

  content.innerHTML = `
    <div class="list-header">
      <h2>Teacher — In-Action (Web)</h2>
      <p style="color:var(--muted);margin-top:6px">Light scaffold of teacher tools: class roster, broadcast, memoir.</p>
    </div>
    ${teachers.length === 0
      ? '<div class="empty">No teachers found.</div>'
      : `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">
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
  return `<div class="card" style="padding:12px">
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:8px">
      <div style="width:44px;height:44px;border-radius:8px;background:var(--yellow);display:flex;align-items:center;justify-content:center;font-weight:700">
        ${esc(t.id.slice(8,12))}
      </div>
      <div>
        <div style="font-weight:700">Teacher ${esc(t.id.slice(8,12))}</div>
        <div style="color:var(--muted);font-size:13px">${esc(t.schoolId)}</div>
      </div>
    </div>
    <div style="display:flex;gap:8px;flex-wrap:wrap">
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
    <div style="display:flex;align-items:center;justify-content:space-between">
      <h2>Class roster — ${esc(teacher.id)}</h2>
      <div>
        <button id="back-btn" class="btn">Back</button>
        <button id="export-csv" class="btn" style="margin-left:8px">Export CSV</button>
      </div>
    </div>
    <div style="margin-top:12px">
      <label for="class-select">Select class</label>
      <select id="class-select" style="margin-left:8px">
        ${classes.map((c:any) => `<option value="${esc(c.id)}">${esc(c.name)}</option>`).join('')}
      </select>
    </div>
    <div id="roster-area" style="margin-top:12px"></div>
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
          <div style="margin-top:8px"><button id="save-att" class="btn btn-orange">Save attendance</button></div>
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
    <div style="display:flex;align-items:center;justify-content:space-between">
      <h2>Broadcast — ${esc(teacherId)}</h2>
      <button id="back-btn" class="btn">Back</button>
    </div>
    <div style="margin-top:12px">
      <p style="color:var(--muted)">Start a broadcast session to one of your classes.</p>
      <div style="margin-top:8px">
        <label for="bc-class">Class</label>
        <select id="bc-class" style="margin-left:8px"></select>
      </div>
      <label style="display:block;margin-top:8px">Message</label>
      <textarea id="bc-message" style="width:100%;height:90px;padding:8px;border:1px solid var(--border);border-radius:8px"></textarea>
      <div style="margin-top:10px">
        <button id="bc-start" class="btn btn-orange">Start broadcast</button>
      </div>
      <div id="bc-result" style="margin-top:12px"></div>
      <h3 style="margin-top:16px">Recent sessions</h3>
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
    <div style="display:flex;align-items:center;justify-content:space-between">
      <h2>Memoir — ${esc(teacherId)}</h2>
      <button id="back-btn" class="btn">Back</button>
    </div>
    <div style="margin-top:12px">
      <div style="display:flex;gap:8px;align-items:flex-start">
        <div style="flex:1">
          <label>New entry</label>
          <textarea id="memoir-note" style="width:100%;height:90px;padding:8px;border:1px solid var(--border);border-radius:8px"></textarea>
          <div style="margin-top:8px"><button id="memoir-add" class="btn btn-orange">Add entry</button></div>
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
    list.innerHTML = entries.length === 0 ? '<div class="empty">No entries</div>' : `<ul>${entries.map((e:any)=>`<li><strong>${esc(e.studentId ?? '—')}</strong>: ${esc(e.note)} <div style="color:var(--muted);font-size:12px">${esc(e.createdAt)}</div></li>`).join('')}</ul>`;
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
