import { cvService } from '../../services/cv.service';
import { showToast } from '../../components/toast';
import { setButtonLoading } from '../../components/loader';
import { renderDashboard } from './dashboard.view';
import type { CV, CVBuiltData, CVTemplate, CVSkillGroup } from '../../types';

const TEMPLATES: { id: CVTemplate; label: string; desc: string; color: string }[] = [
  { id: 'modern',       label: 'Modern',       desc: 'Dark sidebar, two-column',   color: '#6c63ff' },
  { id: 'minimal',      label: 'Minimal',      desc: 'Clean, single-column',       color: '#0f172a' },
  { id: 'bold',         label: 'Bold',         desc: 'Red header, high contrast',  color: '#dc2626' },
  { id: 'elegant',      label: 'Elegant',      desc: 'Serif fonts, gold accents',  color: '#d97706' },
  { id: 'professional', label: 'Professional', desc: 'Blue accent, icon sections', color: '#2563eb' },
  { id: 'nova',         label: 'Nova',         desc: 'Gradient hero, glassmorphic', color: '#0ea5e9' },
  { id: 'creative',     label: 'Creative',     desc: 'Asymmetric, modern dots',    color: '#ec4899' },
  { id: 'executive',    label: 'Executive',    desc: 'Formal, double-column',      color: '#475569' },
];

let currentTemplate: CVTemplate = 'modern';
let currentAccentColor: string = '#6c63ff';
let cvData: CVBuiltData = sampleData();
let editingCV: CV | null = null;
let previewDebounce: ReturnType<typeof setTimeout> | null = null;

const PRESET_COLORS = ['#6c63ff', '#2563eb', '#0ea5e9', '#0f172a', '#dc2626', '#d97706', '#10b981', '#ec4899', '#7c3aed', '#f43f5e'];

function getDefaultColor(tpl: CVTemplate): string {
  return TEMPLATES.find(t => t.id === tpl)?.color || '#6c63ff';
}

function sampleData(): CVBuiltData {
  return {
    name: 'Alex Morgan',
    title: 'Senior Software Engineer',
    email: 'alex.morgan@email.com',
    phone: '+1 (555) 012-3456',
    location: 'San Francisco, CA',
    website: 'linkedin.com/in/alexmorgan',
    summary: 'Passionate software engineer with 6+ years of experience building scalable web applications. Skilled in full-stack development, cloud architecture, and leading cross-functional teams to deliver high-impact products.',
    experience: [
      { id: 'e1', role: 'Senior Software Engineer', company: 'Stripe', startDate: 'Jan 2022', endDate: '', current: true, description: 'Led development of payment infrastructure serving 10M+ transactions/day. Reduced API latency by 40% through caching and query optimization.' },
      { id: 'e2', role: 'Software Engineer', company: 'Airbnb', startDate: 'Mar 2019', endDate: 'Dec 2021', current: false, description: 'Built and maintained core booking platform features. Collaborated with design and product teams to ship 3 major feature releases.' },
      { id: 'e3', role: 'Junior Developer', company: 'Startup Labs', startDate: 'Jun 2017', endDate: 'Feb 2019', current: false, description: 'Developed React-based dashboards and REST APIs for B2B SaaS clients.' },
    ],
    education: [
      { id: 'ed1', institution: 'UC Berkeley', degree: 'B.Sc.', field: 'Computer Science', startDate: '2013', endDate: '2017', current: false },
    ],
    skills: [
      { id: 's1', category: 'Frontend', skills: 'React, TypeScript, Next.js, Tailwind CSS' },
      { id: 's2', category: 'Backend', skills: 'Node.js, Go, PostgreSQL, Redis' },
      { id: 's3', category: 'DevOps', skills: 'AWS, Docker, Kubernetes, CI/CD' },
    ],
    languages: [
      { id: 'l1', language: 'English', level: 'Native' },
      { id: 'l2', language: 'Spanish', level: 'Conversational' },
    ],
  };
}
function uid(): string { return Math.random().toString(36).slice(2,9); }
function esc(s: string): string {
  return (s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

export function openCVBuilder(cv: CV | null, onSuccess: () => void): void {
  editingCV = cv;
  currentTemplate = cv?.template || 'modern';
  currentAccentColor = cv?.accentColor || getDefaultColor(currentTemplate);
  cvData = cv?.cvData ? structuredClone(cv.cvData) : sampleData();
  document.getElementById('app')!.innerHTML = builderShell(cv?.title||'', cv?.description||'');

  document.querySelectorAll('.tpl-card').forEach(card => {
    card.addEventListener('click', () => {
      currentTemplate = (card as HTMLElement).dataset['tpl'] as CVTemplate;
      // When template changes, if current color is default for old template, update it
      const oldDefault = getDefaultColor(document.querySelector('.tpl-card--active')?.getAttribute('data-tpl') as CVTemplate);
      if (currentAccentColor === oldDefault) {
        currentAccentColor = getDefaultColor(currentTemplate);
        const colorInput = document.getElementById('b-accent-color') as HTMLInputElement;
        if (colorInput) colorInput.value = currentAccentColor;
      }
      
      document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('tpl-card--active'));
      card.classList.add('tpl-card--active');
      schedulePreview();
    });
  });
  document.querySelector(`.tpl-card[data-tpl="${currentTemplate}"]`)?.classList.add('tpl-card--active');

  const colorInput = document.getElementById('b-accent-color') as HTMLInputElement;
  colorInput?.addEventListener('input', () => {
    currentAccentColor = colorInput.value;
    schedulePreview();
  });

  document.querySelectorAll('.color-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      currentAccentColor = (btn as HTMLElement).dataset['color']!;
      if (colorInput) colorInput.value = currentAccentColor;
      schedulePreview();
    });
  });

  document.querySelectorAll('.builder-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const s = (tab as HTMLElement).dataset['section']!;
      document.querySelectorAll('.builder-tab').forEach(t => t.classList.remove('builder-tab--active'));
      tab.classList.add('builder-tab--active');
      document.querySelectorAll('.builder-section').forEach(el => el.classList.add('hidden'));
      document.getElementById(`section-${s}`)?.classList.remove('hidden');
    });
  });

  bindPersonalFields();
  renderExperienceList();
  renderEducationList();
  renderSkillsList();
  renderLanguagesList();
  schedulePreview();
  initPreviewScale();

  document.getElementById('builder-back')?.addEventListener('click', () => { renderDashboard(); onSuccess(); });
  document.getElementById('builder-save')?.addEventListener('click', () => saveCV(onSuccess));

  // Mobile preview FAB
  document.getElementById('mobile-preview-fab')?.addEventListener('click', () => {
    schedulePreview();
    setTimeout(() => openFullscreenPreview(), 100);
  });
}

