import { showToast } from '../main.js';
import type { TeachingMethod } from '../types.js';

const METHODS: { value: TeachingMethod; label: string; description: string }[] = [
  { value: 'direct_instruction', label: 'Direct Instruction',  description: 'Teacher-led structured lessons.' },
  { value: 'inquiry_based',      label: 'Inquiry-Based',       description: 'Students explore and discover through questions.' },
  { value: 'flipped_classroom',  label: 'Flipped Classroom',   description: 'Content at home, practice in class.' },
  { value: 'blended',            label: 'Blended Learning',    description: 'Mix of online and in-person activities.' },
];

let selected: TeachingMethod = (localStorage.getItem('teaching_method') as TeachingMethod) ?? 'blended';

export async function renderSettings(): Promise<void> {
  const content = document.getElementById('content')!;

  function buildCards(): string {
    return METHODS.map(m => `
      <div class="method-card${selected === m.value ? ' selected' : ''}" data-method="${m.value}">
        <div class="radio"><div class="radio-dot"></div></div>
        <div>
          <div class="method-label">${m.label}</div>
          <div class="method-desc">${m.description}</div>
        </div>
      </div>`).join('');
  }

  content.innerHTML = `
    <div class="list-header" style="margin-bottom:8px">
      <h2>Settings</h2>
    </div>
    <p style="color:var(--muted);font-size:14px;margin-bottom:20px">
      Set the default teaching approach for this school.
    </p>
    <div id="method-list">${buildCards()}</div>
    <button class="btn btn-green" id="save-settings-btn" style="margin-top:8px;padding:14px 28px;font-size:15px;width:100%;max-width:320px">
      Save Settings
    </button>`;

  document.getElementById('method-list')!.addEventListener('click', (e) => {
    const card = (e.target as HTMLElement).closest<HTMLElement>('[data-method]');
    if (!card) return;
    selected = card.dataset['method'] as TeachingMethod;
    // Re-render just the cards
    document.getElementById('method-list')!.innerHTML = buildCards();
  });

  document.getElementById('save-settings-btn')!.addEventListener('click', () => {
    localStorage.setItem('teaching_method', selected);
    const label = METHODS.find(m => m.value === selected)?.label ?? selected;
    showToast(`Teaching method saved: ${label}`);
  });
}
