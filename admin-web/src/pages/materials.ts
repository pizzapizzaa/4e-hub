import { getMaterialsConfig, getSchools, updateMaterialsConfig } from '../api.js';
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
