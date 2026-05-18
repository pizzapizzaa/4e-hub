import { getSyncStatus, triggerSync } from '../api.js';
import { esc } from '../escape.js';
import { showToast } from '../main.js';

export async function renderSync(): Promise<void> {
  const content = document.getElementById('content')!;
  const status  = await getSyncStatus();

  const lastSync = status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never';

  content.innerHTML = `
    <div class="list-header mb-16">
      <h2>App Sync</h2>
    </div>
    <p class="mb-20 text-muted text-md">
      Sync data between 4E Admin, 4E Learn &amp; Play, and 4E In-Action.
    </p>

    <div class="sync-card">
      <h3>Status</h3>
      <div class="sync-row">
        <div class="sync-dot${status.isPending ? ' pending' : ''}"></div>
        <span>${status.isPending ? 'Sync in progress…' : 'All apps up to date'}</span>
      </div>
      <div class="mt-6 text-sm text-muted">Last synced: ${esc(lastSync)}</div>
      ${status.pendingChanges > 0 ? `<div class="mt-4 text-sm text-orange">${esc(status.pendingChanges)} pending change(s)</div>` : ''}
    </div>

    ${status.connectedApps.length ? `
      <div class="sync-card">
        <h3>Connected Apps</h3>
        ${status.connectedApps.map(a => `
          <div class="sync-row">
            <div class="sync-dot"></div>
            <span class="text-md">${esc(a)}</span>
          </div>`).join('')}
      </div>` : ''}

    <button class="btn btn-green btn-block mt-8" id="sync-btn">
      Trigger Manual Sync
    </button>`;

  const syncBtn = document.getElementById('sync-btn') as HTMLButtonElement;
  syncBtn.addEventListener('click', async () => {
    syncBtn.disabled   = true;
    syncBtn.textContent = 'Syncing…';
    try {
      await triggerSync();
      showToast('Sync complete — all apps are up to date.');
      renderSync(); // refresh view
    } catch {
      showToast('Sync failed. Please check your connection.');
      syncBtn.disabled   = false;
      syncBtn.textContent = 'Trigger Manual Sync';
    }
  });
}