function builderShell(title: string, desc: string): string {
  return `<div class="builder-layout">
    <nav class="navbar">
      <div class="navbar__brand">
        <div class="navbar__brand-logo">
          <i class="fa-solid fa-file-lines"></i>
        </div>
        <span>CVora</span>
      </div>
      <div class="navbar__actions">
        <button id="builder-back" class="btn btn--ghost btn--sm"><i class="fa-solid fa-arrow-left"></i> Back</button>
        <button id="builder-save" class="btn btn--primary btn--sm"><i class="fa-solid fa-floppy-disk"></i> Save CV</button>
      </div>
    </nav>
    <div class="builder-body">
      <div class="builder-panel">
        <div class="builder-meta">
          <div class="form-group"><label class="form-label">CV Title</label>
            <input id="b-cv-title" class="form-input" placeholder="e.g. Software Engineer Resume" value="${esc(title)}" /></div>
          <div class="form-group"><label class="form-label">Description</label>
            <input id="b-cv-desc" class="form-input" placeholder="Short description..." value="${esc(desc)}" /></div>
        </div>
        <div class="builder-block">
          <div class="builder-block__title"><i class="fa-solid fa-palette"></i> Template</div>
          <div class="tpl-grid">${TEMPLATES.map(t =>
            `<button class="tpl-card" data-tpl="${t.id}">
              <span class="tpl-dot" style="background:${t.color}"></span>
              <span class="tpl-label">${t.label}</span>
              <span class="tpl-desc">${t.desc}</span>
            </button>`).join('')}</div>
        </div>
        <div class="builder-block">
          <div class="builder-block__title"><i class="fa-solid fa-droplet"></i> Accent Color</div>
          <div class="color-picker-group">
            <input id="b-accent-color" type="color" class="color-picker-input" value="${currentAccentColor}" />
            <div class="color-presets">
              ${PRESET_COLORS.map(c => `<button class="color-preset" data-color="${c}" style="background:${c}"></button>`).join('')}
            </div>
          </div>
        </div>
        <div class="builder-tabs">
          <button class="builder-tab builder-tab--active" data-section="personal"><i class="fa-solid fa-user"></i> Personal</button>
          <button class="builder-tab" data-section="experience"><i class="fa-solid fa-briefcase"></i> Experience</button>
          <button class="builder-tab" data-section="education"><i class="fa-solid fa-graduation-cap"></i> Education</button>
          <button class="builder-tab" data-section="skills"><i class="fa-solid fa-code"></i> Skills</button>
          <button class="builder-tab" data-section="languages"><i class="fa-solid fa-language"></i> Languages</button>
        </div>
        <div id="section-personal" class="builder-section">
          ${ifield('b-name','Full Name','text','Jane Doe')}
          ${ifield('b-jobtitle','Job Title','text','Software Engineer')}
          ${ifield('b-email','Email','email','jane@example.com')}
          ${ifield('b-phone','Phone','tel','+1 555 000 0000')}
          ${ifield('b-location','Location','text','New York, USA')}
          ${ifield('b-website','Website / LinkedIn','url','https://linkedin.com/in/...')}
          <div class="form-group"><label class="form-label">Summary</label>
            <textarea id="b-summary" class="form-input form-textarea" rows="4" placeholder="A brief professional summary...">${esc(cvData.summary)}</textarea></div>
        </div>
        <div id="section-experience" class="builder-section hidden"><div id="exp-list"></div>
          <button class="btn btn--primary btn--sm" id="add-exp"><i class="fa-solid fa-plus"></i> Add Experience</button></div>
        <div id="section-education" class="builder-section hidden"><div id="edu-list"></div>
          <button class="btn btn--primary btn--sm" id="add-edu"><i class="fa-solid fa-plus"></i> Add Education</button></div>
        <div id="section-skills" class="builder-section hidden"><div id="skills-list"></div>
          <button class="btn btn--primary btn--sm" id="add-skill"><i class="fa-solid fa-plus"></i> Add Skill Group</button></div>
        <div id="section-languages" class="builder-section hidden"><div id="lang-list"></div>
          <button class="btn btn--primary btn--sm" id="add-lang"><i class="fa-solid fa-plus"></i> Add Language</button></div>
      </div>
      <div class="builder-preview">
        <div class="preview-label">
          <i class="fa-solid fa-eye"></i> Live Preview
          <div class="preview-actions">
            <button class="preview-action-btn" id="zoom-out" title="Zoom out"><i class="fa-solid fa-minus"></i></button>
            <span class="zoom-level" id="zoom-level">100%</span>
            <button class="preview-action-btn" id="zoom-in" title="Zoom in"><i class="fa-solid fa-plus"></i></button>
            <button class="preview-action-btn" id="zoom-reset" title="Fit to screen"><i class="fa-solid fa-expand-arrows-alt"></i></button>
            <div class="preview-divider"></div>
            <button class="preview-action-btn preview-action-btn--accent" id="fullscreen-btn" title="Full screen preview">
              <i class="fa-solid fa-up-right-and-down-left-from-center"></i> Full Screen
            </button>
          </div>
        </div>
        <div class="preview-frame-wrap" id="preview-wrap">
          <div class="preview-size-wrap" id="preview-size-wrap">
            <div class="preview-scaler" id="preview-scaler">
              <iframe id="preview-iframe" class="preview-iframe" title="CV Preview"></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
    <button id="mobile-preview-fab" class="mobile-preview-fab" title="Preview CV">
      <i class="fa-solid fa-eye"></i>
    </button>
  </div>`;
}

function ifield(id: string, label: string, type: string, placeholder: string): string {
  const key = id.replace('b-','');
  const val = esc((cvData as unknown as Record<string,string>)[key] || '');
  return `<div class="form-group"><label class="form-label" for="${id}">${label}</label>
    <input id="${id}" type="${type}" class="form-input" placeholder="${placeholder}" value="${val}" /></div>`;
}

function bindPersonalFields(): void {
  const map: [string, keyof CVBuiltData][] = [
    ['b-name','name'],['b-jobtitle','title'],['b-email','email'],
    ['b-phone','phone'],['b-location','location'],['b-website','website'],['b-summary','summary'],
  ];
  map.forEach(([id, key]) => {
    const el = document.getElementById(id) as HTMLInputElement|HTMLTextAreaElement;
    if (!el) return;
    el.value = (cvData[key] as string) || '';
    el.addEventListener('input', () => { (cvData as unknown as Record<string,string>)[key] = el.value; schedulePreview(); });
  });
}

function ecard(id: string, title: string, removeIdx: number, fields: string): string {
  // Use HTML5 details/summary for instant responsive collapse
  return `<details class="entry-card" data-id="${id}" open>
    <summary class="entry-card__header">
      <div class="entry-card__title-wrap">
        <i class="fa-solid fa-chevron-right details-icon"></i>
        <span class="entry-card__title">${title || 'Untitled'}</span>
      </div>
      <button class="btn-icon btn--delete entry-remove" data-index="${removeIdx}" title="Remove"><i class="fa-solid fa-trash"></i></button>
    </summary>
    <div class="entry-card__fields">${fields}</div>
  </details>`;
}
function ef(id: string, label: string, value: string, placeholder = ''): string {
  return `<div class="form-group"><label class="form-label">${label}</label>
    <input id="${id}" type="text" class="form-input" placeholder="${placeholder}" value="${esc(value)}" /></div>`;
}
function bindText(id: string, cb: (v: string) => void): void {
  const el = document.getElementById(id) as HTMLInputElement|HTMLTextAreaElement|null;
  el?.addEventListener('input', () => cb(el.value));
}
function bindCheck(id: string, cb: (v: boolean) => void): void {
  const el = document.getElementById(id) as HTMLInputElement|null;
  el?.addEventListener('change', () => cb(el.checked));
}
function refreshTitle(list: HTMLElement, i: number, v: string): void {
  const t = list.querySelectorAll('.entry-card__title');
  if (t[i]) t[i].textContent = v || 'Untitled';
}

function renderExperienceList(): void {
  const list = document.getElementById('exp-list')!;
  list.innerHTML = cvData.experience.map((e, i) => ecard(e.id, esc(e.role)||'New Experience', i,
    ef(`exp-role-${i}`,'Role / Position',e.role) +
    ef(`exp-company-${i}`,'Company',e.company) +
    ef(`exp-start-${i}`,'Start Date',e.startDate,'e.g. Jan 2022') +
    ef(`exp-end-${i}`,'End Date',e.endDate,'e.g. Dec 2023') +
    `<div class="form-group"><label class="form-label"><input type="checkbox" id="exp-current-${i}" ${e.current?'checked':''} /> Currently working here</label></div>` +
    `<div class="form-group"><label class="form-label">Description</label><textarea id="exp-desc-${i}" class="form-input form-textarea" rows="3" placeholder="Key responsibilities...">${esc(e.description)}</textarea></div>`
  )).join('');
  cvData.experience.forEach((e, i) => {
    bindText(`exp-role-${i}`,    v => { e.role=v; refreshTitle(list,i,v); schedulePreview(); });
    bindText(`exp-company-${i}`, v => { e.company=v; schedulePreview(); });
    bindText(`exp-start-${i}`,   v => { e.startDate=v; schedulePreview(); });
    bindText(`exp-end-${i}`,     v => { e.endDate=v; schedulePreview(); });
    bindText(`exp-desc-${i}`,    v => { e.description=v; schedulePreview(); });
    bindCheck(`exp-current-${i}`,v => { e.current=v; schedulePreview(); });
  });
  list.querySelectorAll('.entry-remove').forEach(btn => btn.addEventListener('click', () => {
    cvData.experience.splice(parseInt((btn as HTMLElement).dataset['index']!),1);
    renderExperienceList(); schedulePreview();
  }));
  document.getElementById('add-exp')?.addEventListener('click', () => {
    cvData.experience.push({id:uid(),company:'',role:'',startDate:'',endDate:'',current:false,description:''});
    renderExperienceList(); schedulePreview();
  });
}

function renderEducationList(): void {
  const list = document.getElementById('edu-list')!;
  list.innerHTML = cvData.education.map((e, i) => ecard(e.id, esc(e.institution)||'New Education', i,
    ef(`edu-inst-${i}`,'Institution',e.institution) +
    ef(`edu-degree-${i}`,'Degree',e.degree) +
    ef(`edu-field-${i}`,'Field of Study',e.field) +
    ef(`edu-start-${i}`,'Start Date',e.startDate,'e.g. Sep 2018') +
    ef(`edu-end-${i}`,'End Date',e.endDate,'e.g. Jun 2022') +
    `<div class="form-group"><label class="form-label"><input type="checkbox" id="edu-current-${i}" ${e.current?'checked':''} /> Currently studying</label></div>`
  )).join('');
  cvData.education.forEach((e, i) => {
    bindText(`edu-inst-${i}`,   v => { e.institution=v; refreshTitle(list,i,v); schedulePreview(); });
    bindText(`edu-degree-${i}`, v => { e.degree=v; schedulePreview(); });
    bindText(`edu-field-${i}`,  v => { e.field=v; schedulePreview(); });
    bindText(`edu-start-${i}`,  v => { e.startDate=v; schedulePreview(); });
    bindText(`edu-end-${i}`,    v => { e.endDate=v; schedulePreview(); });
    bindCheck(`edu-current-${i}`,v => { e.current=v; schedulePreview(); });
  });
  list.querySelectorAll('.entry-remove').forEach(btn => btn.addEventListener('click', () => {
    cvData.education.splice(parseInt((btn as HTMLElement).dataset['index']!),1);
    renderEducationList(); schedulePreview();
  }));
  document.getElementById('add-edu')?.addEventListener('click', () => {
    cvData.education.push({id:uid(),institution:'',degree:'',field:'',startDate:'',endDate:'',current:false});
    renderEducationList(); schedulePreview();
  });
}

