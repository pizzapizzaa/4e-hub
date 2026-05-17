import { addTeacherMaterial, getCurrentUser, getMaterialsConfig, getSchools, getTeacherMaterials, updateMaterialsConfig } from '../api.js';
import { esc } from '../escape.js';
import { showToast } from '../main.js';
import type { MaterialsConfig } from '../types.js';

export async function renderMaterials(): Promise<void> {
  const content = document.getElementById('content')!;

  content.innerHTML = `
    <div class="list-header">
      <h2>Materials Config</h2>
    </div>
    <div id="mat-body" style="display:flex;flex-direction:column;gap:12px">
      <div class="card" style="padding:20px;color:var(--muted);text-align:center">Loading…</div>
    </div>`;

  const [schools] = await Promise.all([getSchools()]);
  const current = getCurrentUser();
  if (current?.role === 'teacher') {
    // Teacher view: list and add materials linked to their profile
    content.innerHTML = `
      <div class="list-header">
        <h2>My Materials</h2>
        <button class="btn btn-orange" id="add-material-btn">+ Add Material</button>
      </div>
      <div id="teacher-mat-list" style="margin-top:12px"></div>`;

    const listDiv = document.getElementById('teacher-mat-list')!;
    async function loadTeacherMaterials() {
      listDiv.innerHTML = '<div class="card" style="padding:20px;color:var(--muted);text-align:center">Loading…</div>';
      const mats = await getTeacherMaterials();
      if (mats.length === 0) { listDiv.innerHTML = '<div class="empty">No materials yet.</div>'; return; }
      listDiv.innerHTML = mats.map((m: any) => `
        <div class="card" style="padding:12px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">${esc(m.title)}</div>
              <div style="font-size:13px;color:var(--muted)">${esc(m.url)}</div>
            </div>
            <div style="font-size:12px;color:var(--muted)">${new Date(m.createdAt).toLocaleString()}</div>
          </div>
        </div>`).join('');
    }

    document.getElementById('add-material-btn')?.addEventListener('click', () => openAddMaterialModal());
    await loadTeacherMaterials();
    return;
  }
  if (schools.length === 0) {
    document.getElementById('mat-body')!.innerHTML =
      '<div class="empty">No schools registered yet.</div>';
    return;
  }

  // School selector + config panel
  const body = document.getElementById('mat-body')!;
  body.innerHTML = `
    <div class="card" style="padding:20px;display:flex;align-items:center;gap:12px">
      <label style="font-weight:600;white-space:nowrap">School</label>
      <select id="school-select" style="flex:1;padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;font-size:14px">
        ${schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
      </select>
    </div>
    <div id="mat-config"></div>`;

  async function loadConfig(schoolId: string): Promise<void> {
    const panel = document.getElementById('mat-config')!;
    panel.innerHTML = `<div class="card" style="padding:20px;color:var(--muted);text-align:center">Loading config…</div>`;
    const cfg = await getMaterialsConfig(schoolId);
    panel.innerHTML = configHtml(schoolId, cfg);
    bindSave(schoolId, cfg);
  }

  const sel = document.getElementById('school-select') as HTMLSelectElement;
  sel.addEventListener('change', () => loadConfig(sel.value));
  await loadConfig(schools[0].id);
}

// ── HTML builder ───────────────────────────────────────────────────────────────

function configHtml(schoolId: string, cfg: MaterialsConfig): string {
  return `
    <form id="mat-form" data-school="${schoolId}" style="display:flex;flex-direction:column;gap:12px">

      ${providerCard({
        id:      'khan',
        label:   'Khan Academy',
        icon:    'ph-student',
        color:   '#16A34A',
        enabled: cfg.khanAcademy.enabled,
        ids:     cfg.khanAcademy.courseIds,
        placeholder: 'e.g. khan-math-101',
        idLabel: 'Course IDs',
      })}

      ${providerCard({
        id:      'edx',
        label:   'Open edX',
        icon:    'ph-monitor-play',
        color:   '#F97316',
        enabled: cfg.openEdx.enabled,
        ids:     cfg.openEdx.courseIds,
        placeholder: 'e.g. course-v1:Org+Course+Run',
        idLabel: 'Course IDs',
      })}

      ${providerCard({
        id:      'yt',
        label:   'YouTube',
        icon:    'ph-youtube-logo',
        color:   '#EF4444',
        enabled: cfg.youtube.enabled,
        ids:     cfg.youtube.playlistIds,
        placeholder: 'e.g. PLexample123',
        idLabel: 'Playlist IDs',
      })}

      <div style="display:flex;justify-content:flex-end">
        <button type="submit" class="btn btn-green" id="mat-save-btn">
          <i class="ph ph-floppy-disk"></i>&nbsp; Save Changes
        </button>
      </div>
    </form>`;
}

