import { getLearners, getPrograms, getSchools, getSyncStatus, getTeachers } from '../api.js';

export async function renderDashboard(): Promise<void> {
  const content = document.getElementById('content')!;

  const [schools, programs, teachers, learners, sync] = await Promise.all([
    getSchools(), getPrograms(), getTeachers(), getLearners(), getSyncStatus(),
  ]);

  const lastSync = sync.lastSyncedAt ? new Date(sync.lastSyncedAt).toLocaleString() : 'Never';

  content.innerHTML = `
    <div class="list-header mb-24">
      <h2>4E Global Admin</h2>
    </div>

    <div class="stat-grid">
      <div class="stat-card stat-green">
        <div class="stat-icon text-green"><i class="ph ph-buildings"></i></div>
        <div class="stat-value text-green">${schools.length}</div>
        <div class="stat-label">Schools</div>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-icon text-orange"><i class="ph ph-books"></i></div>
        <div class="stat-value text-orange">${programs.length}</div>
        <div class="stat-label">Programs</div>
      </div>
      <div class="stat-card stat-yellow">
        <div class="stat-icon text-yellow"><i class="ph ph-chalkboard-teacher"></i></div>
        <div class="stat-value text-yellow">${teachers.length}</div>
        <div class="stat-label">Teachers</div>
        <button id="dashboard-create-teacher" class="btn btn-primary mt-8">Create</button>
      </div>
      <div class="stat-card stat-orange">
        <div class="stat-icon text-orange"><i class="ph ph-graduation-cap"></i></div>
        <div class="stat-value text-orange">${learners.length}</div>
        <div class="stat-label">Learners</div>
      </div>
    </div>

    <div class="sync-card">
      <h3>Sync Status</h3>
      <div class="sync-row">
        <div class="sync-dot${sync.isPending ? ' pending' : ''}"></div>
        <span class="text-md">${sync.isPending ? 'Sync in progress…' : 'All apps up to date'}</span>
      </div>
      <div class="mt-4 text-sm text-muted">Last synced: ${lastSync}</div>
      ${sync.connectedApps.length ? `
        <div class="mt-14 d-flex gap-8 flex-wrap">
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