function renderSkillsList(): void {
  const list = document.getElementById('skills-list')!;
  list.innerHTML = cvData.skills.map((s, i) => ecard(s.id, esc(s.category)||'Skill Group', i,
    ef(`skill-cat-${i}`,'Category',s.category,'e.g. Frontend') +
    ef(`skill-items-${i}`,'Skills (comma separated)',s.skills,'React, TypeScript, CSS')
  )).join('');
  cvData.skills.forEach((s, i) => {
    bindText(`skill-cat-${i}`,   v => { s.category=v; refreshTitle(list,i,v); schedulePreview(); });
    bindText(`skill-items-${i}`, v => { s.skills=v; schedulePreview(); });
  });
  list.querySelectorAll('.entry-remove').forEach(btn => btn.addEventListener('click', () => {
    cvData.skills.splice(parseInt((btn as HTMLElement).dataset['index']!),1);
    renderSkillsList(); schedulePreview();
  }));
  document.getElementById('add-skill')?.addEventListener('click', () => {
    cvData.skills.push({id:uid(),category:'',skills:''});
    renderSkillsList(); schedulePreview();
  });
}

function renderLanguagesList(): void {
  const list = document.getElementById('lang-list')!;
  list.innerHTML = (cvData.languages||[]).map((l, i) => ecard(l.id, esc(l.language)||'Language', i,
    ef(`lang-name-${i}`,'Language',l.language,'e.g. English') +
    ef(`lang-level-${i}`,'Level',l.level,'e.g. Native, Fluent, B2')
  )).join('');
  (cvData.languages||[]).forEach((l, i) => {
    bindText(`lang-name-${i}`,  v => { l.language=v; refreshTitle(list,i,v); schedulePreview(); });
    bindText(`lang-level-${i}`, v => { l.level=v; schedulePreview(); });
  });
  list.querySelectorAll('.entry-remove').forEach(btn => btn.addEventListener('click', () => {
    cvData.languages!.splice(parseInt((btn as HTMLElement).dataset['index']!),1);
    renderLanguagesList(); schedulePreview();
  }));
  document.getElementById('add-lang')?.addEventListener('click', () => {
    if (!cvData.languages) cvData.languages=[];
    cvData.languages.push({id:uid(),language:'',level:''});
    renderLanguagesList(); schedulePreview();
  });
}

function initPreviewScale(): void {
  const wrap = document.getElementById('preview-wrap');
  const scaler = document.getElementById('preview-scaler') as HTMLElement;
  if (!wrap || !scaler) return;

  const A4_W = 794;
  const A4_H = 1123;
  let manualZoom: number | null = null;

  function applyScale(zoom?: number): void {
    const pad = 48;
    const availW = wrap!.clientWidth - pad;
    const availH = wrap!.clientHeight - pad;
    const autoScale = Math.min(availW / A4_W, availH / A4_H);
    const scale = Math.max(zoom ?? autoScale, 0.1);

    scaler.style.setProperty('--scale', String(scale));
    scaler.style.marginLeft = `${(availW - A4_W * scale) / 2 + pad / 2}px`;
    scaler.style.marginTop = `${pad / 2}px`;
    scaler.style.marginBottom = `${-(A4_H * (1 - scale)) + pad / 2}px`;

    const lbl = document.getElementById('zoom-level');
    if (lbl) lbl.textContent = `${Math.round(scale * 100)}%`;
  }

  requestAnimationFrame(() => {
    applyScale();
    const ro = new ResizeObserver(() => { if (!manualZoom) applyScale(); });
    ro.observe(wrap!);

    document.getElementById('zoom-in')?.addEventListener('click', () => {
      const cur = parseFloat(scaler.style.getPropertyValue('--scale') || '1');
      manualZoom = Math.min(+(cur + 0.1).toFixed(2), 3);
      applyScale(manualZoom);
    });
    document.getElementById('zoom-out')?.addEventListener('click', () => {
      const cur = parseFloat(scaler.style.getPropertyValue('--scale') || '1');
      manualZoom = Math.max(+(cur - 0.1).toFixed(2), 0.2);
      applyScale(manualZoom);
    });
    document.getElementById('zoom-reset')?.addEventListener('click', () => {
      manualZoom = null;
      applyScale();
    });
  });

  document.getElementById('fullscreen-btn')?.addEventListener('click', openFullscreenPreview);
}

function openFullscreenPreview(): void {
  const existing = document.getElementById('cv-fullscreen-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'cv-fullscreen-overlay';
  overlay.className = 'cv-fullscreen-overlay';
  overlay.innerHTML = `
    <div class="cv-fullscreen-bar">
      <span class="cv-fullscreen-title"><i class="fa-solid fa-file-lines"></i> CV Preview</span>
      <div class="cv-fullscreen-controls">
        <button class="preview-action-btn" id="fs-zoom-out" title="Zoom out"><i class="fa-solid fa-minus"></i></button>
        <span class="zoom-level" id="fs-zoom-level">100%</span>
        <button class="preview-action-btn" id="fs-zoom-in" title="Zoom in"><i class="fa-solid fa-plus"></i></button>
        <button class="preview-action-btn" id="fs-zoom-fit" title="Fit to screen"><i class="fa-solid fa-expand-arrows-alt"></i></button>
        <div class="preview-divider"></div>
        <button class="preview-action-btn preview-action-btn--accent" id="fs-print" title="Download PDF">
          <i class="fa-solid fa-file-arrow-down"></i> PDF
        </button>
        <div class="preview-divider"></div>
        <button class="preview-action-btn preview-action-btn--danger" id="fs-close" title="Close">
          <i class="fa-solid fa-xmark"></i> Close
        </button>
      </div>
    </div>
    <div class="cv-fullscreen-body" id="fs-body">
      <div class="cv-fullscreen-scaler" id="fs-scaler">
        <iframe id="fs-iframe" class="preview-iframe" title="CV Full Preview"></iframe>
      </div>
    </div>`;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('cv-fullscreen-overlay--visible'));

  // Copy current HTML into the fullscreen iframe
  const srcIframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
  const fsIframe = document.getElementById('fs-iframe') as HTMLIFrameElement;
  const srcDoc = srcIframe?.contentDocument;
  if (srcDoc) {
    const fsDoc = fsIframe.contentDocument || fsIframe.contentWindow?.document;
    if (fsDoc) {
      fsDoc.open();
      fsDoc.write(srcDoc.documentElement.outerHTML);
      fsDoc.close();
    }
  }

  const fsBody = document.getElementById('fs-body')!;
  const fsScaler = document.getElementById('fs-scaler') as HTMLElement;
  const A4_W = 794;
  const A4_H = 1123;
  let fsManualZoom: number | null = null;

  // Declare ro at function scope so close() can access it
  let ro: ResizeObserver;

  function applyFsScale(zoom?: number): void {
    const pad = 64;
    const availW = fsBody.clientWidth - pad;
    const availH = fsBody.clientHeight - pad;
    const autoScale = Math.min(availW / A4_W, availH / A4_H);
    const scale = Math.max(zoom ?? autoScale, 0.1);
    fsScaler.style.setProperty('--scale', String(scale));
    const centeredMargin = (availW - A4_W * scale) / 2 + pad / 2;
    fsScaler.style.marginLeft = `${Math.max(centeredMargin, 0)}px`;
    fsScaler.style.marginTop = `${pad / 2}px`;
    fsScaler.style.marginBottom = `${-(A4_H * (1 - scale)) + pad / 2}px`;
    const lbl = overlay.querySelector('#fs-zoom-level') as HTMLElement;
    if (lbl) lbl.textContent = `${Math.round(scale * 100)}%`;
  }

  const close = () => {
    if (ro) ro.disconnect();
    overlay.classList.remove('cv-fullscreen-overlay--visible');
    overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
    document.removeEventListener('keydown', onKey);
  };

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }

  requestAnimationFrame(() => {
    applyFsScale();
    ro = new ResizeObserver(() => { if (!fsManualZoom) applyFsScale(); });
    ro.observe(fsBody);
  });

  // Wire controls — use overlay.querySelector to avoid ID conflicts with main preview
  overlay.querySelector('#fs-close')?.addEventListener('click', close);
  overlay.querySelector('#fs-print')?.addEventListener('click', () => {
    const fsIframeEl = overlay.querySelector('#fs-iframe') as HTMLIFrameElement;
    fsIframeEl?.contentWindow?.print();
  });
  overlay.querySelector('#fs-zoom-in')?.addEventListener('click', () => {
    const cur = parseFloat(fsScaler.style.getPropertyValue('--scale') || '1');
    fsManualZoom = Math.min(+(cur + 0.15).toFixed(2), 3);
    applyFsScale(fsManualZoom);
  });
  overlay.querySelector('#fs-zoom-out')?.addEventListener('click', () => {
    const cur = parseFloat(fsScaler.style.getPropertyValue('--scale') || '1');
    fsManualZoom = Math.max(+(cur - 0.15).toFixed(2), 0.2);
    applyFsScale(fsManualZoom);
  });
  overlay.querySelector('#fs-zoom-fit')?.addEventListener('click', () => {
    fsManualZoom = null;
    applyFsScale();
  });

  document.addEventListener('keydown', onKey);
}

