import { getSyncStatus, triggerSync } from '../api.js';
import { showToast } from '../main.js';

export async function renderSync(): Promise<void> {
  const content = document.getElementById('content')!;
  const status  = await getSyncStatus();

  const lastSync = status.lastSyncedAt ? new Date(status.lastSyncedAt).toLocaleString() : 'Never';

  content.innerHTML = `
    <div class="list-header" style="margin-bottom:16px">
      <h2>App Sync</h2>
    </div>
    <p style="color:var(--muted);font-size:14px;margin-bottom:20px">
      Sync data between 4E Admin, 4E Learn &amp; Play, and 4E In-Action.
    </p>

    <div class="sync-card">
      <h3>Status</h3>
      <div class="sync-row">
        <div class="sync-dot${status.isPending ? ' pending' : ''}"></div>
        <span>${status.isPending ? 'Sync in progress…' : 'All apps up to date'}</span>
      </div>
      <div style="font-size:13px;color:var(--muted);margin-top:6px">Last synced: ${lastSync}</div>
      ${status.pendingChanges > 0 ? `<div style="font-size:13px;color:var(--orange);margin-top:4px">${status.pendingChanges} pending change(s)</div>` : ''}
    </div>

    ${status.connectedApps.length ? `
      <div class="sync-card">
        <h3>Connected Apps</h3>
        ${status.connectedApps.map(a => `
          <div class="sync-row">
            <div class="sync-dot"></div>
            <span style="font-size:15px">${a}</span>
          </div>`).join('')}
      </div>` : ''}

    <button class="btn btn-green" id="sync-btn" style="margin-top:8px;padding:14px 28px;font-size:15px;width:100%;max-width:320px">
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
