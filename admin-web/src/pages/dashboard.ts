import { getLearners, getPrograms, getSchools, getSyncStatus, getTeachers } from '../api.js';

export async function renderDashboard(): Promise<void> {
  const content = document.getElementById('content')!;

  const [schools, programs, teachers, learners, sync] = await Promise.all([
    getSchools(), getPrograms(), getTeachers(), getLearners(), getSyncStatus(),
  ]);

  const lastSync = sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleString() : 'Never';

  content.innerHTML = `
    <div class="list-header" style="margin-bottom:24px">
      <h2>4E Global Admin</h2>
    </div>

    <div class="stat-grid">
      <div class="stat-card" style="border-top-color:#16A34A">
        <div class="stat-icon" style="color:#16A34A"><i class="ph ph-buildings"></i></div>
        <div class="stat-value" style="color:#16A34A">${schools.length}</div>
        <div class="stat-label">Schools</div>
      </div>
      <div class="stat-card" style="border-top-color:#F97316">
        <div class="stat-icon" style="color:#F97316"><i class="ph ph-books"></i></div>
        <div class="stat-value" style="color:#F97316">${programs.length}</div>
        <div class="stat-label">Programs</div>
      </div>
      <div class="stat-card" style="border-top-color:#FACC15">
        <div class="stat-icon" style="color:#FACC15"><i class="ph ph-chalkboard-teacher"></i></div>
        <div class="stat-value" style="color:#FACC15">${teachers.length}</div>
        <div class="stat-label">Teachers</div>
        <button id="dashboard-create-teacher" class="btn" style="margin-top:8px">Create</button>
      </div>
      <div class="stat-card" style="border-top-color:#F97316">
        <div class="stat-icon" style="color:#F97316"><i class="ph ph-graduation-cap"></i></div>
        <div class="stat-value" style="color:#F97316">${learners.length}</div>
        <div class="stat-label">Learners</div>
      </div>
    </div>

    <div class="sync-card">
      <h3>Sync Status</h3>
      <div class="sync-row">
        <div class="sync-dot${sync.isPending ? ' pending' : ''}"></div>
        <span style="font-size:14px">${sync.isPending ? 'Sync in progress…' : 'All apps up to date'}</span>
      </div>
      <div style="font-size:13px;color:var(--muted);margin-top:4px">Last synced: ${lastSync}</div>
      ${sync.connectedApps.length ? `
        <div style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap">
          ${sync.connectedApps.map(a => `<span class="badge badge-green">${a}</span>`).join('')}
        </div>` : ''}
    </div>`;

  // Dashboard create teacher button behavior: set flag and navigate to Teachers
  const dashCreate = document.getElementById('dashboard-create-teacher');
  if (dashCreate) {
    dashCreate.addEventListener('click', () => {
      try { sessionStorage.setItem('open_create_teacher', '1'); } catch {}
      // find sidebar nav button for Teachers and click it
      const sidebarBtn = Array.from(document.querySelectorAll('#sidebar-nav button')).find(b => (b.textContent || '').trim().startsWith('Teachers')) as HTMLButtonElement | undefined;
      if (sidebarBtn) sidebarBtn.click();
      else location.hash = '#teachers';
    });
  }
}