function schedulePreview(): void {
  if (previewDebounce) clearTimeout(previewDebounce);
  previewDebounce = setTimeout(() => {
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (!iframe) return;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;
    doc.open(); doc.write(buildHtml(cvData, currentTemplate, currentAccentColor)); doc.close();
  }, 350);
}

async function saveCV(onSuccess: () => void): Promise<void> {
  const btn = document.getElementById('builder-save') as HTMLButtonElement;
  const title = (document.getElementById('b-cv-title') as HTMLInputElement).value.trim();
  const description = (document.getElementById('b-cv-desc') as HTMLInputElement).value.trim();
  if (!title) { showToast({message:'CV title is required',type:'warning'}); return; }
  if (!cvData.name) { showToast({message:'Full name is required',type:'warning'}); return; }
  setButtonLoading(btn, true);
  const res = editingCV
    ? await cvService.updateBuilt({id:editingCV.id,title,description,cvData,template:currentTemplate,accentColor:currentAccentColor})
    : await cvService.createBuilt({title,description,cvData,template:currentTemplate,accentColor:currentAccentColor});
  setButtonLoading(btn, false);
  if (res.success) {
    showToast({message:`CV ${editingCV?'updated':'created'} successfully!`,type:'success'});
    renderDashboard(); onSuccess();
  } else {
    showToast({message:res.error||'Save failed',type:'error'});
  }
}

// ─── Client-side HTML builder ─────────────────────────────────────────────────
function buildHtml(d: CVBuiltData, t: CVTemplate, a: string): string {
  const gf = `<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800;900&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet"/>`;
  const base = `*{box-sizing:border-box;margin:0;padding:0;min-width:0}html,body{overflow:hidden;background:#fff}body{font-family:'Inter',sans-serif;line-height:1.6;color:#1e293b;font-size:12px;word-break:break-word;overflow-wrap:break-word}ul,ol{padding-left:1.2rem;margin:.3rem 0}li{margin-bottom:.2rem}p{margin-bottom:.3rem}p:last-child{margin-bottom:0}strong{font-weight:700}.page{background:#fff;width:794px;min-height:1123px;height:auto;margin:0;overflow:hidden}`;
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"/>${gf}<style>${base}${tplCSS(t, a)}</style></head><body><div class="page">${tplBody(d,t)}</div></body></html>`;
}

