// ── Pages registry ────────────────────────────────────────────────────────────
import { renderDashboard } from './pages/dashboard.js';
import { renderLearners } from './pages/learners.js';
import { renderMaterials } from './pages/materials.js';
import { renderPrograms } from './pages/programs.js';
import { renderSchools } from './pages/schools.js';
import { renderSettings } from './pages/settings.js';
import { renderSync } from './pages/sync.js';
import { renderTeachers } from './pages/teachers.js';

export type PageId = 'dashboard' | 'schools' | 'programs' | 'teachers' | 'learners' | 'materials' | 'sync' | 'settings';

export interface NavItem {
  id: PageId;
  label: string;
  icon: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '<i class="ph ph-house"></i>' },
  { id: 'schools',   label: 'Schools',   icon: '<i class="ph ph-buildings"></i>' },
  { id: 'programs',  label: 'Programs',  icon: '<i class="ph ph-books"></i>' },
  { id: 'teachers',  label: 'Teachers',  icon: '<i class="ph ph-chalkboard-teacher"></i>' },
  { id: 'learners',  label: 'Learners',  icon: '<i class="ph ph-graduation-cap"></i>' },
  { id: 'materials', label: 'Materials', icon: '<i class="ph ph-folder-open"></i>' },
  { id: 'sync',      label: 'Sync',      icon: '<i class="ph ph-arrows-clockwise"></i>' },
  { id: 'settings',  label: 'Settings',  icon: '<i class="ph ph-gear-six"></i>' },
];

const PAGE_RENDERERS: Record<PageId, () => Promise<void>> = {
  dashboard: renderDashboard,
  schools:   renderSchools,
  programs:  renderPrograms,
  teachers:  renderTeachers,
  learners:  renderLearners,
  materials: renderMaterials,
  sync:      renderSync,
  settings:  renderSettings,
};

export function getPageRenderer(id: PageId) {
  return PAGE_RENDERERS[id];
}
