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
    <div id="mat-body" class="d-flex flex-col gap-12">
      <div class="card p-20 text-muted text-center">Loading…</div>
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
      <div id="teacher-mat-list" class="mt-12"></div>`;

    const listDiv = document.getElementById('teacher-mat-list')!;
    async function loadTeacherMaterials() {
      listDiv.innerHTML = '<div class="card p-20 text-muted text-center">Loading…</div>';
      const mats = await getTeacherMaterials();
      if (mats.length === 0) { listDiv.innerHTML = '<div class="empty">No materials yet.</div>'; return; }
      listDiv.innerHTML = mats.map((m: any) => `
        <div class="card p-12 mb-8">
          <div class="d-flex" style="justify-content:space-between;align-items:center">
            <div>
              <div class="fw-700">${esc(m.title)}</div>
              <div class="text-sm text-muted">${esc(m.url)}</div>
            </div>
            <div class="text-xs text-muted">${new Date(m.createdAt).toLocaleString()}</div>
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
    <div class="card p-20 d-flex items-center gap-12">
      <label class="form-label" style="white-space:nowrap">School</label>
      <select id="school-select" class="form-select" style="flex:1">
        ${schools.map(s => `<option value="${esc(s.id)}">${esc(s.name)}</option>`).join('')}
      </select>
    </div>
    <div id="mat-config"></div>`;

  async function loadConfig(schoolId: string): Promise<void> {
    const panel = document.getElementById('mat-config')!;
    panel.innerHTML = `<div class="card p-20 text-muted text-center">Loading config…</div>`;
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
    <form id="mat-form" data-school="${schoolId}" class="d-flex flex-col gap-12">

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

      <div class="d-flex justify-end">
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
    <div class="card p-20">
      <div class="d-flex items-center gap-10 mb-14">
        <span class="text-lg" style="color:${o.color}"><i class="ph ${o.icon}"></i></span>
        <span class="text-md fw-700">${o.label}</span>
        <label class="ml-auto d-flex items-center gap-6 text-sm" style="cursor:pointer">
          <input type="checkbox" id="${o.id}-enabled" ${o.enabled ? 'checked' : ''}
            style="width:16px;height:16px;accent-color:${o.color}">
          Enabled
        </label>
      </div>
      <label class="form-label">
        ${o.idLabel} <span>(one per line)</span>
      </label>
      <textarea id="${o.id}-ids" class="form-input font-mono" style="min-height:72px" placeholder="${o.placeholder}">${o.ids.join('\n')}</textarea>
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
    <div class="card p-24" style="width:100%;max-width:520px">
      <h3 class="mb-12">Add Material</h3>
      <form id="add-material-form">
        <label class="form-label">Title</label>
        <input id="mat-title" class="form-input" />
        <label class="form-label">PDF URL or public link</label>
        <input id="mat-url" class="form-input" />
        <div class="d-flex justify-end gap-8"><button type="button" id="mat-cancel" class="btn btn-muted">Cancel</button><button type="submit" class="btn btn-orange">Add</button></div>
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
      listDiv.innerHTML = '<div class="card p-20 text-muted text-center">Loading…</div>';
      const mats = await getTeacherMaterials();
      listDiv.innerHTML = mats.length === 0 ? '<div class="empty">No materials yet.</div>' : mats.map((m: any) => `
        <div class="card p-12 mb-8">
          <div class="d-flex" style="justify-content:space-between;align-items:center">
            <div>
              <div class="fw-700">${esc(m.title)}</div>
              <div class="text-sm text-muted">${esc(m.url)}</div>
            </div>
            <div class="text-xs text-muted">${new Date(m.createdAt).toLocaleString()}</div>
          </div>
        </div>`).join('');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to add material');
    }
  });
}