function tplCSS(t: CVTemplate, a: string): string {
  const accent = a;
  const accentSoft = a + '22';
  const root = `:root{--accent:${accent};--accent-soft:${accentSoft}}`;

  if (t === 'modern') {
    return `${root}
      .page{display:grid;grid-template-columns:210px 1fr}
      .sidebar{background:linear-gradient(170deg,#1e1b4b,#312e81);color:#e2e8f0;padding:1.75rem 1.4rem;display:flex;flex-direction:column;gap:1.5rem;min-height:1123px}
      .sidebar h1{font-family:'Outfit',sans-serif;font-size:1.2rem;font-weight:900;color:#fff;line-height:1.2;word-break:break-word;overflow-wrap:break-word}
      .sidebar .job-title{font-size:.68rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.1em;margin-top:.2rem;word-break:break-word}
      .sidebar-section h3{font-size:.58rem;font-weight:800;text-transform:uppercase;letter-spacing:.15em;color:var(--accent);margin-bottom:.5rem;padding-bottom:.28rem;border-bottom:1px solid var(--accent-soft)}
      .contact-item{display:flex;align-items:flex-start;gap:.4rem;font-size:.68rem;margin-bottom:.35rem;color:#cbd5e1;word-break:break-all;overflow-wrap:anywhere}
      .skill-group{margin-bottom:.5rem}
      .skill-group-name{font-size:.64rem;font-weight:700;color:#c4b5fd;margin-bottom:.22rem;word-break:break-word}
      .skill-tags{display:flex;flex-wrap:wrap;gap:.2rem}
      .skill-tag{background:var(--accent-soft);color:#ddd6fe;padding:.1rem .42rem;border-radius:20px;font-size:.6rem;font-weight:600;word-break:break-word}
      .lang-item{display:flex;justify-content:space-between;gap:.4rem;font-size:.66rem;margin-bottom:.25rem;color:#cbd5e1}
      .lang-level{color:var(--accent);font-weight:600;flex-shrink:0}
      .main{padding:1.75rem 1.5rem;display:flex;flex-direction:column;gap:1.5rem;min-width:0}
      .summary-text{font-size:.75rem;color:#475569;line-height:1.7;background:#f8faff;padding:.8rem .9rem;border-radius:7px;border-left:3px solid var(--accent);word-break:break-word;overflow-wrap:break-word}
      .section-title{font-family:'Outfit',sans-serif;font-size:.82rem;font-weight:900;color:#1e1b4b;margin-bottom:.8rem;display:flex;align-items:center;gap:.45rem}
      .section-title::after{content:'';flex:1;height:2px;background:linear-gradient(to right,#e2e8f0,transparent)}
      .entry{margin-bottom:.8rem;padding-bottom:.8rem;border-bottom:1px solid #f1f5f9}
      .entry:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
      .entry-header{display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;flex-wrap:wrap}
      .entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
      .entry-title{font-weight:700;font-size:.75rem;color:#1e293b;word-break:break-word}
      .entry-sub{font-size:.68rem;color:var(--accent);font-weight:600;margin-top:.06rem;word-break:break-word}
      .entry-date{font-size:.62rem;color:#94a3b8;font-weight:600;white-space:nowrap;background:#f1f5f9;padding:.1rem .4rem;border-radius:20px;flex-shrink:0}
      .entry-desc{font-size:.68rem;color:#64748b;margin-top:.3rem;line-height:1.55;word-break:break-word;overflow-wrap:break-word}` + accentInject(t, a);
  }

  if (t === 'minimal') {
    return `${root}
      .page{padding:2.25rem 2.75rem}
      header{border-bottom:2px solid var(--accent);padding-bottom:1.1rem;margin-bottom:1.5rem}
      header h1{font-family:'Outfit',sans-serif;font-size:1.6rem;font-weight:900;letter-spacing:-.04em;color:var(--accent);word-break:break-word}
      .job-title{font-size:.76rem;color:#64748b;font-weight:500;margin-top:.18rem;word-break:break-word}
      .contact-row{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:.5rem}
      .contact-item{font-size:.68rem;color:#475569;word-break:break-all;overflow-wrap:anywhere}
      .summary-text{font-size:.75rem;color:#475569;line-height:1.75;margin-bottom:1.5rem;word-break:break-word;overflow-wrap:break-word}
      .section-title{font-family:'Outfit',sans-serif;font-size:.58rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:#94a3b8;margin-bottom:.7rem;margin-top:1.4rem}
      .entry{margin-bottom:1rem}
      .entry-header{display:flex;justify-content:space-between;align-items:baseline;gap:.6rem;flex-wrap:wrap}
      .entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
      .entry-title{font-weight:700;font-size:.76rem;color:var(--accent);word-break:break-word}
      .entry-sub{font-size:.7rem;color:#475569;margin-top:.06rem;word-break:break-word}
      .entry-date{font-size:.64rem;color:#94a3b8;flex-shrink:0;white-space:nowrap}
      .entry-desc{font-size:.7rem;color:#64748b;margin-top:.28rem;line-height:1.55;word-break:break-word;overflow-wrap:break-word}
      .skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.55rem}
      .skill-group-name{font-size:.64rem;font-weight:700;color:var(--accent);margin-bottom:.2rem;word-break:break-word}
      .skill-tags{display:flex;flex-wrap:wrap;gap:.2rem}
      .skill-tag{background:#f1f5f9;color:#475569;padding:.1rem .38rem;border-radius:4px;font-size:.6rem;font-weight:600;word-break:break-word}
      .lang-row{display:flex;justify-content:space-between;gap:.4rem;font-size:.7rem;padding:.28rem 0;border-bottom:1px solid #f1f5f9}
      .lang-level{color:#64748b;flex-shrink:0}` + accentInject(t, a);
  }

  if (t === 'bold') {
    return `${root}
      .page{background:#fff}
      header{background:var(--accent);color:#fff;padding:1.75rem 2.25rem}
      header h1{font-family:'Outfit',sans-serif;font-size:1.7rem;font-weight:900;letter-spacing:-.04em;word-break:break-word;overflow-wrap:break-word}
      .job-title{font-size:.76rem;font-weight:600;opacity:.85;margin-top:.2rem;word-break:break-word}
      .contact-row{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:.7rem}
      .contact-item{font-size:.68rem;opacity:.9;word-break:break-all;overflow-wrap:anywhere}
      .content{padding:1.75rem 2.25rem;display:grid;grid-template-columns:1fr 190px;gap:1.75rem}
      .main-col{min-width:0}
      .summary-text{font-size:.75rem;color:#374151;line-height:1.75;margin-bottom:1.4rem;word-break:break-word;overflow-wrap:break-word}
      .section-title{font-family:'Outfit',sans-serif;font-size:.74rem;font-weight:900;color:var(--accent);text-transform:uppercase;letter-spacing:.08em;margin-bottom:.7rem;display:flex;align-items:center;gap:.42rem}
      .section-title::before{content:'';width:3px;height:1em;background:var(--accent);border-radius:2px;flex-shrink:0}
      .entry{margin-bottom:.8rem}
      .entry-header{display:flex;justify-content:space-between;align-items:flex-start;gap:.5rem;flex-wrap:wrap}
      .entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
      .entry-title{font-weight:700;font-size:.76rem;color:#111827;word-break:break-word}
      .entry-sub{font-size:.68rem;color:var(--accent);font-weight:600;margin-top:.06rem;word-break:break-word}
      .entry-date{font-size:.62rem;color:#9ca3af;font-weight:600;flex-shrink:0;white-space:nowrap}
      .entry-desc{font-size:.68rem;color:#6b7280;margin-top:.28rem;line-height:1.55;word-break:break-word;overflow-wrap:break-word}
      .sidebar-col{display:flex;flex-direction:column;gap:1.25rem;min-width:0}
      .skill-group-name{font-size:.64rem;font-weight:700;color:#374151;margin-bottom:.25rem;word-break:break-word}
      .skill-tags{display:flex;flex-wrap:wrap;gap:.2rem}
      .skill-tag{background:var(--accent-soft);color:var(--accent);padding:.1rem .38rem;border-radius:4px;font-size:.6rem;font-weight:700;word-break:break-word}
      .lang-item{display:flex;justify-content:space-between;gap:.4rem;font-size:.68rem;padding:.25rem 0;border-bottom:1px solid #f3f4f6}
      .lang-level{color:var(--accent);font-weight:600;flex-shrink:0}` + accentInject(t, a);
  }

  if (t === 'elegant') {
    return `${root}
      .page{padding:2.75rem 2.75rem}
      header{text-align:center;margin-bottom:1.75rem;padding-bottom:1.5rem;border-bottom:1px solid #e7d5b3}
      header h1{font-family:'Playfair Display',serif;font-size:1.85rem;font-weight:900;color:#1c1917;letter-spacing:-.02em;word-break:break-word}
      .job-title{font-size:.72rem;color:var(--accent);font-weight:600;letter-spacing:.12em;text-transform:uppercase;margin-top:.28rem;word-break:break-word}
      .contact-row{display:flex;justify-content:center;flex-wrap:wrap;gap:1rem;margin-top:.6rem}
      .contact-item{font-size:.66rem;color:#78716c;word-break:break-all;overflow-wrap:anywhere}
      .summary-text{font-size:.75rem;color:#57534e;line-height:1.8;text-align:center;font-style:italic;margin-bottom:1.75rem;word-break:break-word;overflow-wrap:break-word}
      .section-title{font-family:'Playfair Display',serif;font-size:.82rem;font-weight:700;color:#1c1917;text-align:center;margin-bottom:.9rem;margin-top:1.5rem;display:flex;align-items:center;gap:.55rem;justify-content:center}
      .section-title::before,.section-title::after{content:'';flex:1;height:1px;background:linear-gradient(to right,transparent,var(--accent))}
      .section-title::after{background:linear-gradient(to left,transparent,var(--accent))}
      .entry{margin-bottom:1rem;padding-bottom:1rem;border-bottom:1px solid #fef3c7}
      .entry:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
      .entry-header{display:flex;justify-content:space-between;align-items:baseline;gap:.6rem;flex-wrap:wrap}
      .entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
      .entry-title{font-family:'Playfair Display',serif;font-weight:700;font-size:.76rem;color:#1c1917;word-break:break-word}
      .entry-sub{font-size:.7rem;color:var(--accent);font-weight:600;margin-top:.06rem;word-break:break-word}
      .entry-date{font-size:.64rem;color:#a8a29e;font-style:italic;flex-shrink:0;white-space:nowrap}
      .entry-desc{font-size:.7rem;color:#78716c;margin-top:.32rem;line-height:1.6;word-break:break-word;overflow-wrap:break-word}
      .skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem}
      .skill-group-name{font-size:.64rem;font-weight:700;color:var(--accent);margin-bottom:.25rem;text-transform:uppercase;letter-spacing:.08em;word-break:break-word}
      .skill-tags{display:flex;flex-wrap:wrap;gap:.25rem}
      .skill-tag{background:#fef3c7;color:var(--accent);padding:.1rem .45rem;border-radius:20px;font-size:.6rem;font-weight:600;word-break:break-word}
      .lang-row{display:flex;justify-content:space-between;gap:.4rem;font-size:.7rem;padding:.28rem 0;border-bottom:1px solid #fef3c7}
      .lang-level{color:var(--accent);font-style:italic;flex-shrink:0}` + accentInject(t, a);
  }

  if (t === 'professional') {
    return `${root}
      .prof-header{padding:1.75rem 2.25rem;border-bottom:3px solid var(--accent)}
      .prof-header h1{font-family:'Outfit',sans-serif;font-size:1.6rem;font-weight:900;color:#1e293b;letter-spacing:-.03em;word-break:break-word;overflow-wrap:break-word}
      .job-title{font-size:.74rem;color:var(--accent);font-weight:600;margin-top:.16rem;word-break:break-word}
      .contact-row{display:flex;flex-wrap:wrap;gap:.9rem;margin-top:.6rem}
      .contact-item{font-size:.68rem;color:#475569;display:flex;align-items:center;gap:.28rem;word-break:break-all;overflow-wrap:anywhere}
      .ci-icon{color:var(--accent);font-size:.64rem;flex-shrink:0}
      .prof-body{padding:1.5rem 2.25rem;display:flex;flex-direction:column;gap:1.4rem}
      .summary-text{font-size:.75rem;color:#475569;line-height:1.75;padding:.7rem .9rem;background:#eff6ff;border-radius:5px;border-left:3px solid var(--accent);word-break:break-word;overflow-wrap:break-word}
      .section-title{font-family:'Outfit',sans-serif;font-size:.6rem;font-weight:900;text-transform:uppercase;letter-spacing:.15em;color:var(--accent);margin-bottom:.7rem;display:flex;align-items:center;gap:.45rem;padding-bottom:.4rem;border-bottom:1.5px solid #dbeafe}
      .section-icon{width:16px;height:16px;background:var(--accent);border-radius:3px;display:inline-flex;align-items:center;justify-content:center;color:#fff;font-size:.52rem;flex-shrink:0}
      .entry{margin-bottom:.75rem;padding-bottom:.75rem;border-bottom:1px solid #f1f5f9}
      .entry:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
      .entry-header{display:flex;justify-content:space-between;align-items:flex-start;gap:.45rem;flex-wrap:wrap}
      .entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
      .entry-title{font-weight:700;font-size:.76rem;color:#1e293b;word-break:break-word}
      .entry-sub{font-size:.68rem;color:var(--accent);font-weight:600;margin-top:.06rem;word-break:break-word}
      .entry-date{font-size:.62rem;color:#94a3b8;font-weight:600;flex-shrink:0;white-space:nowrap}
      .entry-desc{font-size:.68rem;color:#64748b;margin-top:.28rem;line-height:1.55;word-break:break-word;overflow-wrap:break-word}
      .skills-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:.75rem}
      .skill-group-name{font-size:.62rem;font-weight:800;color:#1e293b;margin-bottom:.28rem;text-transform:uppercase;letter-spacing:.06em;word-break:break-word}
      .skill-list{list-style:none;padding:0}.skill-list li{font-size:.68rem;color:#475569;padding:.16rem 0;display:flex;align-items:flex-start;gap:.3rem;word-break:break-word;overflow-wrap:break-word}
      .skill-list li::before{content:"\u2022";color:var(--accent);font-weight:900;flex-shrink:0;margin-top:.1rem}
      .lang-row{display:flex;justify-content:space-between;gap:.4rem;font-size:.7rem;padding:.28rem 0;border-bottom:1px solid #f1f5f9}
      .lang-level{color:var(--accent);font-weight:600;flex-shrink:0}` + accentInject(t, a);
  }

  if (t === 'nova') {
    return `:root{--accent:${accent}}
      .nova-hero{background:#1e1b4b;padding:2rem 2.25rem 1.5rem;position:relative;overflow:hidden}
      .nova-hero::before{content:'';position:absolute;top:-60px;right:-60px;width:220px;height:220px;background:radial-gradient(circle,hsla(200,80%,50%,.25) 0%,transparent 70%);border-radius:50%}
      .nova-hero::after{content:'';position:absolute;bottom:-40px;left:30%;width:160px;height:160px;background:radial-gradient(circle,hsla(260,80%,50%,.2) 0%,transparent 70%);border-radius:50%}
      .nova-name{font-family:'Outfit',sans-serif;font-size:1.7rem;font-weight:900;color:#fff;letter-spacing:-.04em;line-height:1.1;word-break:break-word;position:relative;z-index:1}
      .nova-title{font-size:.72rem;font-weight:700;letter-spacing:.18em;text-transform:uppercase;margin-top:.3rem;background:linear-gradient(90deg,var(--accent),#a78bfa);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;position:relative;z-index:1;word-break:break-word}
      .nova-contact{display:flex;flex-wrap:wrap;gap:.5rem;margin-top:1rem;position:relative;z-index:1}
      .nova-chip{display:inline-flex;align-items:center;gap:.3rem;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.12);border-radius:20px;padding:.22rem .65rem;font-size:.62rem;color:rgba(255,255,255,.85);font-weight:600;word-break:break-all;overflow-wrap:anywhere}
      .nova-body{display:grid;grid-template-columns:1fr 200px;gap:0}
      .nova-main{padding:1.4rem 1.6rem;display:flex;flex-direction:column;gap:1.3rem;border-right:1px solid #f1f5f9;min-width:0}
      .nova-side{padding:1.4rem 1.2rem;background:#fafbff;display:flex;flex-direction:column;gap:1.3rem;min-width:0}
      .nova-summary{font-size:.72rem;color:#475569;line-height:1.75;padding:.75rem .9rem;background:linear-gradient(135deg,#f0f9ff,#faf5ff);border-radius:8px;border-left:3px solid var(--accent);word-break:break-word;overflow-wrap:break-word}
      .section-title{font-family:'Outfit',sans-serif;font-size:.56rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:var(--accent);margin-bottom:.7rem;display:flex;align-items:center;gap:.4rem}
      .section-title::after{content:'';flex:1;height:1.5px;background:linear-gradient(to right,#bae6fd,transparent)}
      .side-section-title{font-family:'Outfit',sans-serif;font-size:.56rem;font-weight:900;text-transform:uppercase;letter-spacing:.18em;color:#8b5cf6;margin-bottom:.65rem;display:flex;align-items:center;gap:.4rem}
      .side-section-title::after{content:'';flex:1;height:1.5px;background:linear-gradient(to right,#ddd6fe,transparent)}
      .entry{margin-bottom:.75rem;padding-bottom:.75rem;border-bottom:1px solid #f1f5f9;position:relative;padding-left:.85rem}
      .entry::before{content:'';position:absolute;left:0;top:.32rem;width:5px;height:5px;border-radius:50%;background:linear-gradient(135deg,var(--accent),#8b5cf6);flex-shrink:0}
      .entry:last-child{border-bottom:none;margin-bottom:0;padding-bottom:0}
      .entry-header{display:flex;justify-content:space-between;align-items:flex-start;gap:.45rem;flex-wrap:wrap}
      .entry-left{flex:1;min-width:0;word-break:break-word;overflow-wrap:break-word}
      .entry-title{font-weight:800;font-size:.72rem;color:#0f172a;word-break:break-word}
      .entry-sub{font-size:.64rem;color:var(--accent);font-weight:700;margin-top:.05rem;word-break:break-word}
      .entry-date{font-size:.58rem;color:#94a3b8;font-weight:600;flex-shrink:0;white-space:nowrap;background:#f1f5f9;padding:.08rem .38rem;border-radius:20px}
      .entry-desc{font-size:.65rem;color:#64748b;margin-top:.28rem;line-height:1.6;word-break:break-word;overflow-wrap:break-word}
      .skill-group-name{font-size:.6rem;font-weight:800;color:#1e293b;margin-bottom:.28rem;margin-top:.45rem;word-break:break-word}
      .skill-group-name:first-child{margin-top:0}
      .skill-pill{display:inline-flex;background:linear-gradient(135deg,#eff6ff,#faf5ff);border:1px solid #e0e7ff;border-radius:20px;padding:.16rem .5rem;font-size:.58rem;font-weight:700;color:var(--accent);margin:.12rem .08rem;word-break:break-word}
      .lang-item{display:flex;justify-content:space-between;align-items:center;gap:.4rem;padding:.28rem 0;border-bottom:1px solid #f1f5f9}
      .lang-item:last-child{border-bottom:none}
      .lang-name{font-size:.64rem;font-weight:700;color:#1e293b}
      .lang-badge{font-size:.56rem;font-weight:700;color:var(--accent);background:#f0f9ff;border:1px solid #bae6fd;border-radius:20px;padding:.08rem .42rem;flex-shrink:0}` + accentInject(t, a);
  }

  if (t === 'creative') {
    return `${root}
      .page{padding:2.5rem 2.5rem;display:flex;flex-direction:column;gap:1.5rem;position:relative}
      .page::before{content:'';position:absolute;top:0;right:0;width:300px;height:300px;background:radial-gradient(circle at 100% 0, var(--accent-soft), transparent 70%);z-index:0}
      .header{display:flex;justify-content:space-between;align-items:flex-end;position:relative;z-index:1;padding-bottom:1.5rem;border-bottom:4px solid var(--accent)}
      .name-wrap{display:flex;flex-direction:column;gap:.25rem}
      .name-wrap h1{font-family:'Outfit',sans-serif;font-size:1.8rem;font-weight:900;color:#0f172a;line-height:1;letter-spacing:-.03em}
      .name-wrap .job-title{font-size:.8rem;font-weight:700;color:var(--accent);text-transform:uppercase;letter-spacing:.12em}
      .contact-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:.4rem .9rem;font-size:.68rem;color:#475569}
      .contact-item{display:flex;align-items:center;gap:.35rem}
      .content-grid{display:grid;grid-template-columns:1fr 200px;gap:2rem;position:relative;z-index:1}
      .main-col{display:flex;flex-direction:column;gap:1.3rem}
      .side-col{display:flex;flex-direction:column;gap:1.3rem}
      .summary-text{font-size:.76rem;color:#475569;line-height:1.7;word-break:break-word}
      .section-title{font-family:'Outfit',sans-serif;font-size:.85rem;font-weight:900;color:#0f172a;margin-bottom:.8rem;display:flex;align-items:center;gap:.6rem;text-transform:uppercase;letter-spacing:.08em}
      .section-title::before{content:'';width:8px;height:8px;background:var(--accent);border-radius:2px;flex-shrink:0}
      .entry{margin-bottom:1rem;position:relative;padding-left:1.2rem}
      .entry::before{content:'';position:absolute;left:0;top:.4rem;width:2px;height:100%;background:#f1f5f9}
      .entry:last-child::before{display:none}
      .entry-dot{position:absolute;left:-3px;top:.35rem;width:8px;height:8px;background:#fff;border:2px solid var(--accent);border-radius:50%}
      .entry-header{display:flex;justify-content:space-between;align-items:baseline;gap:.5rem;flex-wrap:wrap}
      .entry-title{font-weight:800;font-size:.78rem;color:#1e293b}
      .entry-sub{font-size:.7rem;color:var(--accent);font-weight:700}
      .entry-date{font-size:.62rem;color:#94a3b8;font-weight:700;background:#f8fafc;padding:.15rem .45rem;border-radius:4px}
      .entry-desc{font-size:.7rem;color:#475569;margin-top:.4rem;line-height:1.6}
      .skill-group{margin-bottom:.7rem}
      .skill-group-name{font-size:.64rem;font-weight:800;color:#1e293b;margin-bottom:.3rem;text-transform:uppercase;letter-spacing:.04em}
      .skill-tags{display:flex;flex-wrap:wrap;gap:.25rem}
      .skill-tag{background:var(--accent-soft);color:var(--accent);padding:.15rem .45rem;border-radius:6px;font-size:.6rem;font-weight:700}
      .lang-item{display:flex;justify-content:space-between;padding:.3rem 0;border-bottom:1px dashed #e2e8f0;font-size:.7rem;color:#475569}
      .lang-level{font-weight:800;color:var(--accent)}` + accentInject(t, a);
  }

  if (t === 'executive') {
    return `${root}
      .page{padding:0;display:flex;flex-direction:column;min-height:1123px}
      .exec-header{background:#0f172a;color:#fff;padding:2.5rem 3rem;display:flex;justify-content:space-between;align-items:center;border-bottom:6px solid var(--accent)}
      .exec-name-block h1{font-family:'Playfair Display',serif;font-size:2rem;font-weight:900;letter-spacing:-.02em}
      .exec-name-block .job-title{font-size:.85rem;font-weight:600;color:var(--accent);text-transform:uppercase;letter-spacing:.15em;margin-top:.3rem}
      .exec-contact-block{display:flex;flex-direction:column;gap:.35rem;text-align:right;font-size:.7rem;color:rgba(255,255,255,0.8)}
      .exec-body{display:grid;grid-template-columns:1fr 220px;gap:2.5rem;padding:2.5rem 3rem;flex:1}
      .exec-section{margin-bottom:1.8rem}
      .section-title{font-family:'Outfit',sans-serif;font-size:.72rem;font-weight:900;color:#0f172a;text-transform:uppercase;letter-spacing:.18em;margin-bottom:1rem;padding-bottom:.4rem;border-bottom:2px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}
      .section-title::after{content:'';width:40px;height:3px;background:var(--accent)}
      .summary-text{font-size:.78rem;color:#334155;line-height:1.75;font-weight:500;word-break:break-word}
      .entry{margin-bottom:1.4rem}
      .entry-header{display:grid;grid-template-columns:1fr auto;gap:.5rem;margin-bottom:.35rem}
      .entry-title{font-weight:800;font-size:.8rem;color:#0f172a}
      .entry-sub{font-size:.72rem;color:var(--accent);font-weight:700;grid-column:1}
      .entry-date{font-size:.66rem;color:#64748b;font-weight:700;text-align:right}
      .entry-desc{font-size:.72rem;color:#475569;margin-top:.5rem;line-height:1.65}
      .exec-skill-group{margin-bottom:.8rem}
      .skill-group-name{font-size:.62rem;font-weight:900;color:#64748b;margin-bottom:.4rem;text-transform:uppercase;letter-spacing:.06em}
      .skill-tags{display:flex;flex-wrap:wrap;gap:.3rem}
      .skill-tag{border:1.5px solid #e2e8f0;color:#334155;padding:.15rem .45rem;border-radius:4px;font-size:.58rem;font-weight:700}
      .lang-row{display:flex;justify-content:space-between;padding:.4rem 0;border-bottom:1px solid #f1f5f9;font-size:.72rem;color:#334155}
      .lang-level{font-weight:800;color:var(--accent)}` + accentInject(t, a);
  }

  return '';
}