interface ProviderCardOpts {
  id: string;
  label: string;
  icon: string;
  color: string;
  enabled: boolean;
  ids: string[];
  placeholder: string;
  idLabel: string;
}

function providerCard(o: ProviderCardOpts): string {
  return `
    <div class="card" style="padding:20px">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:14px">
        <span style="font-size:24px;color:${o.color}"><i class="ph ${o.icon}"></i></span>
        <span style="font-size:16px;font-weight:600">${o.label}</span>
        <label style="margin-left:auto;display:flex;align-items:center;gap:6px;font-size:14px;cursor:pointer">
          <input type="checkbox" id="${o.id}-enabled" ${o.enabled ? 'checked' : ''}
            style="width:16px;height:16px;accent-color:${o.color}">
          Enabled
        </label>
      </div>
      <label style="font-size:13px;font-weight:600;color:var(--muted);display:block;margin-bottom:6px">
        ${o.idLabel} <span style="font-weight:400">(one per line)</span>
      </label>
      <textarea id="${o.id}-ids"
        style="width:100%;box-sizing:border-box;padding:8px 10px;border:1px solid #E2E8F0;border-radius:6px;
               font-family:monospace;font-size:13px;resize:vertical;min-height:72px"
        placeholder="${o.placeholder}"
      >${o.ids.join('\n')}</textarea>
    </div>`;
}

// ── Save handler ───────────────────────────────────────────────────────────────

function bindSave(schoolId: string, _original: MaterialsConfig): void {
  const form = document.getElementById('mat-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('mat-save-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Saving…';

    function ids(id: string): string[] {
      return (document.getElementById(id) as HTMLTextAreaElement).value
        .split('\n').map(s => s.trim()).filter(Boolean);
    }
    function checked(id: string): boolean {
      return (document.getElementById(id) as HTMLInputElement).checked;
    }

    const cfg: MaterialsConfig = {
      khanAcademy: { enabled: checked('khan-enabled'), courseIds:   ids('khan-ids') },
      openEdx:     { enabled: checked('edx-enabled'),  courseIds:   ids('edx-ids')  },
      youtube:     { enabled: checked('yt-enabled'),   playlistIds: ids('yt-ids')   },
    };

    try {
      await updateMaterialsConfig(schoolId, cfg);
      showToast('Materials config saved');
    } catch {
      showToast('Save failed — check your API connection');
    } finally {
      btn.disabled = false;
      btn.innerHTML = '<i class="ph ph-floppy-disk"></i>&nbsp; Save Changes';
    }
  });
}

function openAddMaterialModal(): void {
  document.getElementById('add-material-modal')?.remove();
  const modal = document.createElement('div');
  modal.id = 'add-material-modal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,.45);z-index:900;display:flex;align-items:center;justify-content:center;padding:20px;`;
  modal.innerHTML = `
    <div style="background:var(--card);border-radius:var(--radius);box-shadow:0 8px 32px rgba(0,0,0,.18);width:100%;max-width:520px;padding:24px">
      <h3 style="font-size:17px;font-weight:800;margin-bottom:12px">Add Material</h3>
      <form id="add-material-form">
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">Title</label>
        <input id="mat-title" style="width:100%;padding:8px;margin-bottom:10px" />
        <label style="display:block;font-size:13px;font-weight:600;margin-bottom:6px">PDF URL or public link</label>
        <input id="mat-url" style="width:100%;padding:8px;margin-bottom:10px" />
        <div style="display:flex;justify-content:flex-end;gap:8px"><button type="button" id="mat-cancel" class="btn">Cancel</button><button type="submit" class="btn btn-orange">Add</button></div>
      </form>
    </div>`;
  document.body.appendChild(modal);
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  modal.querySelector('#mat-cancel')?.addEventListener('click', () => modal.remove());
  const form = modal.querySelector('#add-material-form') as HTMLFormElement;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const title = (modal.querySelector('#mat-title') as HTMLInputElement).value.trim();
    const url = (modal.querySelector('#mat-url') as HTMLInputElement).value.trim();
    if (!title || !url) { alert('Title and URL required'); return; }
    try {
      await addTeacherMaterial({ title, url, type: 'link' });
      modal.remove();
      // refresh materials list
      const listDiv = document.getElementById('teacher-mat-list')!;
      listDiv.innerHTML = '<div class="card" style="padding:20px;color:var(--muted);text-align:center">Loading…</div>';
      const mats = await getTeacherMaterials();
      listDiv.innerHTML = mats.length === 0 ? '<div class="empty">No materials yet.</div>' : mats.map((m: any) => `
        <div class="card" style="padding:12px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div>
              <div style="font-weight:600">${esc(m.title)}</div>
              <div style="font-size:13px;color:var(--muted)">${esc(m.url)}</div>
            </div>
            <div style="font-size:12px;color:var(--muted)">${new Date(m.createdAt).toLocaleString()}</div>
          </div>
        </div>`).join('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add material');
    }
  });
}