function accentInject(t: CVTemplate, c: string): string {
  if (!c) return '';
  if (t === 'modern')       return `.sidebar{background:${c}}.sidebar .job-title{color:rgba(255,255,255,0.7)}.sidebar-section h3{color:rgba(255,255,255,0.85);border-bottom-color:rgba(255,255,255,0.2)}.skill-group-name{color:rgba(255,255,255,0.9)}.lang-level{color:rgba(255,255,255,0.8)}.summary-text{border-left-color:${c}}.section-title::after{background:linear-gradient(to right,${c}44,transparent)}.entry-sub{color:${c}}.entry-date{background:${c}11;color:${c}}`;
  if (t === 'minimal')      return `header{border-bottom-color:${c}}.section-title{color:${c}88}`;
  if (t === 'bold')         return `header{background:${c}}.section-title{color:${c}}.section-title::before{background:${c}}.entry-sub{color:${c}}.skill-tag{background:${c}22;color:${c}}.lang-level{color:${c}}`;
  if (t === 'elegant')      return `.section-title::before,.section-title::after{background:linear-gradient(to right,transparent,${c})}.entry-sub{color:${c}}.skill-tag{background:${c}22;color:${c}}.lang-level{color:${c}}`;
  if (t === 'professional') return `.prof-header{border-bottom-color:${c}}.section-title{color:${c};border-bottom-color:${c}33}.section-icon{background:${c}}.entry-sub{color:${c}}.lang-badge{color:${c};border-color:${c}44;background:${c}11}`;
  if (t === 'nova')         return `.nova-hero{background:${c}}.nova-title{background:none;-webkit-text-fill-color:rgba(255,255,255,0.85);color:rgba(255,255,255,0.85)}.section-title{color:${c}}.section-title::after{background:linear-gradient(to right,${c}44,transparent)}.entry-sub{color:${c}}.entry::before{background:${c}}.skill-pill{color:${c};border-color:${c}33;background:${c}11}.lang-badge{color:${c};border-color:${c}44;background:${c}11}`;
  if (t === 'creative')     return `.page::before{background:radial-gradient(circle at 100% 0, ${c}22, transparent 70%)}.header{border-bottom-color:${c}}.name-wrap .job-title{color:${c}}.section-title::before{background:${c}}.entry-dot{border-color:${c}}.entry-sub{color:${c}}.skill-tag{background:${c}15;color:${c}}.lang-level{color:${c}}`;
  if (t === 'executive')    return `.exec-header{border-bottom-color:${c}}.exec-name-block .job-title{color:${c}}.section-title::after{background:${c}}.entry-sub{color:${c}}.lang-level{color:${c}}`;
  return '';
}

function parseMarkdown(text: string): string {
  if (!text) return '';
  let html = esc(text);
  
  // Bold (**text**) -> handle first
  html = html.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  // Italic (*text*) -> handle next
  html = html.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');
  
  // Bullets
  const lines = html.split('\n');
  let inList = false;
  const parsed = lines.map(line => {
    const t = line.trim();
    const match = t.match(/^[-*]\s+(.+)/) || t.match(/^[-*](.+)/);
    
    if (match) {
      const li = '<li>' + match[1].trim() + '</li>';
      if (!inList) { inList = true; return '<ul>' + li; }
      return li;
    } else {
      let res = '';
      if (inList) { inList = false; res += '</ul>'; }
      if (t) res += '<p>' + t + '</p>';
      return res;
    }
  });
  if (inList) parsed.push('</ul>');
  return parsed.join('');
}

function tplBody(d: CVBuiltData, t: CVTemplate): string {
  const contact = [d.email,d.phone,d.location,d.website].filter(Boolean)
    .map(v => `<span class="contact-item">${esc(v!)}</span>`).join('');

  const expItems = d.experience.map(e => {
    const date = `${esc(e.startDate)}${(e.endDate||e.current) ? ` \u2013 ${e.current?'Present':esc(e.endDate)}` : ''}`;
    const desc = e.description ? `<div class="entry-desc">${parseMarkdown(e.description)}</div>` : '';
    return `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${esc(e.role)}</div><div class="entry-sub">${esc(e.company)}</div></div><div class="entry-date">${date}</div></div>${desc}</div>`;
  }).join('');

  const eduItems = d.education.map(e => {
    const date = `${esc(e.startDate)}${(e.endDate||e.current) ? ` \u2013 ${e.current?'Present':esc(e.endDate)}` : ''}`;
    const deg = e.field ? `${esc(e.degree)} in ${esc(e.field)}` : esc(e.degree);
    return `<div class="entry"><div class="entry-header"><div class="entry-left"><div class="entry-title">${deg}</div><div class="entry-sub">${esc(e.institution)}</div></div><div class="entry-date">${date}</div></div></div>`;
  }).join('');

  const tags = (g: CVSkillGroup) => g.skills.split(',').map(s => `<span class="skill-tag">${esc(s.trim())}</span>`).join('');
  const skillsGrid = d.skills.map(g => `<div><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${tags(g)}</div></div>`).join('');
  const skillsList = d.skills.map(g => `<div><div class="skill-group-name">${esc(g.category)}</div><ul class="skill-list">${g.skills.split(',').map(s=>`<li>${esc(s.trim())}</li>`).join('')}</ul></div>`).join('');
  const langRows = (cls: string, lc: string) => (d.languages||[]).map(l => `<div class="${cls}"><span>${esc(l.language)}</span><span class="${lc}">${esc(l.level)}</span></div>`).join('');

  if (t === 'modern') {
    return `<div class="sidebar">
      <div><h1>${esc(d.name)}</h1><div class="job-title">${esc(d.title)}</div></div>
      <div class="sidebar-section"><h3>Contact</h3>
        ${d.email?`<div class="contact-item">✉ ${esc(d.email)}</div>`:''}
        ${d.phone?`<div class="contact-item">✆ ${esc(d.phone)}</div>`:''}
        ${d.location?`<div class="contact-item">⌖ ${esc(d.location)}</div>`:''}
        ${d.website?`<div class="contact-item">⊕ ${esc(d.website)}</div>`:''}
      </div>
      ${d.skills.length?`<div class="sidebar-section"><h3>Skills</h3>${d.skills.map(g=>`<div class="skill-group"><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${tags(g)}</div></div>`).join('')}</div>`:''}
      ${d.languages?.length?`<div class="sidebar-section"><h3>Languages</h3>${langRows('lang-item','lang-level')}</div>`:''}
    </div>
    <div class="main">
      ${d.summary?`<div class="summary-text">${parseMarkdown(d.summary)}</div>`:''}
      ${d.experience.length?`<div><div class="section-title">Experience</div>${expItems}</div>`:''}
      ${d.education.length?`<div><div class="section-title">Education</div>${eduItems}</div>`:''}
    </div>`;
  }

  if (t === 'bold') {
    return `<header><h1>${esc(d.name)}</h1><div class="job-title">${esc(d.title)}</div><div class="contact-row">${contact}</div></header>
    <div class="content">
      <div class="main-col">
        ${d.summary?`<div class="summary-text" style="margin-bottom: 1.5rem;">${parseMarkdown(d.summary)}</div>`:''}
        ${d.experience.length?`<div class="section-title">Experience</div>${expItems}`:''}
        ${d.education.length?`<div class="section-title">Education</div>${eduItems}`:''}
      </div>
      <div class="sidebar-col">
        ${d.skills.length?`<div><div class="section-title">Skills</div>${d.skills.map(g=>`<div style="margin-bottom:.5rem"><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${tags(g)}</div></div>`).join('')}</div>`:''}
        ${d.languages?.length?`<div><div class="section-title">Languages</div>${langRows('lang-item','lang-level')}</div>`:''}
      </div>
    </div>`;
  }

  if (t === 'professional') {
    const icon = (i: string) => `<span class="section-icon">${i}</span>`;
    return `<div class="prof-header">
      <h1>${esc(d.name)}</h1><div class="job-title">${esc(d.title)}</div>
      <div class="contact-row">
        ${d.email?`<span class="contact-item"><span class="ci-icon">✉</span>${esc(d.email)}</span>`:''}
        ${d.phone?`<span class="contact-item"><span class="ci-icon">✆</span>${esc(d.phone)}</span>`:''}
        ${d.location?`<span class="contact-item"><span class="ci-icon">⌖</span>${esc(d.location)}</span>`:''}
        ${d.website?`<span class="contact-item"><span class="ci-icon">⊕</span>${esc(d.website)}</span>`:''}
      </div>
    </div>
    <div class="prof-body">
      ${d.summary?`<div><div class="section-title">${icon('★')} Profil</div><div class="summary-text">${parseMarkdown(d.summary)}</div></div>`:''}
      ${d.experience.length?`<div><div class="section-title">${icon('▶')} Experience</div>${expItems}</div>`:''}
      ${d.education.length?`<div><div class="section-title">${icon('▶')} Education</div>${eduItems}</div>`:''}
      ${d.skills.length?`<div><div class="section-title">${icon('◆')} Skills</div><div class="skills-grid">${skillsList}</div></div>`:''}
      ${d.languages?.length?`<div><div class="section-title">${icon('◆')} Languages</div>${langRows('lang-row','lang-level')}</div>`:''}
    </div>`;
  }

  if (t === 'nova') {
    const chips = [d.email,d.phone,d.location,d.website].filter(Boolean)
      .map(v => `<span class="nova-chip">${esc(v!)}</span>`).join('');
    const sideSkills = d.skills.map(g =>
      `<div class="skill-group-name">${esc(g.category)}</div>${
        g.skills.split(',').map(s => `<span class="skill-pill">${esc(s.trim())}</span>`).join('')
      }`).join('');
    const sideLangs = (d.languages||[]).map(l =>
      `<div class="lang-item"><span class="lang-name">${esc(l.language)}</span><span class="lang-badge">${esc(l.level)}</span></div>`).join('');
    return `
    <div class="nova-hero">
      <div class="nova-name">${esc(d.name)}</div>
      <div class="nova-title">${esc(d.title)}</div>
      <div class="nova-contact">${chips}</div>
    </div>
    <div class="nova-body">
      <div class="nova-main">
        ${d.summary?`<div><div class="section-title">About</div><div class="nova-summary">${parseMarkdown(d.summary)}</div></div>`:''}
        ${d.experience.length?`<div><div class="section-title">Experience</div>${expItems}</div>`:''}
        ${d.education.length?`<div><div class="section-title">Education</div>${eduItems}</div>`:''}
      </div>
      <div class="nova-side">
        ${d.skills.length?`<div><div class="side-section-title">Skills</div>${sideSkills}</div>`:''}
        ${d.languages?.length?`<div><div class="side-section-title">Languages</div>${sideLangs}</div>`:''}
      </div>
    </div>`;
  }

  if (t === 'creative') {
    const contactGrid = [
      d.email ? `<div class="contact-item">✉ ${esc(d.email)}</div>` : '',
      d.phone ? `<div class="contact-item">✆ ${esc(d.phone)}</div>` : '',
      d.location ? `<div class="contact-item">⌖ ${esc(d.location)}</div>` : '',
      d.website ? `<div class="contact-item">⊕ ${esc(d.website)}</div>` : ''
    ].join('');
    
    const creativeExp = d.experience.map(e => {
      const date = `${esc(e.startDate)}${(e.endDate||e.current) ? ` \u2013 ${e.current?'Present':esc(e.endDate)}` : ''}`;
      return `<div class="entry"><div class="entry-dot"></div><div class="entry-header"><div class="entry-title">${esc(e.role)}</div><div class="entry-date">${date}</div></div><div class="entry-sub">${esc(e.company)}</div>${e.description?`<div class="entry-desc">${parseMarkdown(e.description)}</div>`:''}</div>`;
    }).join('');

    const creativeEdu = d.education.map(e => {
      const date = `${esc(e.startDate)}${(e.endDate||e.current) ? ` \u2013 ${e.current?'Present':esc(e.endDate)}` : ''}`;
      const deg = e.field ? `${esc(e.degree)} in ${esc(e.field)}` : esc(e.degree);
      return `<div class="entry"><div class="entry-dot"></div><div class="entry-header"><div class="entry-title">${deg}</div><div class="entry-date">${date}</div></div><div class="entry-sub">${esc(e.institution)}</div></div>`;
    }).join('');

    return `
    <div class="header">
      <div class="name-wrap">
        <h1>${esc(d.name)}</h1>
        <div class="job-title">${esc(d.title)}</div>
      </div>
      <div class="contact-grid">${contactGrid}</div>
    </div>
    <div class="content-grid">
      <div class="main-col">
        ${d.summary?`<div><div class="section-title">About Me</div><div class="summary-text">${parseMarkdown(d.summary)}</div></div>`:''}
        ${d.experience.length?`<div><div class="section-title">Experience</div>${creativeExp}</div>`:''}
        ${d.education.length?`<div><div class="section-title">Education</div>${creativeEdu}</div>`:''}
      </div>
      <div class="side-col">
        ${d.skills.length?`<div><div class="section-title">Skills</div>${d.skills.map(g=>`<div class="skill-group"><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${tags(g)}</div></div>`).join('')}</div>`:''}
        ${d.languages?.length?`<div><div class="section-title">Languages</div>${langRows('lang-item', 'lang-level')}</div>`:''}
      </div>
    </div>`;
  }

  if (t === 'executive') {
    const execContact = [
      d.email ? `<span>✉ ${esc(d.email)}</span>` : '',
      d.phone ? `<span>✆ ${esc(d.phone)}</span>` : '',
      d.location ? `<span>⌖ ${esc(d.location)}</span>` : '',
      d.website ? `<span>⊕ ${esc(d.website)}</span>` : ''
    ].filter(Boolean).join('');

    return `
    <div class="exec-header">
      <div class="exec-name-block">
        <h1>${esc(d.name)}</h1>
        <div class="exec-title">${esc(d.title)}</div>
      </div>
      <div class="exec-contact-block">${execContact}</div>
    </div>
    <div class="exec-body">
      <div class="exec-main">
        ${d.summary?`<div class="exec-section"><div class="section-title">Executive Profile</div><div class="summary-text">${parseMarkdown(d.summary)}</div></div>`:''}
        ${d.experience.length?`<div class="exec-section"><div class="section-title">Professional Experience</div>${expItems}</div>`:''}
      </div>
      <div class="exec-side">
        ${d.education.length?`<div class="exec-section"><div class="section-title">Education</div>${eduItems}</div>`:''}
        ${d.skills.length?`<div class="exec-section"><div class="section-title">Core Competencies</div>${d.skills.map(g=>`<div class="exec-skill-group"><div class="skill-group-name">${esc(g.category)}</div><div class="skill-tags">${tags(g)}</div></div>`).join('')}</div>`:''}
        ${d.languages?.length?`<div class="exec-section"><div class="section-title">Languages</div>${langRows('lang-row', 'lang-level')}</div>`:''}
      </div>
    </div>`;
  }

  // minimal + elegant — single column
  return `<header><h1>${esc(d.name)}</h1><div class="job-title">${esc(d.title)}</div><div class="contact-row">${contact}</div></header>
    ${d.summary?`<p class="summary-text">${esc(d.summary)}</p>`:''}
    ${d.experience.length?`<div class="section-title">Experience</div>${expItems}`:''}
    ${d.education.length?`<div class="section-title">Education</div>${eduItems}`:''}
    ${d.skills.length?`<div class="section-title">Skills</div><div class="skills-grid">${skillsGrid}</div>`:''}
    ${d.languages?.length?`<div class="section-title">Languages</div>${langRows('lang-row','lang-level')}`:''}`;
}


